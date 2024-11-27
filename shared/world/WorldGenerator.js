import TriangleMapSystem from './TriangleMapSystem.js';
import { GROUND_TYPES, GROUND_TYPE_IDS } from './groundTypes.js';

export class WorldGenerator {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.mapSystem = new TriangleMapSystem();

        // Initialize terrain type thresholds
        this.terrainThresholds = [];
        const stepSize = 1.0 / GROUND_TYPE_IDS.length;
        GROUND_TYPE_IDS.forEach((type, index) => {
            this.terrainThresholds.push({
                type: type,
                threshold: (index + 1) * stepSize
            });
        });
    }

    // Simple random function with seed
    random() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    // Generate a new world with given dimensions
    generateWorld(width, height) {
        // Clear existing map
        this.mapSystem.clear();
        
        // For single triangle test, just create one at origin
        if (width === 1 && height === 1) {
            const groundTypes = [
                this.generateTerrainType(0, 0), // center
                this.generateTerrainType(0, 0), // left
                this.generateTerrainType(0, 0), // right
                this.generateTerrainType(0, 0)  // top/bottom
            ];
            this.mapSystem.addTriangle(0, 0, groundTypes);
            return this.mapSystem;
        }

        // For larger grids, generate triangles in the specified range
        for (let q = 0; q < width; q++) {
            for (let r = 0; r < height; r++) {
                // Generate ground types for this triangle
                const groundTypes = [
                    this.generateTerrainType(q, r),     // center
                    this.generateTerrainType(q-1, r),   // left
                    this.generateTerrainType(q+1, r),   // right
                    (q + r) % 2 === 0 ?                 // top/bottom based on orientation
                        this.generateTerrainType(q, r+1) :  // upward triangle -> bottom
                        this.generateTerrainType(q, r-1)    // downward triangle -> top
                ];

                // Try to add the triangle
                this.mapSystem.addTriangle(q, r, groundTypes);
            }
        }

        return this.mapSystem;
    }

    // Generate terrain type for a position
    generateTerrainType(q, r) {
        const value = this.noise(q * 0.1, r * 0.1);
        
        // Find the appropriate terrain type based on noise value
        for (const { type, threshold } of this.terrainThresholds) {
            if (value <= threshold) {
                return type;
            }
        }
        
        // Fallback to last type if no threshold matched (shouldn't happen)
        return GROUND_TYPE_IDS[GROUND_TYPE_IDS.length - 1];
    }

    // Generate elevation for a position
    generateElevation(q, r) {
        return this.noise(q * 0.2 + 1000, r * 0.2 + 1000) * 100;
    }

    // Simple noise function
    noise(x, y) {
        const X = Math.floor(x);
        const Y = Math.floor(y);
        
        x = x - X;
        y = y - Y;
        
        const hash = (X * 73856093) ^ (Y * 19349663);
        this.seed = hash;
        return this.random();
    }
}

export default WorldGenerator;
