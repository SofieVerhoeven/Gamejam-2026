import { GAME_WIDTH, SEA_LEVEL } from "../config.js";

export function createRaft(scene) {
    const x = GAME_WIDTH / 2;
    const y = SEA_LEVEL - 34;
    scene.raft = scene.add.container(x, y);

    const deck = scene.add.rectangle(0, 0, 330, 28, 0xa96332).setStrokeStyle(3, 0x63361f);
    const plankLines = [-65, 0, 65].map((lineX) => (
        scene.add.rectangle(lineX, 0, 3, 26, 0x704024)
    ));
    scene.raft.add([deck, ...plankLines]);
    scene.raft.setSize(330, 28);
    scene.matter.add.gameObject(scene.raft, {
        shape: { type: "rectangle", width: 330, height: 28 },
        isStatic: true,
        friction: 0.15,
        frictionStatic: 0.2,
        restitution: 0,
    });

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
