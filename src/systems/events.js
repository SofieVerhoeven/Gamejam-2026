import Phaser from "phaser";
import birdWingsDownUrl from "../assets/bird_wings_down.svg";
import birdWingsUpUrl from "../assets/bird_wings_up.svg";
import { playSound, SOUNDS } from "./audio.js";
import { getDifficulty } from "./difficulty.js";
import { dropItemFromBird } from "./fallingItems.js";

const BIRD_WIDTH = 82;
const BIRD_HEIGHT = 46;
const BIRD_TEXTURES = ["bird-wings-down", "bird-wings-up"];

export function preloadEvents(scene) {
    // Rasterize both large source SVGs to identical sizes so flapping does not
    // make the bird jump or resize between frames.
    const size = { width: BIRD_WIDTH, height: BIRD_HEIGHT };
    scene.load.svg(BIRD_TEXTURES[0], birdWingsDownUrl, size);
    scene.load.svg(BIRD_TEXTURES[1], birdWingsUpUrl, size);
}

export function startBirdFlyovers(scene) {
    scene.activeBirds = [];
    scheduleBirdFlyover(scene, Phaser.Math.Between(3500, 8000));
}

export function updateBirdFlyovers(scene, time, delta) {
    if (!scene.activeBirds?.length) return;

    const remainingBirds = [];
    for (const bird of scene.activeBirds) {
        bird.sprite.x += bird.direction * bird.speed * delta / 1000;
        bird.sprite.y = bird.baseY + Math.sin(time * 0.003 + bird.phase) * 3;

        if (time >= bird.nextFlapAt) {
            bird.wingsUp = !bird.wingsUp;
            bird.sprite.setTexture(BIRD_TEXTURES[bird.wingsUp ? 1 : 0]);
            bird.nextFlapAt = time + Phaser.Math.Between(130, 190);
        }

        const isOverRaft = Math.abs(bird.sprite.x - scene.raft.x)
            < scene.raft.displayWidth * 0.38;
        if (bird.willDrop && !bird.dropped && isOverRaft) {
            bird.dropped = true;
            dropItemFromBird(scene, bird.sprite.x, bird.sprite.y + BIRD_HEIGHT / 2);
        }

        const flewPastScreen = bird.direction > 0
            ? bird.sprite.x > scene.scale.width + BIRD_WIDTH
            : bird.sprite.x < -BIRD_WIDTH;
        if (flewPastScreen) bird.sprite.destroy();
        else remainingBirds.push(bird);
    }

    scene.activeBirds = remainingBirds;
}

function scheduleBirdFlyover(scene, delay) {
    scene.time.delayedCall(delay, () => {
        if (!scene.sys.isActive() || scene.gameOver) return;
        launchBirdFlyover(scene);
    });
}

function launchBirdFlyover(scene) {
    const difficulty = getDifficulty(scene);
    const direction = Phaser.Math.Between(0, 1) ? 1 : -1;
    const isFlock = Phaser.Math.Between(0, 99) < Phaser.Math.Linear(35, 70, difficulty);
    const maxFlockSize = Math.round(Phaser.Math.Linear(6, 9, difficulty));
    const birdCount = isFlock ? Phaser.Math.Between(4, maxFlockSize) : 1;
    const baseX = direction > 0 ? -BIRD_WIDTH : scene.scale.width + BIRD_WIDTH;
    const baseY = Phaser.Math.Between(95, 260);
    const speedMultiplier = Phaser.Math.Linear(1, 1.35, difficulty);
    const speed = Phaser.Math.Between(105, 145) * speedMultiplier;
    const dropperIndex = Math.random() < Phaser.Math.Linear(0.2, 0.6, difficulty)
        ? Phaser.Math.Between(0, birdCount - 1)
        : -1;

    // One call per flyover keeps a flock from stacking the same sound.
    playSound(scene, SOUNDS.seagull, {
        volume: isFlock ? 0.45 : 0.32,
        rate: Phaser.Math.FloatBetween(0.94, 1.06),
    });

    for (let index = 0; index < birdCount; index++) {
        const rank = index === 0 ? 0 : Math.ceil(index / 2);
        const side = index === 0 ? 0 : index % 2 === 0 ? 1 : -1;

        const sprite = scene.add.image(
            baseX - direction * rank * 54,
            baseY + side * rank * 27,
            BIRD_TEXTURES[index % 2],
        )
            .setDisplaySize(BIRD_WIDTH, BIRD_HEIGHT)
            .setFlipX(Math.random() < 0.05 ? direction <= 0 : direction > 0)
            .setDepth(-7);

        scene.activeBirds.push({
            sprite,
            direction,
            speed: speed + Phaser.Math.Between(-8, 8),
            baseY: sprite.y,
            phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
            wingsUp: index % 2 === 1,
            nextFlapAt: scene.time.now + Phaser.Math.Between(80, 190),
            willDrop: index === dropperIndex,
            dropped: false,
        });
    }

    const crossingTime = (scene.scale.width + BIRD_WIDTH * 4) / speed * 1000;
    const quietTime = Phaser.Math.Between(5000, 12000)
        * Phaser.Math.Linear(1, 0.45, difficulty);
    scheduleBirdFlyover(scene, crossingTime + quietTime);
}

export function startRandomEvent(scene) {
    if (scene.gameOver || scene.seaEventsStarted) return;
    scene.seaEventsStarted = true;
    startSeaCondition(scene);
    scheduleWaveHazard(scene, 4500);
}

function startSeaCondition(scene) {
    if (scene.gameOver) return;

    const difficulty = getDifficulty(scene);
    const conditions = [
        { name: "Calm seas", strength: 0.45, weight: 5 * (1 - difficulty) + 0.5 },
        { name: "Gentle swell", strength: 0.8, weight: 4 },
        { name: "Choppy waters", strength: 1.45, weight: 2 + difficulty * 5 },
        { name: "Heavy swell", strength: 2.1, weight: 0.5 + difficulty * 5 },
    ];
    const condition = weightedPick(conditions);
    const duration = Phaser.Math.Between(7000, 11000)
        * Phaser.Math.Linear(1, 0.75, difficulty);

    scene.waveStrength = condition.strength * Phaser.Math.Linear(1, 1.18, difficulty);
    scene.currentSeaEventName = condition.name;
    scene.eventText.setText(condition.name);

    scene.time.delayedCall(duration, () => {
        if (!scene.gameOver) startSeaCondition(scene);
    });
}

function scheduleWaveHazard(scene, delay) {
    scene.time.delayedCall(delay, () => {
        if (scene.gameOver) return;

        const difficulty = getDifficulty(scene);
        launchLargeWave(scene, difficulty, false);

        // Later in a run, a second independent wave can overlap the first.
        if (Math.random() < Phaser.Math.Linear(0.05, 0.55, difficulty)) {
            scene.time.delayedCall(Phaser.Math.Between(900, 1900), () => {
                if (!scene.gameOver) launchLargeWave(scene, difficulty, true);
            });
        }

        const nextDelay = Phaser.Math.Between(9000, 14000)
            * Phaser.Math.Linear(1, 0.42, difficulty);
        scheduleWaveHazard(scene, nextDelay);
    });
}

function launchLargeWave(scene, difficulty, secondary) {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const width = Phaser.Math.Between(115, 165);
    const speed = Phaser.Math.FloatBetween(0.13, 0.17)
        * Phaser.Math.Linear(1, 1.75, difficulty);
    const wave = {
        startTime: scene.time.now,
        startX: direction > 0 ? -width * 2 : scene.scale.width + width * 2,
        speed: speed * direction,
        height: Phaser.Math.Between(135, 175)
            * Phaser.Math.Linear(1, 1.22, difficulty)
            * (secondary ? 0.72 : 1),
        width,
    };
    scene.largeWaves.push(wave);

    scene.eventText.setText(secondary ? "DOUBLE WAVE!" : "BIG WAVE!");
    const alertId = (scene.waveAlertId ?? 0) + 1;
    scene.waveAlertId = alertId;
    scene.time.delayedCall(1700, () => {
        if (!scene.gameOver && scene.waveAlertId === alertId) {
            scene.eventText.setText(scene.currentSeaEventName);
        }
    });

    const travelTime = (scene.scale.width + width * 4) / Math.abs(wave.speed);
    scene.time.delayedCall(travelTime + 1000, () => {
        scene.largeWaves = scene.largeWaves.filter((activeWave) => activeWave !== wave);
    });
}

function weightedPick(entries) {
    let roll = Math.random() * entries.reduce((sum, entry) => sum + entry.weight, 0);
    for (const entry of entries) {
        roll -= entry.weight;
        if (roll <= 0) return entry;
    }
    return entries.at(-1);
}

export function endGame(scene) {
    playSound(scene, SOUNDS.splash, { volume: 0.65 });
    scene.gameOver = true;
    scene.bestScore = Math.max(scene.bestScore, scene.survivalTime);
    localStorage.setItem("ship-happens-best-score", scene.bestScore.toString());
    scene.bestScoreText.setText(`Best: ${scene.bestScore.toFixed(1)}s`);
    scene.player.setVisible(false);
    scene.eventText.setText(
        `You stayed aboard for ${scene.survivalTime.toFixed(1)} seconds\nPress R to try again`,
    );
    scene.eventText.setAlign("center");
}
