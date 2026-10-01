import FallingItem from "./templates/FallingItem.js";
import raindropTextureUrl from "../assets/regendruppel-removebg-preview (1).svg";

const TEXTURE_KEY = "falling-item-raindrop";

export default class Raindrop extends FallingItem {
    static preload(scene) {
        scene.load.svg(TEXTURE_KEY, raindropTextureUrl, { width: 34, height: 44 });
    }

    constructor(scene, x, y) {
        super(scene, {
            texture: TEXTURE_KEY,
            x,
            y,
            width: 34,
            height: 44,
            bodyRadius: 14,
            restitution: 0,
            friction: 0,
        });
    }

    hitRaft() {
        this.extendSceneTimer("slipperyUntil", 3500);
        this.showMessage("WET DECK! Watch your footing");
        this.destroy();
    }
}
