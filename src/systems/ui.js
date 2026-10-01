import Phaser from "phaser";
import { GAME_WIDTH } from "../config.js";

export function createInterface(scene) {
    scene.add.text(24, 22, "STAY ON THE RAFT", {
        fontFamily: "Arial, sans-serif",
        fontSize: "25px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#173149",
        strokeThickness: 5,
    }).setDepth(20);

    scene.timerText = scene.add.text(24, 58, "Time: 0.0s", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        color: "#dff7ff",
    }).setDepth(20);

    scene.eventText = scene.add.text(GAME_WIDTH / 2, 28, "Calm waters", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#fff4c7",
        backgroundColor: "#173149aa",
        padding: { x: 14, y: 8 },
    }).setOrigin(0.5, 0).setDepth(20);

    scene.add.text(GAME_WIDTH - 24, 24, "A / D or ← / →  Move\nSPACE  Jump", {
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        color: "#ffffff",
        align: "right",
        lineSpacing: 5,
    }).setOrigin(1, 0).setDepth(20);
}

export function createControls(scene) {
    scene.keys = scene.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
        restart: Phaser.Input.Keyboard.KeyCodes.R,
    });
    scene.cursors = scene.input.keyboard.createCursorKeys();
}
