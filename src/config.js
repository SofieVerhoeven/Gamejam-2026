export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const SEA_LEVEL = 550;

export const PLAYER_VISUAL = {
    width: 48,
    height: 72,
    // A full walking cycle per second; increase for faster footsteps.
    walkCyclesPerSecond: 4,
    walkBob: 2,
    idleBob: 0.5,
};

export const RAFT_WIDTH = 330;
export const RAFT_HITBOX_HEIGHT = 28;
export const RAFT_FLOAT = {
    // Solid bottom edge in the 209 x 93 SVG, excluding transparent padding.
    hullBottomY: 89,
    // Ignore the thin ropes at the ends when sampling the wooden hull.
    hullLeftX: 15,
    hullRightX: 194,
    samples: 17,
    // Screen pixels of overlap to hide gaps around uneven/antialiased edges.
    immersion: 4,
    maxAngleDegrees: 40,
};
// Offset of the collision floor's center from the SVG center, in SVG pixels.
// Positive x moves it right; positive y moves it down. Scales with RAFT_WIDTH.
// Raft.svg is 209 x 93; the wood starts at y = 80. Include half the hitbox
// height so the collision floor's TOP aligns with the wooden deck.
export const RAFT_FLOOR_OFFSET = {
    x: 0,
    y: 80 - 93 / 2 + (RAFT_HITBOX_HEIGHT / 2) * (209 / RAFT_WIDTH),
};
