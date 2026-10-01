import Phaser from "phaser";
import { preloadClouds, createClouds, updateClouds } from "../systems/clouds.js";
import { createPlayer, createRaft, preloadEntities } from "../systems/entities.js";
import { endGame, startRandomEvent } from "../systems/events.js";
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
        preloadSea(this);
    }

    create() {
        this.survivalTime = 0;
        this.gameOver = false;
        this.waveStrength = 1;
        this.largeWave = null;
        this.lastRaftContact = -1000;

        createSea(this);
        createClouds(this);
        createRaft(this);
        createPlayer(this);
        createInterface(this);
        createControls(this);

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
        drawSea(this, time);

        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.restart();
            return;
        }

        updateGameplay(this, time, delta, () => endGame(this));
    }
}
