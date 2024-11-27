// Ground type definitions with their corresponding colors
export const GROUND_TYPES = {
    GRASS: {
        id: 'GRASS',
        color: 0x90EE90  // Light green
    },
    WATER: {
        id: 'WATER',
        color: 0x4169E1  // Royal blue
    },
    SAND: {
        id: 'SAND',
        color: 0xF4A460  // Sandy brown
    },
    ROCK: {
        id: 'ROCK',
        color: 0x808080  // Gray
    },
    WOODS: {
        id: 'WOODS',
        color: 0x006400  // Dark green
    }
};

// List of all ground type IDs for random selection
export const GROUND_TYPE_IDS = Object.keys(GROUND_TYPES);

// Get color for a ground type
export function getGroundTypeColor(groundType) {
    return GROUND_TYPES[groundType]?.color ?? 0xFF0000; // Default to red if type not found
}

// Get a random ground type ID
export function getRandomGroundType() {
    return GROUND_TYPE_IDS[Math.floor(Math.random() * GROUND_TYPE_IDS.length)];
}
