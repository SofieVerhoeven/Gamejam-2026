import Phaser from "phaser";
import "./style.css";
import waterTextureUrl from "./assets/Water+.png";

const GAME_WIDTH = 1280 ;
const GAME_HEIGHT = 720 ;
const SEA_LEVEL = 550;

class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.spritesheet("water-tiles", waterTextureUrl, {
            frameWidth: 16,
            frameHeight: 16,
        });
    }

    create() {
        this.survivalTime = 0;
        this.gameOver = false;
        this.waveStrength = 1;
        this.largeWave = null;
        this.lastRaftContact = -1000;

        this.createSea();
        this.createRaft();
        this.createPlayer();
        this.createInterface();
        this.createControls();

        this.time.delayedCall(4000, () => this.startRandomEvent());

        this.matter.world.on("collisionactive", (event) => {
            const touchingRaft = event.pairs.some((pair) => {
                const bodies = [pair.bodyA, pair.bodyB];
                return bodies.includes(this.player.body) && bodies.includes(this.raft.body);
            });

            if (touchingRaft) this.lastRaftContact = this.time.now;
        });
    }

    createSea() {
        this.textures.get("water-tiles").setFilter(Phaser.Textures.FilterMode.NEAREST);

        this.sea = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "water-tiles", 33)
            .setOrigin(0)
            .setTileScale(3)
            .setDepth(-10);

        // This shape covers the texture above the moving water surface.
        // It is more reliable for the large wave than a dynamic geometry mask.
        this.skyCover = this.add.graphics().setDepth(-9);
    }

    createRaft() {
        const x = GAME_WIDTH / 2;
        const y = SEA_LEVEL - 34;
        this.raft = this.add.container(x, y);

        const deck = this.add.rectangle(0, 0, 330, 28, 0xa96332).setStrokeStyle(3, 0x63361f);
        const plankLines = [-65, 0, 65].map((lineX) => this.add.rectangle(lineX, 0, 3, 26, 0x704024));
        this.raft.add([deck, ...plankLines]);
        this.raft.setSize(330, 28);
        this.matter.add.gameObject(this.raft, {
            shape: { type: "rectangle", width: 330, height: 28 },
            isStatic: true,
            friction: 0.15,
            frictionStatic: 0.2,
            restitution: 0,
        });
        this.previousRaftPose = { x, y, angle: 0 };
        this.raftVelocity = { x: 0, y: 0 };
    }

    createPlayer() {
        this.player = this.add.container(GAME_WIDTH / 2, SEA_LEVEL - 100);

        const body = this.add.rectangle(0, 10, 28, 40, 0xf3b83f).setStrokeStyle(3, 0x593724);
        const head = this.add.circle(0, -18, 14, 0xffd39d).setStrokeStyle(3, 0x593724);
        this.player.add([body, head]);
        this.player.setSize(28, 64);
        this.matter.add.gameObject(this.player, {
            shape: { type: "rectangle", width: 28, height: 64 },
            mass: 2,
            friction: 0.15,
            frictionStatic: 0.2,
            frictionAir: 0.005,
            restitution: 0,
            inertia: Infinity,
        });
    }

    createInterface() {
        this.add.text(24, 22, "STAY ON THE RAFT", {
            fontFamily: "Arial, sans-serif",
            fontSize: "25px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#173149",
            strokeThickness: 5,
        }).setDepth(20);

        this.timerText = this.add.text(24, 58, "Time: 0.0s", {
            fontFamily: "Arial, sans-serif",
            fontSize: "20px",
            color: "#dff7ff",
        }).setDepth(20);

        this.eventText = this.add.text(GAME_WIDTH / 2, 28, "Calm waters", {
            fontFamily: "Arial, sans-serif",
            fontSize: "20px",
            fontStyle: "bold",
            color: "#fff4c7",
            backgroundColor: "#173149aa",
            padding: { x: 14, y: 8 },
        }).setOrigin(0.5, 0).setDepth(20);

        this.add.text(GAME_WIDTH - 24, 24, "A / D or ← / →  Move\nSPACE  Jump", {
            fontFamily: "Arial, sans-serif",
            fontSize: "17px",
            color: "#ffffff",
            align: "right",
            lineSpacing: 5,
        }).setOrigin(1, 0).setDepth(20);
    }

    createControls() {
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            restart: Phaser.Input.Keyboard.KeyCodes.R,
        });
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    startRandomEvent() {
        if (this.gameOver) return;

        // Add future events here. These starter events only change the sea and raft.
        const events = [
            { name: "BIG WAVE!", strength: 1.2, duration: 18000, largeWave: true },
        ];
        const nextEvent = Phaser.Utils.Array.GetRandom(events);

        this.waveStrength = nextEvent.strength;
        this.eventText.setText(nextEvent.name);
        if (nextEvent.largeWave) {
            this.largeWave = {
                startTime: this.time.now,
                startX: -220,
                speed: 0.16,
                height: 190,
                width: 125,
            };
        }

        this.time.delayedCall(nextEvent.duration, () => {
            if (this.gameOver) return;
            this.waveStrength = 1;
            this.largeWave = null;
            this.eventText.setText("Calm waters");
            this.time.delayedCall(Phaser.Math.Between(2500, 5000), () => this.startRandomEvent());
        });
    }

    getSeaY(x, time) {
        let y = SEA_LEVEL
            + Math.sin(x * 0.022 + time * 0.0018) * 8 * this.waveStrength
            + Math.sin(x * 0.047 - time * 0.0026) * 3;

        if (this.largeWave) {
            const waveX = this.largeWave.startX
                + (time - this.largeWave.startTime) * this.largeWave.speed;
            const distance = (x - waveX) / this.largeWave.width;
            y -= this.largeWave.height * Math.exp(-0.5 * distance * distance);
        }

        return y;
    }

    drawSea(time) {
        // Animate one clean water tile instead of cycling through unrelated tiles
        // from the larger sprite sheet.
        this.sea.tilePositionX = time * 0.018;
        this.sea.tilePositionY = Math.sin(time * 0.0015) * 3;

        this.skyCover.clear();
        this.skyCover.fillStyle(0x75c8e8);
        this.skyCover.beginPath();
        this.skyCover.moveTo(0, 0);
        this.skyCover.lineTo(GAME_WIDTH, 0);
        this.skyCover.lineTo(GAME_WIDTH, this.getSeaY(GAME_WIDTH, time));

        for (let x = GAME_WIDTH; x >= 0; x -= 12) {
            this.skyCover.lineTo(x, this.getSeaY(x, time));
        }

        this.skyCover.closePath();
        this.skyCover.fillPath();
    }

    update(time, delta) {
        this.drawSea(time);
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.restart();
            return;
        }

        this.survivalTime += delta / 1000;
        this.timerText.setText(`Time: ${this.survivalTime.toFixed(1)}s`);

        // The raft uses the same water curve that is drawn, so it sits on the surface.
        const raftHalfSample = 120;
        const waterLeft = this.getSeaY(GAME_WIDTH / 2 - raftHalfSample, time);
        const waterRight = this.getSeaY(GAME_WIDTH / 2 + raftHalfSample, time);
        const raftY = this.getSeaY(GAME_WIDTH / 2, time) - 14;
        const maxRaftAngle = Phaser.Math.DegToRad(40);
        const raftAngle = Phaser.Math.Clamp(
            Math.atan2(waterRight - waterLeft, raftHalfSample * 2),
            -maxRaftAngle,
            maxRaftAngle,
        );

        // Matter uses pixels per physics step for velocity. Work out how much the
        // manually moved raft travelled so the player can carry that motion into a jump.
        const frameScale = Phaser.Math.Clamp(16.667 / Math.max(delta, 1), 0.5, 2);
        const angleVelocity = (raftAngle - this.previousRaftPose.angle) * frameScale;
        const playerHeightAboveRaft = Math.max(0, raftY - this.player.y);
        this.raftVelocity = {
            x: Phaser.Math.Clamp(angleVelocity * playerHeightAboveRaft, -3, 3),
            y: Phaser.Math.Clamp((raftY - this.previousRaftPose.y) * frameScale, -4, 4),
        };
        this.previousRaftPose = { x: GAME_WIDTH / 2, y: raftY, angle: raftAngle };

        this.matter.body.setPosition(this.raft.body, { x: GAME_WIDTH / 2, y: raftY });
        this.matter.body.setAngle(this.raft.body, raftAngle);

        const left = this.keys.left.isDown || this.cursors.left.isDown;
        const right = this.keys.right.isDown || this.cursors.right.isDown;
        const isStandingOnRaft = time - this.lastRaftContact < 100;

        // Ground movement is responsive. Air movement is deliberately weaker and capped.
        if ((left || right) && isStandingOnRaft) {
            const targetSpeed = left ? -6 : 6;
            this.matter.body.setVelocity(this.player.body, {
                x: Phaser.Math.Linear(this.player.body.velocity.x, targetSpeed, 0.28),
                y: this.player.body.velocity.y,
            });
        } else if (left || right) {
            const airDirection = left ? -1 : 1;
            const airSpeed = Phaser.Math.Clamp(
                this.player.body.velocity.x + airDirection * 0.08,
                -6.5,
                6.5,
            );
            this.matter.body.setVelocity(this.player.body, {
                x: airSpeed,
                y: this.player.body.velocity.y,
            });
        } else if (isStandingOnRaft) {
            this.matter.body.setVelocity(this.player.body, {
                x: Phaser.Math.Linear(this.player.body.velocity.x, 0, 0.12),
                y: this.player.body.velocity.y,
            });
        }

        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump)
            || Phaser.Input.Keyboard.JustDown(this.cursors.up);
        if (jumpPressed && isStandingOnRaft) {
            this.matter.body.setVelocity(this.player.body, {
                x: Phaser.Math.Clamp(this.player.body.velocity.x + this.raftVelocity.x, -8, 8),
                y: Phaser.Math.Clamp(-9 + this.raftVelocity.y, -11, -7),
            });
            this.lastRaftContact = -1000;
        }

        // Counter the downhill part of gravity while grounded. This provides grip on 40° waves
        // without reducing the player's intentional movement speed.
        if (isStandingOnRaft && !jumpPressed) {
            const gravityForce = 0.00115 * this.player.body.mass;
            const downhillGravity = gravityForce * Math.sin(raftAngle);
            const footingForce = 0.0007 * this.player.body.mass;
            this.matter.body.applyForce(this.player.body, this.player.body.position, {
                x: -downhillGravity * Math.cos(raftAngle) - footingForce * Math.sin(raftAngle),
                y: -downhillGravity * Math.sin(raftAngle) + footingForce * Math.cos(raftAngle),
            });
        }

        const waterBelowPlayer = this.getSeaY(this.player.x, time);
        if (this.player.y > waterBelowPlayer || this.player.x < -40 || this.player.x > GAME_WIDTH + 40) {
            this.endGame();
        }
    }

    endGame() {
        this.gameOver = true;
        this.player.setVisible(false);
        this.eventText.setText(`You stayed aboard for ${this.survivalTime.toFixed(1)} seconds\nPress R to try again`);
        this.eventText.setAlign("center");
    }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game",
    backgroundColor: "#75c8e8",
    physics: {
        default: "matter",
        matter: {
            gravity: { x: 0, y: 1.15 },
            debug: false,
        },
    },
    scene: GameScene,
};

new Phaser.Game(config);
