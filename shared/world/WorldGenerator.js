import { TriangleGrid } from './TriangleGrid.js';

export class WorldGenerator {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.grid = new TriangleGrid();
    }

    // Simple random function with seed
    random() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    // Generate a new world with given dimensions
    generateWorld(width, height) {
        // Clear existing grid
        this.grid = new TriangleGrid();
        
        // For single triangle test, just create one at origin
        if (width === 1 && height === 1) {
            this.grid.setTriangle(0, 0, {
                terrain: this.generateTerrainType(0, 0),
                elevation: this.generateElevation(0, 0),
                resources: this.generateResources('grass'),
                arcColors: [
                    '#' + Math.floor(this.random()*16777215).toString(16).padStart(6, '0'),
                    '#' + Math.floor(this.random()*16777215).toString(16).padStart(6, '0'),
                    '#' + Math.floor(this.random()*16777215).toString(16).padStart(6, '0')
                ]
            });
            return this.grid;
        }

        // For larger grids, generate triangles in the specified range
        for (let q = 0; q < width; q++) {
            for (let r = 0; r < height; r++) {
                const terrainType = this.generateTerrainType(q, r);
                this.grid.setTriangle(q, r, {
                    terrain: terrainType,
                    elevation: this.generateElevation(q, r),
                    resources: this.generateResources(terrainType),
                    arcColors: [
                        '#' + Math.floor(this.random()*16777215).toString(16).padStart(6, '0'),
                        '#' + Math.floor(this.random()*16777215).toString(16).padStart(6, '0'),
                        '#' + Math.floor(this.random()*16777215).toString(16).padStart(6, '0')
                    ]
                });
            }
        }

        return this.grid;
    }

    // Generate terrain type for a triangle
    generateTerrainType(q, r) {
        const value = this.noise(q * 0.1, r * 0.1);
        
        if (value < 0.2) return 'water';
        if (value < 0.4) return 'sand';
        if (value < 0.7) return 'grass';
        if (value < 0.85) return 'forest';
        return 'mountain';
    }

    // Generate elevation for a triangle
    generateElevation(q, r) {
        return this.noise(q * 0.2 + 1000, r * 0.2 + 1000) * 100;
    }

    // Generate resources based on terrain type
    generateResources(terrainType) {
        const resources = [];
        const chance = this.random();

        switch (terrainType) {
            case 'water':
                if (chance < 0.1) resources.push('fish');
                break;
            case 'forest':
                if (chance < 0.3) resources.push('wood');
                if (chance < 0.1) resources.push('berries');
                break;
            case 'mountain':
                if (chance < 0.2) resources.push('stone');
                if (chance < 0.05) resources.push('ore');
                break;
        }

        return resources;
    }

    // Simple noise function
    noise(x, y) {
        const X = Math.floor(x);
        const Y = Math.floor(y);
        
        x = x - X;
        y = y - Y;
        
        const hash = (X * 73856093) ^ (Y * 19349663);
        let value = Math.sin(hash) * 43758.5453123;
        value = value - Math.floor(value);
        
        // Smooth the value
        const u = this.fade(x);
        const v = this.fade(y);
        
        return value * u * v;
    }

    // Smoothing function for noise
    fade(t) {
        return t * t * (3 - 2 * t);
    }
}

// Handle both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorldGenerator;
}
