// A map system that uses separate arrays for corner points and center points
class TriangleMapSystem {
    constructor() {
        // Map to store corner points: key is "x,z", value is {worldPos: {x,z}, gridPos: {q,r}, groundTypes: string[]}
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
            return cornerIndex === 0 ? 2 : // Bottom left -> left
                   cornerIndex === 1 ? 1 : // Bottom right -> right
                   3;                      // Top -> top/bottom
        } else {
            return cornerIndex === 0 ? 2 : // Top left -> left
                   cornerIndex === 1 ? 1 : // Top right -> right
                   3;                      // Bottom -> top/bottom
        }
    }

    // Try to add a triangle at given grid coordinates with specified ground types
    // groundTypes is an array of 4 elements: [center, right, left, top/bottom]
    canAddTriangle(q, r, groundTypes) {
        console.log(`\n[TriangleMapSystem] Validating triangle at (${q}, ${r}) with types:`, groundTypes);
        
        // Check if center point already exists
        if (this.hasCenterPoint(q, r)) {
            console.log(`[TriangleMapSystem] ❌ Validation failed: Center point already exists at (${q}, ${r})`);
            return { valid: false, corners: [] };
        }

        const cornerPositions = this.calculateCornerPositions(q, r);
        const isUpward = (q + r) % 2 === 0;

        // Log all registered corner points
        console.log('\nRegistered Corner Points:');
        this.cornerPoints.forEach((value, key) => {
            console.log(`${key}:`, value.groundTypes);
        });

        // Log cursor triangle corner positions
        console.log('\nCursor Triangle Corners:');
        cornerPositions.forEach((pos, i) => {
            const key = this.worldToKey(pos.x, pos.z);
            console.log(`Corner ${i}: ${key}`);
            console.log(`  Position:`, pos);
            console.log(`  Ground Type Index:`, this.getCornerGroundTypeIndex(i, isUpward));
            console.log(`  Ground Type:`, groundTypes[this.getCornerGroundTypeIndex(i, isUpward)]);
            const existing = this.cornerPoints.get(key);
            if (existing) {
                console.log(`  Existing Ground Types:`, existing.groundTypes);
            } else {
                console.log(`  No existing point`);
            }
        });

        const validationResults = {
            valid: true,
            corners: []
        };

        let hasMatchingCorner = false;

        // Check each corner
        for (let i = 0; i < 3; i++) {
            const cornerPos = cornerPositions[i];
            const cornerKey = this.worldToKey(cornerPos.x, cornerPos.z);
            const existingCorner = this.cornerPoints.get(cornerKey);
            const groundTypeIndex = this.getCornerGroundTypeIndex(i, isUpward);
            const newGroundType = groundTypes[groundTypeIndex];

            let cornerValid = true;
            let cornerTypes = [];

            if (existingCorner) {
                cornerTypes = existingCorner.groundTypes;
                console.log(`[TriangleMapSystem] Checking corner ${i} at ${cornerKey}:`, {
                    existing: cornerTypes,
                    new: newGroundType,
                    index: groundTypeIndex
                });

                // Check if this corner already has a different ground type
                if (cornerTypes.length > 0) {
                    if (cornerTypes[0] !== newGroundType) {
                        cornerValid = false;
                        console.log(`[TriangleMapSystem] ❌ Corner ${i} has different ground type`);
                        console.log(`  Existing type: ${cornerTypes[0]}`);
                        console.log(`  Attempted new type: ${newGroundType}`);
                        validationResults.valid = false;
                    } else {
                        hasMatchingCorner = true;
                        console.log(`[TriangleMapSystem] ✅ Found matching corner at ${i} with type: ${newGroundType}`);
                    }
                }
            } else {
                console.log(`[TriangleMapSystem] Corner ${i} is new`);
            }

            validationResults.corners.push({
                x: cornerPos.x,
                z: cornerPos.z,
                valid: cornerValid,
                groundType: newGroundType,
                existing: cornerTypes,
                cornerIndex: i,
                isUpward: isUpward
            });
        }

        // If no corner matches an existing corner point with same ground type, fail validation
        if (!hasMatchingCorner && this.cornerPoints.size > 0) {
            console.log(`[TriangleMapSystem] ❌ Validation failed: No corner connects to existing triangle with matching ground type`);
            validationResults.valid = false;
        }

        console.log(`[TriangleMapSystem] Validation ${validationResults.valid ? '✅ passed' : '❌ failed'} for triangle at (${q}, ${r})`);
        return validationResults;
    }

    // Add a triangle at given grid coordinates with specified ground types
    // Returns true if successful, false if not possible
    addTriangle(q, r, groundTypes) {
        console.log(`[TriangleMapSystem] Adding triangle at (${q}, ${r}) with types:`, groundTypes);
        
        // Validate before adding
        const validation = this.canAddTriangle(q, r, groundTypes);
        if (!validation.valid) {
            console.log(`[TriangleMapSystem] ❌ Cannot add triangle: validation failed`);
            return false;
        }

        const cornerPositions = this.calculateCornerPositions(q, r);
        const centerPos = this.calculateCenterPosition(q, r);
        const isUpward = (q + r) % 2 === 0;

        // Add center point
        const centerKey = this.gridToKey(q, r);
        this.centerPoints.set(centerKey, {
            worldPos: centerPos,
            groundType: groundTypes[0] // Center ground type
        });
        console.log(`[TriangleMapSystem] Added center point at (${q}, ${r}) with type:`, groundTypes[0]);

        // Add or update corner points
        for (let i = 0; i < 3; i++) {
            const cornerPos = cornerPositions[i];
            const cornerKey = this.worldToKey(cornerPos.x, cornerPos.z);
            let cornerPoint = this.cornerPoints.get(cornerKey);
            const groundTypeIndex = this.getCornerGroundTypeIndex(i, isUpward);
            const newGroundType = groundTypes[groundTypeIndex];

            if (!cornerPoint) {
                cornerPoint = {
                    worldPos: cornerPos,
                    gridPos: { q, r },
                    groundTypes: [newGroundType]
                };
                this.cornerPoints.set(cornerKey, cornerPoint);
                console.log(`[TriangleMapSystem] Added new corner point at (${cornerPos.x}, ${cornerPos.z}) with type:`, newGroundType);
            } else if (!cornerPoint.groundTypes.includes(newGroundType)) {
                // This should never happen since we validated, but let's be safe
                if (cornerPoint.groundTypes.length > 0 && cornerPoint.groundTypes[0] !== newGroundType) {
                    console.error(`[TriangleMapSystem] ⚠️ Inconsistent state: Trying to add mismatched ground type ${newGroundType} to corner with ${cornerPoint.groundTypes[0]}`);
                    return false;
                }
                cornerPoint.groundTypes.push(newGroundType);
                console.log(`[TriangleMapSystem] Updated corner point at (${cornerPos.x}, ${cornerPos.z}), added type:`, newGroundType);
            }
        }

        // Log the state after adding the triangle
        this.logMapState();
        this.updateDebugOverlay();
        return true;
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
            console.log('  Ground Types:', value.groundTypes);
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
            debugText += `  Ground Types: [${value.groundTypes.join(', ')}]\n`;
        });

        debugElement.textContent = debugText;
    }

    addCornerPoint(worldX, worldZ, gridQ, gridR, groundType) {
        const key = this.worldToKey(worldX, worldZ);
        if (!this.cornerPoints.has(key)) {
            this.cornerPoints.set(key, {
                worldPos: { x: worldX, z: worldZ },
                gridPos: { q: gridQ, r: gridR },
                groundTypes: []
            });
        }
        const point = this.cornerPoints.get(key);
        if (!point.groundTypes.includes(groundType)) {
            point.groundTypes.push(groundType);
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
