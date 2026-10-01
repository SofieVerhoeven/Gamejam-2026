import { GAME_WIDTH, SEA_LEVEL, RAFT_WIDTH, RAFT_HITBOX_HEIGHT, RAFT_FLOOR_OFFSET, PLAYER_VISUAL } from "../config.js";
import raftTextureUrl from "../assets/Raft.svg";
import playerIdleUrl from "../assets/Mannetje.svg";
import playerWalkUrl from "../assets/Mannetje_wandel.png";
import playerJumpUrl from "../assets/Mannetje_spring.png";

const RAFT_HEIGHT = RAFT_WIDTH * (93 / 209);

export function preloadEntities(scene) {
    scene.load.svg("raft", raftTextureUrl);
    scene.load.svg("player-idle", playerIdleUrl);
    scene.load.image("player-walk", playerWalkUrl);
    scene.load.image("player-jump", playerJumpUrl);
}

export function createRaft(scene) {
    const x = GAME_WIDTH / 2;
    const y = SEA_LEVEL;
    scene.raft = scene.add.image(x, y, "raft")
        .setDisplaySize(RAFT_WIDTH, RAFT_HEIGHT);

    scene.matter.add.gameObject(scene.raft, {
        shape: {
            type: "rectangle",
            width: RAFT_WIDTH,
            height: RAFT_HITBOX_HEIGHT,
        },
        isStatic: true,
        friction: 0.15,
        frictionStatic: 0.2,
        restitution: 0,
    });

    // Matter positions the image at the body center. Anchor the artwork at
    // the deck instead, keeping the floor aligned as the raft tilts and moves.
    scene.raft.setOrigin(
        0.5 + RAFT_FLOOR_OFFSET.x / 209,
        0.5 + RAFT_FLOOR_OFFSET.y / 93,
    );

    scene.previousRaftPose = { x, y, angle: 0 };
    scene.raftVelocity = { x: 0, y: 0 };
}

export function createPlayer(scene) {
    scene.player = scene.add.container(GAME_WIDTH / 2, SEA_LEVEL - 100);

    // Keep the visual separate from the physics container so animation does
    // not change the collision body. Feet stay at the body's lower edge.
    scene.playerVisual = scene.add.image(0, 32, "player-idle")
        .setOrigin(0.5, 1)
        .setDisplaySize(PLAYER_VISUAL.width, PLAYER_VISUAL.height);
    scene.player.add(scene.playerVisual);
    scene.playerWalkPhase = 0;
    scene.player.setSize(28, 64);
    scene.matter.add.gameObject(scene.player, {
        shape: { type: "rectangle", width: 28, height: 64 },
        mass: 2,
        friction: 0.15,
        frictionStatic: 0.2,
        frictionAir: 0.005,
        restitution: 0,
        inertia: Infinity,
    });
}

export function updatePlayerAnimation(scene, time, delta, grounded, direction) {
    const visual = scene.playerVisual;
    if (direction !== 0) visual.setFlipX(direction < 0);

    let texture = "player-idle";
    let bob = Math.sin(time / 350) * PLAYER_VISUAL.idleBob;
    if (!grounded) {
        texture = "player-jump";
        bob = 0;
        scene.playerWalkPhase = 0;
    } else if (direction !== 0) {
        scene.playerWalkPhase += delta / 1000 * PLAYER_VISUAL.walkCyclesPerSecond * Math.PI * 2;
        texture = Math.sin(scene.playerWalkPhase) >= 0 ? "player-walk" : "player-idle";
        bob = -Math.abs(Math.sin(scene.playerWalkPhase)) * PLAYER_VISUAL.walkBob;
    } else {
        scene.playerWalkPhase = 0;
    }

    visual.setTexture(texture).setDisplaySize(PLAYER_VISUAL.width, PLAYER_VISUAL.height);
    visual.y = 32 + bob;
}
