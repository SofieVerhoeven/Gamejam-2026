import FallingItem from "./templates/FallingItem.js";
import snowflakeTextureUrl from "../assets/pixelart_sneeuwvlok.svg";
import { playSound, SOUNDS } from "../systems/audio.js";

const TEXTURE_KEY = "falling-item-snowflake";

export default class Snowflake extends FallingItem {
    static preload(scene) {
        scene.load.svg(TEXTURE_KEY, snowflakeTextureUrl, { width: 44, height: 44 });
    }

    constructor(scene, x, y) {
        super(scene, {
            texture: TEXTURE_KEY,
            x,
            y,
            width: 44,
            height: 44,
            bodyRadius: 18,
            restitution: 0.3,
            friction: 0.01,
        });
        scene.matter.body.setAngularVelocity(this.gameObject.body, 0.045);
    }

    hitRaft() {
        playSound(this.scene, SOUNDS.snowflake, { volume: 0.55 });
        this.extendSceneTimer("frozenUntil", 6500);
        this.showMessage("DEEP FREEZE! Movement and jumping are slowed");
        this.destroyAfter(7000);
    }
}
