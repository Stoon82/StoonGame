// Coordinate system for triangular grid
// Using axial coordinates (q,r) which is a common system for hexagonal/triangular grids
export class TriangleGrid {
    constructor() {
        this.triangles = new Map(); // Store triangle data with coordinates as keys
        this.size = 1; // Side length of triangle
    }

    // Convert axial coordinates to a string key
    static coordToKey(q, r) {
        return `${q},${r}`;
    }

    // Get the vertices and arc centers of a triangle at given coordinates
    static getTriangleGeometry(q, r, size = 1) {
        const h = size * Math.sqrt(3); // Height of the triangle
        const isUpward = (q + r) % 2 === 0;
        
        // Calculate center of the triangle
        const centerX = q * size// * 1; // Reduced from 2 to 1.5 to bring triangles closer horizontally
        const centerY = r * h //* 1.1; // Adjusted from h/2 to h*0.4 to reduce vertical spacing
        
        // Calculate vertices
        let vertices;
        const vert_offset=.1667*h;
        if (isUpward) {
            vertices = [
                { x: centerX - size, y: centerY - h/3 -vert_offset},     // Bottom left
                { x: centerX + size, y: centerY - h/3 -vert_offset},     // Bottom right
                { x: centerX, y: centerY + 2*h/3-vert_offset }           // Top
            ];
        } else {
            vertices = [
                { x: centerX - size, y: centerY + h/3  +vert_offset},     // Top left
                { x: centerX + size, y: centerY + h/3 +vert_offset },     // Top right
                { x: centerX, y: centerY - 2*h/3 +vert_offset }           // Bottom
            ];
        }

        // Calculate arc centers (at each vertex)
        const arcRadius = size; // Radius is equal to side length
        const arcCenters = vertices.map(vertex => ({
            x: vertex.x,
            y: vertex.y,
            radius: arcRadius
        }));

        return {
            vertices,
            arcCenters,
            isUpward,
            center: { x: centerX, y: centerY }
        };
    }

    // Get neighboring triangle coordinates and their shared vertices
    getNeighbors(q, r) {
        const isUpward = (q + r) % 2 === 0;
        if (isUpward) {
            return [
                { q: q-1, r: r, sharedVertex: 0 },     // Left
                { q: q+1, r: r, sharedVertex: 1 },     // Right
                { q: q, r: r+1, sharedVertex: 2 }      // Bottom
            ];
        } else {
            return [
                { q: q-1, r: r, sharedVertex: 0 },     // Left
                { q: q+1, r: r, sharedVertex: 1 },     // Right
                { q: q, r: r-1, sharedVertex: 2 }      // Top
            ];
        }
    }

    // Add a triangle to the grid with arc colors
    setTriangle(q, r, data) {
        const key = TriangleGrid.coordToKey(q, r);
        const geometry = TriangleGrid.getTriangleGeometry(q, r, this.size);
        
        // If arc colors aren't provided, generate random ones with proper hex format
        if (!data.arcColors) {
            data.arcColors = [
                '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
            ];
        }

        this.triangles.set(key, {
            q,
            r,
            data,
            ...geometry
        });

        return this.validateArcColors(q, r);
    }

    // Validate that arc colors match with neighbors
    validateArcColors(q, r) {
        const triangle = this.getTriangle(q, r);
        if (!triangle) return false;

        const neighbors = this.getNeighbors(q, r);
        for (const neighbor of neighbors) {
            const neighborTriangle = this.getTriangle(neighbor.q, neighbor.r);
            if (neighborTriangle) {
                // Check if the shared vertex colors match
                const myColor = triangle.data.arcColors[neighbor.sharedVertex];
                const theirVertex = this.getSharedVertexIndex(neighbor.q, neighbor.r, q, r);
                const theirColor = neighborTriangle.data.arcColors[theirVertex];
                
                if (myColor !== theirColor) {
                    return false;
                }
            }
        }
        return true;
    }

    // Get the vertex index that a triangle shares with another triangle
    getSharedVertexIndex(q1, r1, q2, r2) {
        const neighbors = this.getNeighbors(q1, r1);
        for (const neighbor of neighbors) {
            if (neighbor.q === q2 && neighbor.r === r2) {
                return neighbor.sharedVertex;
            }
        }
        return -1;
    }

    // Get a triangle from the grid
    getTriangle(q, r) {
        const key = TriangleGrid.coordToKey(q, r);
        return this.triangles.get(key);
    }

    // Check if coordinates are within the grid
    hasTriangle(q, r) {
        const key = TriangleGrid.coordToKey(q, r);
        return this.triangles.has(key);
    }

    // Convert screen/world coordinates to grid coordinates
    worldToGrid(x, y, size = 1) {
        const h = size * Math.sqrt(3) / 2;
        
        // First approximate q
        let q = Math.round(x / (size * 3/2));
        let r = Math.round(y / (h * 2));

        // Fine-tune the position by checking nearby triangles
        const possibleTriangles = [
            { q, r },
            { q: q-1, r },
            { q: q+1, r },
            { q, r: r-1 },
            { q, r: r+1 }
        ];

        let minDist = Infinity;
        let bestCoord = { q, r };

        for (const coord of possibleTriangles) {
            const vertices = TriangleGrid.getTriangleGeometry(coord.q, coord.r, size).vertices;
            const dist = this.pointTriangleDistance(x, y, vertices);
            if (dist < minDist) {
                minDist = dist;
                bestCoord = coord;
            }
        }

        return bestCoord;
    }

    // Helper function to calculate distance from point to triangle
    pointTriangleDistance(px, py, vertices) {
        let minDist = Infinity;
        for (let i = 0; i < 3; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % 3];
            const dist = this.pointLineDistance(px, py, v1.x, v1.y, v2.x, v2.y);
            minDist = Math.min(minDist, dist);
        }
        return minDist;
    }

    // Helper function to calculate distance from point to line segment
    pointLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Handle both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TriangleGrid;
}
