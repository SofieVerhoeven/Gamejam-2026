import { playSound, SOUNDS } from "../../systems/audio.js";

export default class FallingItem {
    constructor(scene, {
        texture,
        x,
        y = -60,
        width = 48,
        height = 48,
        bodyRadius = Math.min(width, height) * 0.35,
        restitution = 0.2,
        friction = 0.2,
    }) {
        this.scene = scene;
        this.active = true;
        this.hitObjects = new WeakSet();

        this.gameObject = scene.add.image(x, y, texture)
            .setDisplaySize(width, height)
            .setDepth(6);
        this.gameObject.fallingItem = this;

        scene.matter.add.gameObject(this.gameObject, {
            shape: { type: "circle", radius: bodyRadius },
            label: `falling-item:${this.constructor.name}`,
            friction,
            frictionAir: 0.003,
            restitution,
        });
    }

    update(time, delta, seaY) {
        if (!this.active || !this.gameObject.body) return;

        if (this.gameObject.y > seaY) this.hitSea({ time, delta });
    }

    handleCollision(otherObject) {
        if (!this.active || !otherObject || this.hitObjects.has(otherObject)) return;
        this.hitObjects.add(otherObject);

        if (otherObject === this.scene.raft) this.hitRaft(otherObject);
        else if (otherObject === this.scene.player) this.hitPlayer(otherObject);
        else this.hitSomething(otherObject);
    }

    // Override these hooks in an item subclass.
    hitSea() {
        playSound(this.scene, SOUNDS.splash, { volume: 0.45 });
        this.destroy();
    }

    hitRaft() {}

    hitPlayer() {}

    hitSomething() {}

    extendSceneTimer(property, duration) {
        this.scene[property] = Math.max(
            this.scene[property] ?? 0,
            this.scene.time.now + duration,
        );
    }

    showMessage(message, duration = 1600) {
        const scene = this.scene;
        const messageId = (scene.itemMessageId ?? 0) + 1;
        scene.itemMessageId = messageId;
        scene.eventText.setText(message);

        scene.time.delayedCall(duration, () => {
            if (!scene.gameOver && scene.itemMessageId === messageId) {
                scene.eventText.setText(scene.currentSeaEventName ?? "Calm waters");
            }
        });
    }

    destroyAfter(delay) {
        this.scene.time.delayedCall(delay, () => this.destroy());
    }

    destroy() {
        if (!this.active) return;
        this.active = false;
        this.gameObject?.destroy();
    }
}
