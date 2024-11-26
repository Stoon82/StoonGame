// Coordinate system for triangular grid
// Using axial coordinates (q,r) which is a common system for hexagonal/triangular grids
class TriangleGrid {
    constructor(width = 10, height = 10) {
        console.log(`Creating grid with dimensions: ${width}x${height}`);
        this.width = width;
        this.height = height;
        this.triangles = new Map(); // Store only placed triangles
        this.size = 1; // Base size of triangles
    }

    // Convert axial coordinates to a string key
    coordToKey(q, r) {
        return `${q},${r}`;
    }

    // Add a triangle to the grid
    addTriangle(q, r, data) {
        const key = this.coordToKey(q, r);
        this.triangles.set(key, {
            ...data,
            q, r,
            isUpward: (q + r) % 2 === 0
        });
        console.log(`Added triangle at ${key}`);
        console.log('Current triangles:', Array.from(this.triangles.keys()));
    }

    // Check if a triangle exists at coordinates
    hasTriangle(q, r) {
        return this.triangles.has(this.coordToKey(q, r));
    }

    // Get triangle data at coordinates
    getTriangle(q, r) {
        return this.triangles.get(this.coordToKey(q, r));
    }

    // Clear all triangles
    clear() {
        this.triangles.clear();
    }

    // Get the vertices and arc centers of a triangle at given coordinates
    getTriangleGeometry(q, r) {
        const size = this.size;
        const h = size * Math.sqrt(3); // Height of equilateral triangle
        const isUpward = (q + r) % 2 === 0;
        
        // Calculate base position
        const baseX = q * size;
        const baseY = r * h;
        
        // Calculate vertices based on orientation
        let vertices;
        if (isUpward) {
            vertices = [
                { x: baseX - size/2, y: baseY - h/3 },      // Bottom left
                { x: baseX + size/2, y: baseY - h/3 },      // Bottom right
                { x: baseX, y: baseY + 2*h/3 }              // Top
            ];
        } else {
            vertices = [
                { x: baseX - size/2, y: baseY + h/3 },      // Top left
                { x: baseX + size/2, y: baseY + h/3 },      // Top right
                { x: baseX, y: baseY - 2*h/3 }              // Bottom
            ];
        }

        // Calculate arc centers (connection points between triangles)
        const arcRadius = size * 0.15; // Radius of connection arcs
        const arcCenters = [
            { x: baseX - size/2, y: baseY },                // Left
            { x: baseX + size/2, y: baseY },                // Right
            { x: baseX, y: isUpward ? baseY + h/2 : baseY - h/2 }  // Top/Bottom
        ];

        return {
            vertices,
            arcCenters,
            arcRadius,
            isUpward,
            center: { x: baseX, y: baseY }
        };
    }

    // Check if a position is within grid bounds
    isValidPosition(q, r) {
        return q >= 0 && q < this.width && r >= 0 && r < this.height;
    }

    // Get world position for a grid coordinate
    getWorldPosition(q, r) {
        const size = this.size;
        const h = size * Math.sqrt(3);
        const x = q * size;
        const z = r * h;
        return { x, z };
    }

    // Get distance between two grid positions
    getGridDistance(q1, r1, q2, r2) {
        const dq = Math.abs(q1 - q2);
        const dr = Math.abs(r1 - r2);
        return Math.max(dq, dr);
    }

    // Get triangles within grid distance
    getTrianglesInRange(q, r, range) {
        const nearbyTriangles = [];
        
        for (const [key, triangle] of this.triangles.entries()) {
            const distance = this.getGridDistance(q, r, triangle.q, triangle.r);
            if (distance <= range) {
                nearbyTriangles.push(triangle);
            }
        }
        
        return nearbyTriangles;
    }

    // Get world positions of triangle corners
    getCornerWorldPositions(q, r) {
        const size = this.size;
        const h = size * Math.sqrt(3);
        const isUpward = (q + r) % 2 === 0;
        const basePos = this.getWorldPosition(q, r);
        
        if (isUpward) {
            return [
                { x: basePos.x - size/2, z: basePos.z - h/3 },     // Bottom left
                { x: basePos.x + size/2, z: basePos.z - h/3 },     // Bottom right
                { x: basePos.x, z: basePos.z + 2*h/3 }             // Top
            ];
        } else {
            return [
                { x: basePos.x - size/2, z: basePos.z + h/3 },     // Top left
                { x: basePos.x + size/2, z: basePos.z + h/3 },     // Top right
                { x: basePos.x, z: basePos.z - 2*h/3 }             // Bottom
            ];
        }
    }

    // Get neighboring positions for a given coordinate
    getNeighbors(q, r) {
        const neighbors = [];
        const isUpward = (q + r) % 2 === 0;
        
        // Different neighbor patterns for upward/downward triangles
        const neighborOffsets = isUpward ? [
            {q: -1, r: 0},  // Left
            {q: 1, r: 0},   // Right
            {q: 0, r: 1}    // Bottom
        ] : [
            {q: -1, r: 0},  // Left
            {q: 1, r: 0},   // Right
            {q: 0, r: -1}   // Top
        ];
        
        // Add valid neighbors
        for (const offset of neighborOffsets) {
            const newQ = q + offset.q;
            const newR = r + offset.r;
            if (this.isValidPosition(newQ, newR)) {
                neighbors.push({q: newQ, r: newR});
            }
        }
        
        return neighbors;
    }
}

export default TriangleGrid;
