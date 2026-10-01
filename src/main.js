
import Phaser from "phaser";
import "./style.css";

class GameScene extends Phaser.Scene {
    create() {
        this.add.text(400, 40, "Phaser + Node.js", {
            fontSize: "32px",
            color: "#ffffff",
        }).setOrigin(0.5);

        this.player = this.add.rectangle(
            400, 300, 50, 50, 0x00ff88
        );

        this.keys = this.input.keyboard.addKeys(
            "W,A,S,D,UP,DOWN,LEFT,RIGHT"
        );
    }

    update(_, delta) {
        const speed = 250 * delta / 1000;

        if (this.keys.A.isDown || this.keys.LEFT.isDown)
            this.player.x -= speed;

        if (this.keys.D.isDown || this.keys.RIGHT.isDown)
            this.player.x += speed;

        if (this.keys.W.isDown || this.keys.UP.isDown)
            this.player.y -= speed;

        if (this.keys.S.isDown || this.keys.DOWN.isDown)
            this.player.y += speed;

        // Keep the player inside the screen
        this.player.x = Phaser.Math.Clamp(
            this.player.x, 25, 775
        );

        this.player.y = Phaser.Math.Clamp(
            this.player.y, 65, 575
        );
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    parent: document.body,
    width: 800,
    height: 600,
    backgroundColor: "#202030",
    scene: GameScene,
});