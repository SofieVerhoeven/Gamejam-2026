import Phaser from "phaser";

export function startRandomEvent(scene) {
    if (scene.gameOver) return;

    const events = [
        { name: "BIG WAVE!", strength: 1.2, duration: 18000, largeWave: true },
    ];
    const nextEvent = Phaser.Utils.Array.GetRandom(events);

    scene.waveStrength = nextEvent.strength;
    scene.eventText.setText(nextEvent.name);
    if (nextEvent.largeWave) {
        scene.largeWave = {
            startTime: scene.time.now,
            startX: -220,
            speed: 0.16,
            height: 190,
            width: 125,
        };
    }

    scene.time.delayedCall(nextEvent.duration, () => {
        if (scene.gameOver) return;
        scene.waveStrength = 1;
        scene.largeWave = null;
        scene.eventText.setText("Calm waters");
        scene.time.delayedCall(
            Phaser.Math.Between(2500, 5000),
            () => startRandomEvent(scene),
        );
    });
}

export function endGame(scene) {
    scene.gameOver = true;
    scene.player.setVisible(false);
    scene.eventText.setText(
        `You stayed aboard for ${scene.survivalTime.toFixed(1)} seconds\nPress R to try again`,
    );
    scene.eventText.setAlign("center");
}
