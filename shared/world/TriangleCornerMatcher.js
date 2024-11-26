// Class dedicated to handling triangle corner matching logic
class TriangleCornerMatcher {
    constructor() {
        // Map of corner indices to their names for each orientation
        this.cornerNames = {
            upward: {
                0: "Top",
                1: "Bottom-Right",
                2: "Bottom-Left"
            },
            downward: {
                0: "Bottom",
                1: "Top-Left",
                2: "Top-Right"
            }
        };

        // Define triangles that share each corner vertex
        // For each triangle orientation and corner, list all triangles that share that vertex
        this.cornerNeighbors = {
            upward: [
                [ // Top corner (0) neighbors
                    { offset: { q: 0, r: -1 }, corner: 0 },  // Direct top
                    { offset: { q: -1, r: -1 }, corner: 2 }, // Top left
                    { offset: { q: 1, r: -1 }, corner: 1 },  // Top right
                    { offset: { q: -1, r: 0 }, corner: 1 },  // Left
                    { offset: { q: 1, r: 0 }, corner: 2 }    // Right
                ],
                [ // Bottom-Right corner (1) neighbors
                    { offset: { q: 1, r: 0 }, corner: 0 },   // Right
                    { offset: { q: 2, r: 0 }, corner: 2 },   // Far right
                    { offset: { q: 1, r: 1 }, corner: 1 },   // Bottom right
                    { offset: { q: 0, r: 1 }, corner: 2 },   // Bottom
                    { offset: { q: 1, r: -1 }, corner: 2 }   // Top right
                ],
                [ // Bottom-Left corner (2) neighbors
                    { offset: { q: -1, r: 0 }, corner: 0 },  // Left
                    { offset: { q: -2, r: 0 }, corner: 1 },  // Far left
                    { offset: { q: -1, r: 1 }, corner: 2 },  // Bottom left
                    { offset: { q: 0, r: 1 }, corner: 1 },   // Bottom
                    { offset: { q: -1, r: -1 }, corner: 1 }  // Top left
                ]
            ],
            downward: [
                [ // Bottom corner (0) neighbors
                    { offset: { q: 0, r: 1 }, corner: 0 },   // Direct bottom
                    { offset: { q: -1, r: 1 }, corner: 2 },  // Bottom left
                    { offset: { q: 1, r: 1 }, corner: 1 },   // Bottom right
                    { offset: { q: -1, r: 0 }, corner: 1 },  // Left
                    { offset: { q: 1, r: 0 }, corner: 2 }    // Right
                ],
                [ // Top-Left corner (1) neighbors
                    { offset: { q: -1, r: 0 }, corner: 0 },  // Left
                    { offset: { q: -2, r: 0 }, corner: 2 },  // Far left
                    { offset: { q: -1, r: -1 }, corner: 1 }, // Top left
                    { offset: { q: 0, r: -1 }, corner: 2 },  // Top
                    { offset: { q: -1, r: 1 }, corner: 2 }   // Bottom left
                ],
                [ // Top-Right corner (2) neighbors
                    { offset: { q: 1, r: 0 }, corner: 0 },   // Right
                    { offset: { q: 2, r: 0 }, corner: 1 },   // Far right
                    { offset: { q: 1, r: -1 }, corner: 2 },  // Top right
                    { offset: { q: 0, r: -1 }, corner: 1 },  // Top
                    { offset: { q: 1, r: 1 }, corner: 1 }    // Bottom right
                ]
            ]
        };
    }

    // Get the orientation of a triangle at given coordinates
    getTriangleOrientation(q, r) {
        return (q + r) % 2 === 0 ? 'upward' : 'downward';
    }

    // Get the name of a corner for a given triangle orientation
    getCornerName(orientation, cornerIndex) {
        return this.cornerNames[orientation][cornerIndex] || "Unknown";
    }

    // Get all triangles that share a corner vertex
    getCornerNeighbors(q, r, cornerIndex) {
        const orientation = this.getTriangleOrientation(q, r);
        return this.cornerNeighbors[orientation][cornerIndex].map(neighbor => ({
            ...neighbor,
            q: q + neighbor.offset.q,
            r: r + neighbor.offset.r
        }));
    }

    // Get neighbor triangle if it exists
    getNeighborTriangle(grid, q, r) {
        if (!grid) return null;
        return grid.getTriangle(q, r);
    }

    // Check if a corner matches with all triangles that share its vertex
    doCornerMatch(grid, triangle, cornerIndex, debugRenderer = null) {
        const neighbors = this.getCornerNeighbors(triangle.q, triangle.r, cornerIndex);
        const orientation = this.getTriangleOrientation(triangle.q, triangle.r);
        
        // Map corner index to ground type index based on orientation
        let myGroundTypeIndex;
        if (orientation === 'upward') {
            switch(cornerIndex) {
                case 0: myGroundTypeIndex = 3; break;  // Top maps to index 3 (top/bottom)
                case 1: myGroundTypeIndex = 2; break;  // Bottom-Right maps to index 2 (right)
                case 2: myGroundTypeIndex = 1; break;  // Bottom-Left maps to index 1 (left)
                default: return false;
            }
        } else {
            switch(cornerIndex) {
                case 0: myGroundTypeIndex = 3; break;  // Bottom maps to index 3 (top/bottom)
                case 1: myGroundTypeIndex = 1; break;  // Top-Left maps to index 1 (left)
                case 2: myGroundTypeIndex = 2; break;  // Top-Right maps to index 2 (right)
                default: return false;
            }
        }

        // Get my ground type for this corner
        const myGroundType = triangle.groundTypes[myGroundTypeIndex];
        
        // Check all neighbors that share this vertex
        for (const neighbor of neighbors) {
            const neighborTriangle = this.getNeighborTriangle(grid, neighbor.q, neighbor.r);
            if (!neighborTriangle) continue; // Skip if no neighbor

            const neighborOrientation = this.getTriangleOrientation(neighbor.q, neighbor.r);
            let neighborGroundTypeIndex;

            // Map neighbor's corner to its ground type index
            if (neighborOrientation === 'upward') {
                switch(neighbor.corner) {
                    case 0: neighborGroundTypeIndex = 3; break;  // Top maps to index 3 (top/bottom)
                    case 1: neighborGroundTypeIndex = 2; break;  // Bottom-Right maps to index 2 (right)
                    case 2: neighborGroundTypeIndex = 1; break;  // Bottom-Left maps to index 1 (left)
                    default: continue;
                }
            } else {
                switch(neighbor.corner) {
                    case 0: neighborGroundTypeIndex = 3; break;  // Bottom maps to index 3 (top/bottom)
                    case 1: neighborGroundTypeIndex = 1; break;  // Top-Left maps to index 1 (left)
                    case 2: neighborGroundTypeIndex = 2; break;  // Top-Right maps to index 2 (right)
                    default: continue;
                }
            }

            // Compare ground types
            const neighborGroundType = neighborTriangle.groundTypes[neighborGroundTypeIndex];
            if (neighborGroundType !== myGroundType) {
                if (debugRenderer) {
                    console.log(`Corner mismatch at (${triangle.q}, ${triangle.r}), corner ${cornerIndex}`);
                    console.log(`My ground type: ${myGroundType}, Neighbor (${neighbor.q}, ${neighbor.r}) ground type: ${neighborGroundType}`);
                }
                return false;
            }
        }

        return true;
    }

    // Validate if ground types match with all neighboring triangles
    validateGroundTypes(grid, q, r, groundTypes) {
        const triangle = { q, r, groundTypes };
        
        // Check all three corners
        for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
            if (!this.doCornerMatch(grid, triangle, cornerIndex)) {
                return false;
            }
        }
        
        return true;
    }

    // Get the required ground type for a corner based on neighbors
    getRequiredGroundType(grid, q, r, cornerIndex) {
        const neighbors = this.getCornerNeighbors(q, r, cornerIndex);
        const orientation = this.getTriangleOrientation(q, r);
        
        // Check neighbors for existing ground types
        for (const neighbor of neighbors) {
            const neighborTriangle = this.getNeighborTriangle(grid, neighbor.q, neighbor.r);
            if (neighborTriangle) {
                const neighborOrientation = this.getTriangleOrientation(neighbor.q, neighbor.r);
                let neighborGroundTypeIndex;

                // Map neighbor's corner to its ground type index
                if (neighborOrientation === 'upward') {
                    switch(neighbor.corner) {
                        case 0: neighborGroundTypeIndex = 3; break;  // Top maps to index 3 (top/bottom)
                        case 1: neighborGroundTypeIndex = 2; break;  // Bottom-Right maps to index 2 (right)
                        case 2: neighborGroundTypeIndex = 1; break;  // Bottom-Left maps to index 1 (left)
                        default: continue;
                    }
                } else {
                    switch(neighbor.corner) {
                        case 0: neighborGroundTypeIndex = 3; break;  // Bottom maps to index 3 (top/bottom)
                        case 1: neighborGroundTypeIndex = 1; break;  // Top-Left maps to index 1 (left)
                        case 2: neighborGroundTypeIndex = 2; break;  // Top-Right maps to index 2 (right)
                        default: continue;
                    }
                }

                // Return the first found neighbor's ground type
                return neighborTriangle.groundTypes[neighborGroundTypeIndex];
            }
        }
        
        // If no neighbors found, return null
        return null;
    }

    // Get ground types that would match with neighbors
    getMatchingGroundTypes(grid, q, r) {
        const orientation = this.getTriangleOrientation(q, r);
        const groundTypes = ['GRASS', 'WATER', 'SAND', 'ROCK'];
        let result = [
            groundTypes[Math.floor(Math.random() * groundTypes.length)], // Center
            null, // Left
            null, // Right
            null  // Top/Bottom
        ];

        // Map corners to ground type indices based on orientation
        const cornerToGroundType = orientation === 'upward' ? {
            0: 3, // Top maps to index 3 (top/bottom)
            1: 2, // Bottom-Right maps to index 2 (right)
            2: 1  // Bottom-Left maps to index 1 (left)
        } : {
            0: 3, // Bottom maps to index 3 (top/bottom)
            1: 1, // Top-Left maps to index 1 (left)
            2: 2  // Top-Right maps to index 2 (right)
        };

        // Get required ground types for each corner
        for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
            const requiredType = this.getRequiredGroundType(grid, q, r, cornerIndex);
            if (requiredType) {
                const groundTypeIndex = cornerToGroundType[cornerIndex];
                result[groundTypeIndex] = requiredType;
            }
        }

        // Fill in any remaining null ground types with random values
        for (let i = 0; i < result.length; i++) {
            if (result[i] === null) {
                result[i] = groundTypes[Math.floor(Math.random() * groundTypes.length)];
            }
        }

        return result;
    }
}

export default TriangleCornerMatcher;
