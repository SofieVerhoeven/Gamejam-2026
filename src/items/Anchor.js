import FallingItem from "./templates/FallingItem.js";
import anchorTextureUrl from "../assets/pixel_anchor.svg";
import { playSound, SOUNDS } from "../systems/audio.js";

const TEXTURE_KEY = "falling-item-anchor";

export default class Anchor extends FallingItem {
    static preload(scene) {
        scene.load.svg(TEXTURE_KEY, anchorTextureUrl, { width: 58, height: 52 });
    }

    constructor(scene, x, y) {
        super(scene, {
            texture: TEXTURE_KEY,
            x,
            y,
            width: 58,
            height: 52,
            bodyRadius: 22,
            restitution: 0.05,
            friction: 0.8,
        });
        scene.matter.body.setMass(this.gameObject.body, 8);
        scene.matter.body.setAngularVelocity(this.gameObject.body, 0.025);
    }

    hitRaft() {
        playSound(this.scene, SOUNDS.anchor, { volume: 0.65 });
        const horizontalOffset = this.gameObject.x - this.scene.raft.x;
        const side = Math.sign(horizontalOffset) || (Math.random() < 0.5 ? -1 : 1);
        const tiltDegrees = 18 + Math.min(5, Math.abs(horizontalOffset) / 24);
        this.scene.anchorTiltRadians = side * tiltDegrees * Math.PI / 180;
        this.extendSceneTimer("anchorWeightUntil", 8000);
        this.showMessage("ANCHOR ABOARD! The raft is tilting under the weight");
        this.destroyAfter(8500);
    }
}
