import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, SEA_LEVEL } from "../config.js";
import waterTextureUrl from "../assets/Water+.png";

export function preloadSea(scene) {
    scene.load.spritesheet("water-tiles", waterTextureUrl, {
        frameWidth: 16,
        frameHeight: 16,
    });
}

export function createSea(scene) {
    scene.textures.get("water-tiles").setFilter(Phaser.Textures.FilterMode.NEAREST);

    scene.sea = scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "water-tiles", 15)
        .setOrigin(0)
        .setTileScale(2.5)
        .setDepth(-10);

    scene.skyCover = scene.add.graphics().setDepth(-9);
}

export function getSeaY(scene, x, time) {
    let y = SEA_LEVEL
        + Math.sin(x * 0.022 + time * 0.0018) * 8 * scene.waveStrength
        + Math.sin(x * 0.047 - time * 0.0026) * 3;

    if (scene.largeWave) {
        const waveX = scene.largeWave.startX
            + (time - scene.largeWave.startTime) * scene.largeWave.speed;
        const distance = (x - waveX) / scene.largeWave.width;
        y -= scene.largeWave.height * Math.exp(-0.5 * distance * distance);
    }

    return y;
}

export function drawSea(scene, time) {
    scene.sea.tilePositionX = time * 0.018;
    scene.sea.tilePositionY = Math.sin(time * 0.0015) * 3;

    scene.skyCover.clear();
    scene.skyCover.fillStyle(0x75c8e8);
    scene.skyCover.beginPath();
    scene.skyCover.moveTo(0, 0);
    scene.skyCover.lineTo(GAME_WIDTH, 0);
    scene.skyCover.lineTo(GAME_WIDTH, getSeaY(scene, GAME_WIDTH, time));

    for (let x = GAME_WIDTH; x >= 0; x -= 12) {
        scene.skyCover.lineTo(x, getSeaY(scene, x, time));
    }

    scene.skyCover.closePath();
    scene.skyCover.fillPath();
}
