import Phaser from "phaser";
import { GAME_WIDTH, RAFT_WIDTH, RAFT_FLOOR_OFFSET, RAFT_FLOAT } from "../config.js";
import { getSeaY } from "./sea.js";
import { updatePlayerAnimation } from "./entities.js";

export function updateGameplay(scene, time, delta, endGame) {
    scene.survivalTime += delta / 1000;
    scene.timerText.setText(`Time: ${scene.survivalTime.toFixed(1)}s`);

    const raftAngle = updateRaft(scene, time, delta);
    const isStandingOnRaft = time - scene.lastRaftContact < 100;
    const jumpPressed = updatePlayerMovement(scene, isStandingOnRaft);
    const left = scene.keys.left.isDown || scene.cursors.left.isDown;
    const right = scene.keys.right.isDown || scene.cursors.right.isDown;
    updatePlayerAnimation(scene, time, delta,
        isStandingOnRaft && !jumpPressed,
        left ? -1 : right ? 1 : 0);

    applyRaftGrip(scene, raftAngle, isStandingOnRaft, jumpPressed);

    const waterBelowPlayer = getSeaY(scene, scene.player.x, time);
    if (
        scene.player.y > waterBelowPlayer
        || scene.player.x < -40
        || scene.player.x > GAME_WIDTH + 40
    ) {
        endGame();
    }
}

function updateRaft(scene, time, delta) {
    const svgScale = RAFT_WIDTH / 209;
    const raftHalfSample = (RAFT_FLOAT.hullRightX - RAFT_FLOAT.hullLeftX) * svgScale / 2;
    const waterLeft = getSeaY(scene, GAME_WIDTH / 2 - raftHalfSample, time);
    const waterRight = getSeaY(scene, GAME_WIDTH / 2 + raftHalfSample, time);
    const maxRaftAngle = Phaser.Math.DegToRad(RAFT_FLOAT.maxAngleDegrees);
    const raftAngle = Phaser.Math.Clamp(
        Math.atan2(waterRight - waterLeft, raftHalfSample * 2),
        -maxRaftAngle,
        maxRaftAngle,
    );

    // Match the visible hull rather than the texture bounds or body center.
    // Rotated samples account for curved waves under the entire wooden base.
    // The lowest required position keeps gaps from opening below the hull.
    const anchorX = 209 / 2 + RAFT_FLOOR_OFFSET.x;
    const anchorY = 93 / 2 + RAFT_FLOOR_OFFSET.y;
    const localY = (RAFT_FLOAT.hullBottomY - anchorY) * svgScale;
    const cos = Math.cos(raftAngle);
    const sin = Math.sin(raftAngle);
    const sampleCount = Math.max(2, Math.round(RAFT_FLOAT.samples));
    let raftY = -Infinity;
    for (let i = 0; i < sampleCount; i++) {
        const svgX = Phaser.Math.Linear(RAFT_FLOAT.hullLeftX, RAFT_FLOAT.hullRightX, i / (sampleCount - 1));
        const localX = (svgX - anchorX) * svgScale;
        const worldX = GAME_WIDTH / 2 + localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;
        raftY = Math.max(raftY, getSeaY(scene, worldX, time) - rotatedY + RAFT_FLOAT.immersion);
    }

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

function updatePlayerMovement(scene, isStandingOnRaft) {
    const left = scene.keys.left.isDown || scene.cursors.left.isDown;
    const right = scene.keys.right.isDown || scene.cursors.right.isDown;

    if ((left || right) && isStandingOnRaft) {
        const targetSpeed = left ? -6 : 6;
        scene.matter.body.setVelocity(scene.player.body, {
            x: Phaser.Math.Linear(scene.player.body.velocity.x, targetSpeed, 0.28),
            y: scene.player.body.velocity.y,
        });
    } else if (left || right) {
        const airDirection = left ? -1 : 1;
        const airSpeed = Phaser.Math.Clamp(
            scene.player.body.velocity.x + airDirection * 0.08,
            -6.5,
            6.5,
        );
        scene.matter.body.setVelocity(scene.player.body, {
            x: airSpeed,
            y: scene.player.body.velocity.y,
        });
    } else if (isStandingOnRaft) {
        scene.matter.body.setVelocity(scene.player.body, {
            x: Phaser.Math.Linear(scene.player.body.velocity.x, 0, 0.12),
            y: scene.player.body.velocity.y,
        });
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(scene.keys.jump)
        || Phaser.Input.Keyboard.JustDown(scene.cursors.up);
    if (jumpPressed && isStandingOnRaft) {
        scene.matter.body.setVelocity(scene.player.body, {
            x: Phaser.Math.Clamp(scene.player.body.velocity.x + scene.raftVelocity.x, -8, 8),
            y: Phaser.Math.Clamp(-9 + scene.raftVelocity.y, -11, -7),
        });
        scene.lastRaftContact = -1000;
    }

    return jumpPressed;
}

function applyRaftGrip(scene, raftAngle, isStandingOnRaft, jumpPressed) {
    if (!isStandingOnRaft || jumpPressed) return;

    const gravityForce = 0.00115 * scene.player.body.mass;
    const downhillGravity = gravityForce * Math.sin(raftAngle);
    const footingForce = 0.0007 * scene.player.body.mass;
    scene.matter.body.applyForce(scene.player.body, scene.player.body.position, {
        x: -downhillGravity * Math.cos(raftAngle) - footingForce * Math.sin(raftAngle),
        y: -downhillGravity * Math.sin(raftAngle) + footingForce * Math.cos(raftAngle),
    });
}
