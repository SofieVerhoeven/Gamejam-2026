import Phaser from "phaser";
import { GAME_WIDTH, RAFT_WIDTH, RAFT_FLOOR_OFFSET, RAFT_FLOAT } from "../config.js";
import { playSound, SOUNDS } from "./audio.js";
import { getSeaY } from "./sea.js";
import { updatePlayerAnimation } from "./entities.js";

export function updateGameplay(scene, time, delta, endGame) {
    scene.survivalTime += delta / 1000;
    scene.timerText.setText(`Time: ${scene.survivalTime.toFixed(1)}s`);

    const raftAngle = updateRaft(scene, time, delta);
    const isStandingOnRaft = time - scene.lastRaftContact < 100;
    const isSlippery = time < scene.slipperyUntil;
    const isFrozen = time < scene.frozenUntil;
    updatePlayerFriction(scene, isSlippery);
    const jumpPressed = updatePlayerMovement(
        scene,
        isStandingOnRaft,
        isSlippery,
        isFrozen,
    );
    const left = scene.keys.left.isDown || scene.cursors.left.isDown;
    const right = scene.keys.right.isDown || scene.cursors.right.isDown;
    updatePlayerAnimation(scene, time, delta,
        isStandingOnRaft && !jumpPressed,
        left ? -1 : right ? 1 : 0);

    applyRaftGrip(scene, raftAngle, isStandingOnRaft, jumpPressed, isSlippery);

    const waterBelowPlayer = getSeaY(scene, scene.player.x, time);
    if (
        scene.player.y > waterBelowPlayer
        || scene.player.x < -40
        || scene.player.x > GAME_WIDTH + 40
    ) {
        scene.lives -= 1;
        scene.livesText.setText(`Lives: ${"❤️".repeat(scene.lives)}`);
        scene.bestScore = Math.max(scene.bestScore, scene.survivalTime);
        scene.bestScoreText.setText(`Best: ${scene.bestScore.toFixed(1)}s`);
        localStorage.setItem("ship-happens-best-score", scene.bestScore.toString());

        if (scene.lives <= 0) {
            endGame();
            return;
        }

        scene.matter.body.setPosition(scene.player.body, {
            x: GAME_WIDTH / 2,
            y: scene.raft.y - 75,
        });
        scene.matter.body.setVelocity(scene.player.body, { x: 0, y: 0 });
        scene.matter.body.setAngularVelocity(scene.player.body, 0);
        scene.player.setVisible(true);
        scene.lastRaftContact = time;
        scene.eventText.setText(`Life lost! ${scene.lives} remaining`);
    }
}

function updateRaft(scene, time, delta) {
    const isAnchorWeighted = time < scene.anchorWeightUntil;
    const svgScale = RAFT_WIDTH / 209;
    const raftHalfSample = (RAFT_FLOAT.hullRightX - RAFT_FLOAT.hullLeftX) * svgScale / 2;
    const waterLeft = getSeaY(scene, GAME_WIDTH / 2 - raftHalfSample, time);
    const waterRight = getSeaY(scene, GAME_WIDTH / 2 + raftHalfSample, time);
    const maxRaftAngle = Phaser.Math.DegToRad(RAFT_FLOAT.maxAngleDegrees);
    const anchorTilt = isAnchorWeighted ? scene.anchorTiltRadians : 0;
    const targetRaftAngle = Phaser.Math.Clamp(
        Math.atan2(waterRight - waterLeft, raftHalfSample * 2) + anchorTilt,
        -maxRaftAngle,
        maxRaftAngle,
    );

    // Ease toward the wave angle instead of making the raft rigidly snap to it.
    const normalizedDelta = Phaser.Math.Clamp(delta / 16.667, 0.25, 3);
    const rotationBlend = 1 - Math.pow(1 - RAFT_FLOAT.rotationFollow, normalizedDelta);
    const raftAngle = Phaser.Math.Linear(
        scene.previousRaftPose.angle,
        targetRaftAngle,
        rotationBlend,
    );

    // Match the visible hull rather than the texture bounds or body center.
    // Rotated samples account for curved waves under the entire wooden base.
    // Screen Y grows downward, so the smallest allowed center Y is the highest
    // water contact. Using the lowest contact would push the rigid hull through
    // every crest that rises above it.
    const anchorX = 209 / 2 + RAFT_FLOOR_OFFSET.x;
    const anchorY = 93 / 2 + RAFT_FLOOR_OFFSET.y;
    const localY = (RAFT_FLOAT.hullBottomY - anchorY) * svgScale;
    const cos = Math.cos(raftAngle);
    const sin = Math.sin(raftAngle);
    const sampleCount = Math.max(2, Math.round(RAFT_FLOAT.samples));
    let targetRaftY = Infinity;
    for (let i = 0; i < sampleCount; i++) {
        const svgX = Phaser.Math.Linear(RAFT_FLOAT.hullLeftX, RAFT_FLOAT.hullRightX, i / (sampleCount - 1));
        const localX = (svgX - anchorX) * svgScale;
        const worldX = GAME_WIDTH / 2 + localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;
        targetRaftY = Math.min(
            targetRaftY,
            getSeaY(scene, worldX, time) - rotatedY + RAFT_FLOAT.immersion,
        );
    }

    // Soft vertical following adds buoyant-looking lag. When a crest rises
    // quickly, clamp that lag so only a controlled amount crosses the hull.
    if (isAnchorWeighted) targetRaftY += 7;

    const followStrength = isAnchorWeighted
        ? RAFT_FLOAT.positionFollow * 0.55
        : RAFT_FLOAT.positionFollow;
    const positionBlend = 1 - Math.pow(1 - followStrength, normalizedDelta);
    const softenedRaftY = Phaser.Math.Linear(
        scene.previousRaftPose.y,
        targetRaftY,
        positionBlend,
    );
    const raftY = Math.min(
        softenedRaftY,
        targetRaftY + RAFT_FLOAT.maxWavePenetration,
    );

    const frameScale = Phaser.Math.Clamp(16.667 / Math.max(delta, 1), 0.5, 2);
    const angleVelocity = (raftAngle - scene.previousRaftPose.angle) * frameScale;
    const playerHeightAboveRaft = Math.max(0, raftY - scene.player.y);
    scene.raftVelocity = {
        x: Phaser.Math.Clamp(angleVelocity * playerHeightAboveRaft, -3, 3),
        y: Phaser.Math.Clamp((raftY - scene.previousRaftPose.y) * frameScale, -4, 4),
    };
    scene.previousRaftPose = { x: GAME_WIDTH / 2, y: raftY, angle: raftAngle };

    scene.matter.body.setPosition(scene.raft.body, { x: GAME_WIDTH / 2, y: raftY });
    scene.matter.body.setAngle(scene.raft.body, raftAngle);
    return raftAngle;
}

function updatePlayerMovement(scene, isStandingOnRaft, isSlippery, isFrozen) {
    const left = scene.keys.left.isDown || scene.cursors.left.isDown;
    const right = scene.keys.right.isDown || scene.cursors.right.isDown;

    if ((left || right) && isStandingOnRaft) {
        const movementSpeed = isFrozen ? 3.2 : 6;
        const targetSpeed = left ? -movementSpeed : movementSpeed;
        scene.matter.body.setVelocity(scene.player.body, {
            x: Phaser.Math.Linear(
                scene.player.body.velocity.x,
                targetSpeed,
                isFrozen ? 0.14 : isSlippery ? 0.12 : 0.28,
            ),
            y: scene.player.body.velocity.y,
        });
    } else if (left || right) {
        const airDirection = left ? -1 : 1;
        const maxAirSpeed = isFrozen ? 3.5 : 6.5;
        const airAcceleration = isFrozen ? 0.035 : 0.08;
        const airSpeed = Phaser.Math.Clamp(
            scene.player.body.velocity.x + airDirection * airAcceleration,
            -maxAirSpeed,
            maxAirSpeed,
        );
        scene.matter.body.setVelocity(scene.player.body, {
            x: airSpeed,
            y: scene.player.body.velocity.y,
        });
    } else if (isStandingOnRaft) {
        scene.matter.body.setVelocity(scene.player.body, {
            x: Phaser.Math.Linear(
                scene.player.body.velocity.x,
                0,
                isSlippery ? 0.008 : 0.12,
            ),
            y: scene.player.body.velocity.y,
        });
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(scene.keys.jump)
        || Phaser.Input.Keyboard.JustDown(scene.cursors.up);
    if (jumpPressed && isStandingOnRaft) {
        playSound(scene, SOUNDS.jump, { volume: 0.45 });
        const jumpSpeed = isFrozen ? -7.2 : -9;
        scene.matter.body.setVelocity(scene.player.body, {
            x: Phaser.Math.Clamp(scene.player.body.velocity.x + scene.raftVelocity.x, -8, 8),
            y: Phaser.Math.Clamp(jumpSpeed + scene.raftVelocity.y, -11, -6),
        });
        scene.lastRaftContact = -1000;
    }

    return jumpPressed;
}

function applyRaftGrip(scene, raftAngle, isStandingOnRaft, jumpPressed, isSlippery) {
    if (!isStandingOnRaft || jumpPressed) return;

    // On a banana the physics body has almost no friction and receives no
    // artificial slope compensation, allowing gravity and momentum to slide it.
    if (isSlippery) return;

    const gravityForce = 0.00115 * scene.player.body.mass;
    const downhillGravity = gravityForce * Math.sin(raftAngle);
    const footingForce = 0.0007 * scene.player.body.mass;
    scene.matter.body.applyForce(scene.player.body, scene.player.body.position, {
        x: -downhillGravity * Math.cos(raftAngle) - footingForce * Math.sin(raftAngle),
        y: -downhillGravity * Math.sin(raftAngle) + footingForce * Math.cos(raftAngle),
    });
}

function updatePlayerFriction(scene, isSlippery) {
    if (scene.playerIsSlippery === isSlippery) return;
    scene.playerIsSlippery = isSlippery;

    scene.matter.body.set(scene.player.body, {
        friction: isSlippery ? 0.001 : 0.15,
        frictionStatic: isSlippery ? 0 : 0.2,
    });
}
