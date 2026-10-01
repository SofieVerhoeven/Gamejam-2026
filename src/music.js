class GameScene extends Phaser.Scene {
    preload() {
        // 1. Laad het audiobestand in (geef het een unieke sleutel, bijv. 'achtergrondmuziek')
        this.load.audio('achtergrondmuziek', 'assets/audio/background.mp3');
    }

    create() {
        // 2. Voeg de muziek toe aan de Sound Manager
        const muziek = this.sound.add('achtergrondmuziek');

        // 3. Speel de muziek af met extra opties (zoals loopen en volume)
        muziek.play({
            loop: true,   // Zorgt ervoor dat de muziek oneindig herhaalt
            volume: 0.5   // Volume tussen 0.0 (stil) en 1.0 (voluit)
        });
    }
}
