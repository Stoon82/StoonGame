// A map system that uses separate arrays for corner points and center points
class TriangleMapSystem {
    constructor() {
        // Map to store corner points: key is "x,z", value is {worldPos: {x,z}, gridPos: {q,r}, groundType: string}
        this.cornerPoints = new Map();
        // Map to store center points: key is "q,r", value is {worldPos: {x,z}, groundType: string}
        this.centerPoints = new Map();
        this.size = 1; // Base size of triangles
    }

    // Convert world coordinates to a string key
    worldToKey(x, z) {
        return `${x.toFixed(6)},${z.toFixed(6)}`;
    }

    // Convert grid coordinates to a string key
    gridToKey(q, r) {
        return `${q},${r}`;
    }

    // Calculate triangle corner positions for given grid coordinates
    calculateCornerPositions(q, r) {
        const size = this.size;
        const h = size * Math.sqrt(3);
        const isUpward = (q + r) % 2 === 0;
        const ver_offset = h * 1/6;

        const baseX = q * size * 1;  // Match the renderer's x-scale
        const baseZ = r * h;

        if (isUpward) {
            return [
                { x: baseX - size, z: baseZ - h/3 - ver_offset },     // Bottom left
                { x: baseX + size, z: baseZ - h/3 - ver_offset },     // Bottom right
                { x: baseX, z: baseZ + 2*h/3 - ver_offset }           // Top
            ];
        } else {
            return [
                { x: baseX - size, z: baseZ + h/3 + ver_offset },     // Top left
                { x: baseX + size, z: baseZ + h/3 + ver_offset },     // Top right
                { x: baseX, z: baseZ - 2*h/3 + ver_offset }           // Bottom
            ];
        }
    }

    // Calculate center position for given grid coordinates
    calculateCenterPosition(q, r) {
        const size = this.size;
        const h = size * Math.sqrt(3);
        const ver_offset = h * 1/6;

        return {
            x: q * size * 1,  // Match the renderer's x-scale
            z: r * h + (((q + r) % 2 === 0) ? -ver_offset : ver_offset)  // Add vertical offset based on orientation
        };
    }

    // Check if a corner point exists at given world coordinates
    hasCornerPoint(x, z) {
        return this.cornerPoints.has(this.worldToKey(x, z));
    }

    // Get corner point at given world coordinates
    getCornerPoint(x, z) {
        return this.cornerPoints.get(this.worldToKey(x, z));
    }

    // Check if a center point exists at given grid coordinates
    hasCenterPoint(q, r) {
        return this.centerPoints.has(this.gridToKey(q, r));
    }

    // Get center point at given grid coordinates
    getCenterPoint(q, r) {
        return this.centerPoints.get(this.gridToKey(q, r));
    }

    // Get the ground type index for a corner based on its position
    getCornerGroundTypeIndex(cornerIndex, isUpward) {
        if (isUpward) {
            return cornerIndex === 2 ? 2 : // Bottom left -> left
                   cornerIndex === 1 ? 1 : // Bottom right -> right
                   3;                      // Top -> top/bottom
        } else {
            return cornerIndex === 0 ? 2 : // Top left -> left
                   cornerIndex === 1 ? 1 : // Top right -> right
                   3;                      // Bottom -> top/bottom
        }
    }

    // Try to add a triangle at given grid coordinates with specified ground type
    canAddTriangle(q, r) {
        const centerKey = this.gridToKey(q, r);
        
        // Check if center point already exists
        if (this.centerPoints.has(centerKey)) {
            return { valid: false, reason: "Center point already exists" };
        }

        // Get corner positions
        const cornerPositions = this.calculateCornerPositions(q, r);
        const existingCorners = cornerPositions.map(pos => 
            this.cornerPoints.has(this.worldToKey(pos.x, pos.z))
        );
        
        // Count existing corners
        const numExistingCorners = existingCorners.filter(exists => exists).length;

        // If this is the first triangle, always allow it
        if (this.centerPoints.size === 0) {
            return { valid: true, reason: "First triangle" };
        }

        // For subsequent triangles, require exactly 2 existing corners
        if (numExistingCorners !== 2) {
            return { valid: false, reason: `Need exactly 2 existing corners, found ${numExistingCorners}` };
        }

        return { valid: true, reason: "Valid placement" };
    }

    // Add a triangle at given grid coordinates with specified ground type
    // Returns true if successful, false if not possible
    addTriangle(q, r, newGroundType) {
        const centerKey = this.gridToKey(q, r);
        const cornerPositions = this.calculateCornerPositions(q, r);
        const centerPos = this.calculateCenterPosition(q, r);
        const isUpward = (q + r) % 2 === 0;
        
        // Check if all points already exist
        const centerExists = this.centerPoints.has(centerKey);
        const cornerExists = cornerPositions.every(pos => {
            const key = this.worldToKey(pos.x, pos.z);
            return this.cornerPoints.has(key);
        });

        if (centerExists && cornerExists) {
            console.log('[TriangleMapSystem] All points already exist at:', {q, r});
            return false;
        }

        // For each corner position, find if there's an existing point at that world location
        const existingCorners = cornerPositions.map(pos => {
            const worldKey = this.worldToKey(pos.x, pos.z);
            return Array.from(this.cornerPoints.values())
                .find(point => this.worldToKey(point.worldPos.x, point.worldPos.z) === worldKey);
        });

        // Add center point if it doesn't exist at this grid position
        if (!centerExists) {
            this.centerPoints.set(centerKey, { 
                worldPos: centerPos,
                groundType: newGroundType
            });
        }

        // Add corner points if they don't exist at their grid positions
        cornerPositions.forEach((pos, index) => {
            const key = this.worldToKey(pos.x, pos.z);
            if (!this.cornerPoints.has(key)) {
                const groundTypeIndex = isUpward ? 
                    (index === 0 ? 1 : index === 1 ? 3 : 2) :  // upward: top, bottom left, bottom right
                    (index === 0 ? 3 : index === 1 ? 2 : 1);   // downward: bottom, top left, top right
                
                this.cornerPoints.set(key, {
                    worldPos: pos,
                    gridPos: { q, r },
                    groundType: existingCorners[index]?.groundType ?? newGroundType
                });
            }
        });

        return true;
    }

    // Get the ground types for a triangle at given grid coordinates
    getTriangleGroundTypes(q, r) {
        const centerKey = this.gridToKey(q, r);
        const cornerPositions = this.calculateCornerPositions(q, r);
        const isUpward = (q + r) % 2 === 0;
        
        // Get center ground type
        const center = this.centerPoints.get(centerKey);
        const groundTypes = [center?.groundType];
        
        // Get corner ground types based on triangle orientation
        const corners = cornerPositions.map(pos => {
            const key = this.worldToKey(pos.x, pos.z);
            return this.cornerPoints.get(key);
        });

        if (isUpward) {
            // Upward triangle
            groundTypes[1] = corners[2]?.groundType;  // top
            groundTypes[2] = corners[1]?.groundType;  // bottom right
            groundTypes[3] = corners[0]?.groundType;  // bottom left
        } else {
            // Downward triangle
            groundTypes[1] = corners[0]?.groundType;  // top left
            groundTypes[2] = corners[1]?.groundType;  // top right
            groundTypes[3] = corners[2]?.groundType;  // bottom
        }

        return groundTypes;
    }

    // Get a triangle at the given grid coordinates
    getTriangle(q, r) {
        const centerKey = this.gridToKey(q, r);
        if (!this.centerPoints.has(centerKey)) return null;

        const center = this.centerPoints.get(centerKey);
        const cornerPositions = this.calculateCornerPositions(q, r);
        const groundTypes = this.getTriangleGroundTypes(q, r);

        return {
            q, r,
            worldPos: center.worldPos,
            groundTypes,
            isUpward: (q + r) % 2 === 0
        };
    }

    // Get neighboring triangles
    getNeighbors(q, r) {
        const isUpward = (q + r) % 2 === 0;
        let neighbors;

        if (isUpward) {
            neighbors = [
                { q: q-1, r: r-1 },  // Top left
                { q: q+1, r: r-1 },  // Top right
                { q: q, r: r+1 }     // Bottom
            ];
        } else {
            neighbors = [
                { q: q-1, r: r+1 },  // Bottom left
                { q: q+1, r: r+1 },  // Bottom right
                { q: q, r: r-1 }     // Top
            ];
        }

        return neighbors;
    }

    // Get world position for grid coordinates
    getWorldPosition(q, r) {
        const centerKey = this.gridToKey(q, r);
        if (!this.centerPoints.has(centerKey)) return null;
        return this.centerPoints.get(centerKey).worldPos;
    }

    // Debug method to log the current state of points
    logMapState() {
        console.log('\n[TriangleMapSystem] Current Map State:');
        
        console.log('\nCenter Points:');
        this.centerPoints.forEach((value, key) => {
            console.log(`Key: ${key}`);
            console.log('  World Position:', value.worldPos);
            console.log('  Ground Type:', value.groundType);
        });

        console.log('\nCorner Points:');
        this.cornerPoints.forEach((value, key) => {
            console.log(`Key: ${key}`);
            console.log('  World Position:', value.worldPos);
            console.log('  Grid Position:', value.gridPos);
            console.log('  Ground Type:', value.groundType);
        });

        console.log(`\nTotal Centers: ${this.centerPoints.size}, Total Corners: ${this.cornerPoints.size}\n`);
    }

    updateDebugOverlay() {
        const debugElement = document.getElementById('cornerPointsDebug');
        if (!debugElement) return;

        let debugText = 'Corner Points:\n';
        this.cornerPoints.forEach((value, key) => {
            debugText += `\n${key}:\n`;
            debugText += `  World Pos: (${value.worldPos.x.toFixed(2)}, ${value.worldPos.z.toFixed(2)})\n`;
            debugText += `  Grid Pos: (${value.gridPos.q}, ${value.gridPos.r})\n`;
            debugText += `  Ground Type: ${value.groundType}\n`;
        });

        debugElement.textContent = debugText;
    }

    addCornerPoint(worldX, worldZ, gridQ, gridR, groundType) {
        const key = this.worldToKey(worldX, worldZ);
        if (!this.cornerPoints.has(key)) {
            this.cornerPoints.set(key, {
                worldPos: { x: worldX, z: worldZ },
                gridPos: { q: gridQ, r: gridR },
                groundType: groundType
            });
        } else {
            const point = this.cornerPoints.get(key);
            if (point.groundType !== groundType) {
                point.groundType = groundType;
            }
        }
        this.updateDebugOverlay();
    }

    addCenterPoint(worldX, worldZ, gridQ, gridR, groundType) {
        const key = this.worldToKey(worldX, worldZ);
        this.centerPoints.set(key, {
            worldPos: { x: worldX, z: worldZ },
            gridPos: { q: gridQ, r: gridR },
            groundType: groundType
        });
        this.updateDebugOverlay();
    }

    // Clear all points
    clear() {
        this.cornerPoints.clear();
        this.centerPoints.clear();
        this.updateDebugOverlay();
    }
}

export default TriangleMapSystem;
