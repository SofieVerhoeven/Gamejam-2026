import { GAME_WIDTH, SEA_LEVEL, RAFT_WIDTH, RAFT_HITBOX_HEIGHT, RAFT_FLOOR_OFFSET } from "../config.js";
import raftTextureUrl from "../assets/Raft.svg";

const RAFT_HEIGHT = RAFT_WIDTH * (93 / 209);

export function preloadEntities(scene) {
    scene.load.svg("raft", raftTextureUrl);
}

export function createRaft(scene) {
    const x = GAME_WIDTH / 2;
    const y = SEA_LEVEL - 34;
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

    const body = scene.add.rectangle(0, 10, 28, 40, 0xf3b83f).setStrokeStyle(3, 0x593724);
    const head = scene.add.circle(0, -18, 14, 0xffd39d).setStrokeStyle(3, 0x593724);
    scene.player.add([body, head]);
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
