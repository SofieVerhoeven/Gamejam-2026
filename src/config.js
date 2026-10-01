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
    // Measured opaque bounds of the wooden hull in the 209 x 93 SVG.
    hullBottomY: 91,
    hullLeftX: 4,
    hullRightX: 204,
    samples: 25,
    // The hull normally sits slightly in the water. A damped response may add
    // a little more penetration on a fast crest, but it is capped for fairness.
    immersion: 3,
    maxWavePenetration: 5,
    positionFollow: 0.18,
    rotationFollow: 0.14,
    maxAngleDegrees: 32,
};
// Offset of the collision floor's center from the SVG center, in SVG pixels.
// Positive x moves it right; positive y moves it down. Scales with RAFT_WIDTH.
// Raft.svg is 209 x 93; the deck starts at y = 77. Include half the hitbox
// height so the collision floor's TOP aligns with the wooden deck.
export const RAFT_FLOOR_OFFSET = {
    x: 0,
    y: 77 - 93 / 2 + (RAFT_HITBOX_HEIGHT / 2) * (209 / RAFT_WIDTH),
};
