import Phaser from "phaser";
import { GAME_WIDTH, RAFT_WIDTH } from "../config.js";
import Anchor from "../items/Anchor.js";
import Banana from "../items/Banana.js";
import Raindrop from "../items/Raindrop.js";
import Snowflake from "../items/Snowflake.js";
import { getDifficulty } from "./difficulty.js";
import { getSeaY } from "./sea.js";

const ITEM_TYPES = [Banana, Snowflake, Raindrop, Anchor];
const BIRD_DROP_TYPES = [Banana, Raindrop];

export function preloadFallingItems(scene) {
    for (const ItemType of ITEM_TYPES) ItemType.preload(scene);
}

export function createFallingItems(scene) {
    scene.fallingItems = [];
    scene.slipperyUntil = 0;
    scene.frozenUntil = 0;
    scene.anchorWeightUntil = 0;
    scene.anchorTiltRadians = 0;

    scene.matter.world.on("collisionstart", (event) => {
        for (const pair of event.pairs) {
            routeItemCollision(pair.bodyA, pair.bodyB);
            routeItemCollision(pair.bodyB, pair.bodyA);
        }
    });

    scheduleNextItem(scene, Phaser.Math.Between(4500, 7500));
}

export function updateFallingItems(scene, time, delta) {
    for (const item of scene.fallingItems) {
        if (!item.active) continue;
        const seaY = getSeaY(scene, item.gameObject.x, time);
        item.update(time, delta, seaY);
    }

    scene.fallingItems = scene.fallingItems.filter((item) => item.active);
}

export function dropItemFromBird(scene, x, y) {
    spawnItem(scene, x, y, BIRD_DROP_TYPES);
}

function routeItemCollision(itemBody, otherBody) {
    const itemObject = getGameObject(itemBody);
    const otherObject = getGameObject(otherBody);
    itemObject?.fallingItem?.handleCollision(otherObject);
}

function getGameObject(body) {
    return body?.gameObject ?? body?.parent?.gameObject ?? null;
}

function scheduleNextItem(scene, delay) {
    scene.time.delayedCall(delay, () => {
        if (!scene.sys.isActive() || scene.gameOver) return;

        const sourceCloud = getCloudOverRaft(scene);
        if (!sourceCloud) {
            // Wait until a cloud has actually drifted over the deck. This keeps
            // every item visually connected to a cloud instead of spawning in
            // an arbitrary patch of sky.
            scheduleNextItem(scene, 750);
            return;
        }

        const x = sourceCloud.image.x;
        const y = sourceCloud.image.y + sourceCloud.image.displayHeight * 0.18;
        spawnItem(scene, x, y, ITEM_TYPES);

        const difficulty = getDifficulty(scene);
        const delayScale = Phaser.Math.Linear(1, 0.55, difficulty);
        scheduleNextItem(
            scene,
            Phaser.Math.Between(9000, 16000) * delayScale,
        );
    });
}

function spawnItem(scene, x, y, itemTypes) {
    if (!scene.sys.isActive() || scene.gameOver) return;
    const ItemType = Phaser.Utils.Array.GetRandom(itemTypes);
    scene.fallingItems.push(new ItemType(scene, x, y));
}

function getCloudOverRaft(scene) {
    const landingMargin = 45;
    const leftEdge = GAME_WIDTH / 2 - RAFT_WIDTH / 2 + landingMargin;
    const rightEdge = GAME_WIDTH / 2 + RAFT_WIDTH / 2 - landingMargin;
    const visibleClouds = scene.clouds.filter(({ image }) => (
        image.x >= leftEdge
        && image.x <= rightEdge
        && image.visible
    ));

    if (!visibleClouds.length) return null;
    return visibleClouds.reduce((nearest, cloud) => (
        Math.abs(cloud.image.x - GAME_WIDTH / 2)
            < Math.abs(nearest.image.x - GAME_WIDTH / 2)
            ? cloud
            : nearest
    ));
}
