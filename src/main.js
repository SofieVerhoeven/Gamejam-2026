import Phaser from "phaser";
import "./style.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./config.js";
import GameScene from "./scenes/GameScene.js";

class StartScene extends Phaser.Scene {
    constructor() {
        super("StartScene");
    }

    create() {
        this.starting = false;
        this.createBackdrop();

        this.add.text(GAME_WIDTH / 2, 150, "SHIP HAPPENS", {
            fontFamily: "Arial, sans-serif",
            fontSize: "76px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#173149",
            strokeThickness: 9,
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 235, "The raft is small. The waves are not.", {
            fontFamily: "Arial, sans-serif",
            fontSize: "24px",
            color: "#fff4c7",
        }).setOrigin(0.5);

        const button = this.add.rectangle(GAME_WIDTH / 2, 365, 270, 76, 0xa96332)
            .setStrokeStyle(4, 0x63361f)
            .setInteractive({ useHandCursor: true });
        const buttonText = this.add.text(GAME_WIDTH / 2, 365, "PLAY", {
            fontFamily: "Arial, sans-serif",
            fontSize: "32px",
            fontStyle: "bold",
            color: "#ffffff",
        }).setOrigin(0.5);

        button.on("pointerover", () => {
            button.setFillStyle(0xc2763d);
            buttonText.setScale(1.05);
        });
        button.on("pointerout", () => {
            button.setFillStyle(0xa96332);
            buttonText.setScale(1);
        });
        button.on("pointerdown", () => this.startGame());

        this.add.text(GAME_WIDTH / 2, 485, "A / D Move     SPACE  Jump", {
            fontFamily: "Arial, sans-serif",
            fontSize: "20px",
            color: "#dff7ff",
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 635, "Press ENTER or click PLAY to begin", {
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            color: "#173149",
        }).setOrigin(0.5);

        this.input.keyboard.on("keydown-ENTER", () => this.startGame());
        this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    }

    createBackdrop() {
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x75c8e8).setOrigin(0);
        this.add.rectangle(0, 520, GAME_WIDTH, 200, 0x237da8).setOrigin(0);

        this.add.ellipse(190, 125, 230, 46, 0xffffff, 0.72);
        this.add.ellipse(1040, 105, 290, 54, 0xffffff, 0.58);
        this.waveLines = this.add.graphics();
    }

    startGame() {
        if (this.starting) return;
        this.starting = true;
        this.cameras.main.fadeOut(250, 23, 49, 73);
        this.time.delayedCall(250, () => this.scene.start("GameScene"));
    }

    update(time) {
        this.waveLines.clear();
        this.waveLines.lineStyle(4, 0x75c8e8, 0.55);
        for (let y = 550; y < GAME_HEIGHT; y += 38) {
            this.waveLines.beginPath();
            for (let x = 0; x <= GAME_WIDTH; x += 16) {
                const waveY = y + Math.sin(x * 0.02 + time * 0.0015 + y) * 7;
                if (x === 0) this.waveLines.moveTo(x, waveY);
                else this.waveLines.lineTo(x, waveY);
            }
            this.waveLines.strokePath();
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game",
    backgroundColor: "#75c8e8",
    physics: {
        default: "matter",
        matter: {
            gravity: { x: 0, y: 1.15 },
            debug: false,
        },
    },
    scene: [StartScene, GameScene],
};

new Phaser.Game(config);
