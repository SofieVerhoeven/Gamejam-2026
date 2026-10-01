import Phaser from "phaser";
import { preloadClouds, createClouds, updateClouds } from "../systems/clouds.js";
import { createPlayer, createRaft, preloadEntities } from "../systems/entities.js";
import {
    createFallingItems,
    preloadFallingItems,
    updateFallingItems,
} from "../systems/fallingItems.js";
import {
    endGame,
    preloadEvents,
    startBirdFlyovers,
    startRandomEvent,
    updateBirdFlyovers,
} from "../systems/events.js";
import { updateGameplay } from "../systems/gameplay.js";
import { preloadSea, createSea, drawSea } from "../systems/sea.js";
import { createControls, createInterface } from "../systems/ui.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        preloadClouds(this);
        preloadEntities(this);
        preloadEvents(this);
        preloadFallingItems(this);
        preloadSea(this);
    }

    create() {
        this.survivalTime = 0;
        this.lives = 3;
        this.bestScore = Number.parseFloat(localStorage.getItem("ship-happens-best-score")) || 0;
        this.gameOver = false;
        this.waveStrength = 1;
        this.largeWaves = [];
        this.seaEventsStarted = false;
        this.currentSeaEventName = "Calm waters";
        this.lastRaftContact = -1000;

        createSea(this);
        createClouds(this);
        createRaft(this);
        createPlayer(this);
        createInterface(this);
        createControls(this);
        createFallingItems(this);
        startBirdFlyovers(this);

        this.time.delayedCall(4000, () => startRandomEvent(this));

        this.matter.world.on("collisionactive", (event) => {
            const touchingRaft = event.pairs.some((pair) => {
                const bodies = [pair.bodyA, pair.bodyB];
                return bodies.includes(this.player.body) && bodies.includes(this.raft.body);
            });

            if (touchingRaft) this.lastRaftContact = this.time.now;
        });
    }

    update(time, delta) {
        updateClouds(this, delta);
        updateBirdFlyovers(this, time, delta);
        updateFallingItems(this, time, delta);
        drawSea(this, time);

        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.restart();
            return;
        }

        updateGameplay(this, time, delta, () => endGame(this));
    }
}
