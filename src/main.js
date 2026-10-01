
import Phaser from "phaser";
import "./style.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./config.js";
import GameScene from "./scenes/GameScene.js";

const config = {
    type: Phaser.AUTO,
    parent: document.body,
    width: 800,
    height: 600,
    backgroundColor: "#202030",
    scene: GameScene,
};