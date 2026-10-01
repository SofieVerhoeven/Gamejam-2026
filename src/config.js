export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const SEA_LEVEL = 550;

export const RAFT_WIDTH = 330;
export const RAFT_HITBOX_HEIGHT = 28;
// Offset of the collision floor's center from the SVG center, in SVG pixels.
// Positive x moves it right; positive y moves it down. Scales with RAFT_WIDTH.
// Raft.svg is 209 x 93; the wood starts at y = 80. Include half the hitbox
// height so the collision floor's TOP aligns with the wooden deck.
export const RAFT_FLOOR_OFFSET = {
    x: 0,
    y: 80 - 93 / 2 + (RAFT_HITBOX_HEIGHT / 2) * (209 / RAFT_WIDTH),
};
