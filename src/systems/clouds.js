import Phaser from "phaser";
import { GAME_WIDTH } from "../config.js";
import cloudOneUrl from "../assets/Wolken/Wolk 1 copy.svg";
import cloudTwoUrl from "../assets/Wolken/wolk2 copy.svg";
import cloudThreeUrl from "../assets/Wolken/wolk3 copy.svg";

const CLOUD_URLS = [cloudOneUrl, cloudTwoUrl, cloudThreeUrl];

export function preloadClouds(scene) {
    CLOUD_URLS.forEach((url, index) => {
        scene.load.svg(`cloud-source-${index}`, url, { width: 600, height: 300 });
    });
}

export function createClouds(scene) {
    CLOUD_URLS.forEach((_, index) => createCloudTexture(scene, index));

    scene.clouds = Array.from({ length: 3 }, (_, index) => {
        const cloud = scene.add.image(
            index * (GAME_WIDTH / 3) + 100,
            Phaser.Math.Between(70, 150),
            `cloud-${index % CLOUD_URLS.length}`,
        )
            .setScale(Phaser.Math.FloatBetween(0.35, 0.65))
            .setAlpha(0.9)
            .setDepth(-8);

        return { image: cloud, speed: Phaser.Math.FloatBetween(2, 5) };
    });
}

function createCloudTexture(scene, index) {
    const key = `cloud-${index}`;
    if (scene.textures.exists(key)) return;

    const source = scene.textures.get(`cloud-source-${index}`).getSourceImage();
    const texture = scene.textures.createCanvas(key, source.width, source.height);
    const context = texture.getContext();
    context.drawImage(source, 0, 0);

    const pixels = context.getImageData(0, 0, source.width, source.height);
    removeConnectedBackground(pixels, source.width, source.height);
    context.putImageData(pixels, 0, 0);
    texture.refresh();
}

function removeConnectedBackground(pixels, width, height) {
    const visited = new Uint8Array(width * height);
    const pending = [];

    const visit = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;

        const pixel = y * width + x;
        if (visited[pixel]) return;
        visited[pixel] = 1;

        const offset = pixel * 4;
        const red = pixels.data[offset];
        const green = pixels.data[offset + 1];
        const blue = pixels.data[offset + 2];
        if (Math.max(red, green, blue) - Math.min(red, green, blue) > 2) return;

        pixels.data[offset + 3] = 0;
        pending.push(pixel);
    };

    for (let x = 0; x < width; x++) {
        visit(x, 0);
        visit(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        visit(0, y);
        visit(width - 1, y);
    }

    while (pending.length) {
        const pixel = pending.pop();
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        visit(x - 1, y);
        visit(x + 1, y);
        visit(x, y - 1);
        visit(x, y + 1);
    }
}

export function updateClouds(scene, delta) {
    for (const cloud of scene.clouds) {
        cloud.image.x += cloud.speed * delta / 1000;
        const halfWidth = cloud.image.displayWidth / 2;

        if (cloud.image.x - halfWidth > GAME_WIDTH) {
            cloud.image.x = -halfWidth - Phaser.Math.Between(30, 150);
            cloud.image.y = Phaser.Math.Between(100, 270);
        }
    }
}
