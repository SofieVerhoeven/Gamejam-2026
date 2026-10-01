import Phaser from "phaser";
import "./style.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./config.js";
import GameScene from "./scenes/GameScene.js";

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
    scene: GameScene,
};

new Phaser.Game(config)