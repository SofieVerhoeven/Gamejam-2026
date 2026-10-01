import anchorSoundUrl from "../../sound/anker.wav";
import backgroundMusicUrl from "../../achtergrondmuziek.mp3";
import bananaSoundUrl from "../../sound/banaan.wav";
import jumpSoundUrl from "../../sound/jump.wav";
import splashSoundUrl from "../../sound/plons.wav";
import snowflakeSoundUrl from "../../sound/sneeuwvlok.mp3";
import seagullSoundUrl from "../../sound/zeemeeuw.wav";

export const SOUNDS = {
    anchor: "sound-anchor",
    backgroundMusic: "music-background",
    banana: "sound-banana",
    jump: "sound-jump",
    splash: "sound-splash",
    snowflake: "sound-snowflake",
    seagull: "sound-seagull",
};

const SOUND_FILES = {
    [SOUNDS.anchor]: anchorSoundUrl,
    [SOUNDS.backgroundMusic]: backgroundMusicUrl,
    [SOUNDS.banana]: bananaSoundUrl,
    [SOUNDS.jump]: jumpSoundUrl,
    [SOUNDS.splash]: splashSoundUrl,
    [SOUNDS.snowflake]: snowflakeSoundUrl,
    [SOUNDS.seagull]: seagullSoundUrl,
};

export function preloadAudio(scene) {
    for (const [key, url] of Object.entries(SOUND_FILES)) {
        scene.load.audio(key, url);
    }
}

export function playSound(scene, key, config = {}) {
    if (!scene.sound || !scene.cache.audio.exists(key)) return;
    scene.sound.play(key, config);
}

export function startBackgroundMusic(scene) {
    if (!scene.sound || !scene.cache.audio.exists(SOUNDS.backgroundMusic)) return;

    // The sound manager survives scene restarts, so reuse the existing track
    // instead of layering another loop every time the player presses R.
    let music = scene.sound.get(SOUNDS.backgroundMusic);
    if (!music) {
        music = scene.sound.add(SOUNDS.backgroundMusic, {
            loop: true,
            volume: 0.35,
        });
    }

    if (!music.isPlaying) music.play();
}
