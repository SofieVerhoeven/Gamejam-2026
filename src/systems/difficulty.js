export function getDifficulty(scene) {
    // Reach full difficulty after three minutes. The smooth 0..1 value lets
    // every system scale continuously instead of jumping between levels.
    return Math.min(1, Math.max(0, scene.survivalTime / 180));
}
