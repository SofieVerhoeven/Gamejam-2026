import FallingItem from "./templates/FallingItem.js";
import bananaTextureUrl from "../assets/banaan.svg";

const TEXTURE_KEY = "falling-item-banana";

export default class Banana extends FallingItem {
    static preload(scene) {
        scene.load.svg(TEXTURE_KEY, bananaTextureUrl, { width: 64, height: 32 });
    }

    constructor(scene, x, y) {
        super(scene, {
            texture: TEXTURE_KEY,
            x,
            y,
            width: 64,
            height: 32,
            bodyRadius: 15,
            restitution: 0.15,
            friction: 0.02,
        });

        scene.matter.body.setAngularVelocity(
            this.gameObject.body,
            Math.random() * 0.16 - 0.08,
        );
    }

    hitRaft() {
        this.extendSceneTimer("slipperyUntil", 8000);
        this.showMessage("BANANA ON DECK! Slippery for 8 seconds");
        this.destroyAfter(9000);
    }

    hitPlayer() {
        // The banana remains physical, so hitting the player still deflects it.
    }
}
