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
        this.stuckToRaft = false;
    }

    hitRaft() {
        playSound(this.scene, SOUNDS.anchor, { volume: 0.65 });
        const raft = this.scene.raft;
        const horizontalOffset = this.gameObject.x - raft.x;
        const side = Math.sign(horizontalOffset) || (Math.random() < 0.5 ? -1 : 1);
        const tiltDegrees = 18 + Math.min(5, Math.abs(horizontalOffset) / 24);
        this.scene.anchorTiltRadians = side * tiltDegrees * Math.PI / 180;
        this.extendSceneTimer("anchorWeightUntil", 8000);
        this.showMessage("ANCHOR ABOARD! The raft is tilting under the weight");

        const angle = raft.body.angle;
        const dx = this.gameObject.x - raft.body.position.x;
        const dy = this.gameObject.y - raft.body.position.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        this.raftOffset = {
            x: dx * cos + dy * sin,
            y: -dx * sin + dy * cos,
            angle: this.gameObject.body.angle - angle,
        };
        this.stuckToRaft = true;
        this.stuckUntil = this.scene.time.now + 8000;
        this.scene.matter.body.setVelocity(this.gameObject.body, { x: 0, y: 0 });
        this.scene.matter.body.setAngularVelocity(this.gameObject.body, 0);
        this.scene.matter.body.setStatic(this.gameObject.body, true);
    }

    update(time, delta, seaY) {
        if (!this.stuckToRaft) {
            super.update(time, delta, seaY);
            return;
        }

        if (time >= this.stuckUntil) {
            this.stuckToRaft = false;
            this.scene.matter.body.setStatic(this.gameObject.body, false);
            this.scene.matter.body.setVelocity(this.gameObject.body, {
                x: this.scene.raftVelocity.x,
                y: this.scene.raftVelocity.y + 1,
            });
            this.destroyAfter(4000);
            return;
        }

        const raft = this.scene.raft;
        const angle = raft.body.angle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        this.scene.matter.body.setPosition(this.gameObject.body, {
            x: raft.body.position.x + this.raftOffset.x * cos - this.raftOffset.y * sin,
            y: raft.body.position.y + this.raftOffset.x * sin + this.raftOffset.y * cos,
        });
        this.scene.matter.body.setAngle(
            this.gameObject.body,
            angle + this.raftOffset.angle,
        );
    }
}
