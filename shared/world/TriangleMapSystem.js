// A map system that uses separate arrays for corner points and center points
import SpatialIndex from './SpatialIndex.js';

class TriangleMapSystem {
    constructor(socket = null) {
        // Map to store corner points: key is "x,z", value is {worldPos: {x,z}, gridPos: {q,r}, groundType: string}
        this.cornerPoints = new Map();
        // Map to store center points: key is "q,r", value is {worldPos: {x,z}, groundType: string}
        this.centerPoints = new Map();
        this.spatialIndex = new SpatialIndex();
        this.size = 1; // Base size of triangles
        this.scene = null; // Will be set by WorldRenderer
        this.socket = socket; // Socket.io connection

        if (this.socket) {
            this.setupSocketListeners();
        }
    }

    setupSocketListeners() {
        // Handle initial map state
        this.socket.on('mapState', (mapData) => {
            console.log('[TriangleMapSystem] Received map state:', mapData);
            this.loadMapData(mapData);
        });

        // Handle map updates from other clients
        this.socket.on('mapUpdate', (update) => {
            console.log('[TriangleMapSystem] Received map update:', update);
            if (update.type === 'centerPoint') {
                this.centerPoints.set(update.key, update.data);
            } else if (update.type === 'cornerPoint') {
                this.cornerPoints.set(update.key, update.data);
            }
            this.updateDebugOverlay();
        });

        // Handle connection/reconnection
        this.socket.on('connect', () => {
            console.log('[TriangleMapSystem] Connected to server');
            // Request current map state on connection
            this.socket.emit('joinRoom', { mapId: 'default' });
        });

        // Handle disconnection
        this.socket.on('disconnect', () => {
            console.log('[TriangleMapSystem] Disconnected from server');
        });

        // Handle errors
        this.socket.on('error', (error) => {
            console.error('[TriangleMapSystem] Socket error:', error);
        });
    }

    loadMapData(mapData) {
        console.log('[TriangleMapSystem] Loading map data...');
        
        // Clear existing data
        this.cornerPoints.clear();
        this.centerPoints.clear();
        this.spatialIndex = new SpatialIndex();

        try {
            // Load corner points
            if (mapData.cornerPoints) {
                Object.entries(mapData.cornerPoints).forEach(([key, value]) => {
                    if (value && value.worldPos) {
                        this.cornerPoints.set(key, value);
                        this.spatialIndex.insert(key, {
                            ...value,
                            worldPos: { x: Number(value.worldPos.x), y: 0, z: Number(value.worldPos.z) }
                        });
                    } else {
                        console.warn(`[TriangleMapSystem] Invalid corner point data at key ${key}:`, value);
                    }
                });
            }

            // Load center points
            if (mapData.centerPoints) {
                Object.entries(mapData.centerPoints).forEach(([key, value]) => {
                    if (value && value.worldPos) {
                        this.centerPoints.set(key, value);
                        this.spatialIndex.insert(key, {
                            ...value,
                            worldPos: { x: Number(value.worldPos.x), y: 0, z: Number(value.worldPos.z) }
                        });
                    } else {
                        console.warn(`[TriangleMapSystem] Invalid center point data at key ${key}:`, value);
                    }
                });
            }

            console.log(`[TriangleMapSystem] Loaded ${this.cornerPoints.size} corner points and ${this.centerPoints.size} center points`);
            this.updateDebugOverlay();
        } catch (error) {
            console.error('[TriangleMapSystem] Error loading map data:', error);
        }
    }

    setScene(scene) {
        this.scene = scene;
    }

    // Convert world coordinates to a string key
    worldToKey(x, z) {
        // Ensure x and z are numbers and handle undefined/null cases
        const numX = Number(x);
        const numZ = Number(z);
        
        if (isNaN(numX) || isNaN(numZ)) {
            console.error('[TriangleMapSystem] Invalid coordinates:', { x, z });
            return null;
        }
        
        return `${numX.toFixed(6)},${numZ.toFixed(6)}`;
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
        if (!this.canAddTriangle(q, r)) {
            console.warn(`[TriangleMapSystem] Cannot add triangle at (${q}, ${r})`);
            return false;
        }

        const isUpward = (q + r) % 2 === 0;
        const centerPos = this.calculateCenterPosition(q, r);
        const cornerPositions = this.calculateCornerPositions(q, r);
        const centerKey = this.gridToKey(q, r);

        // Get existing corner ground types
        const existingCorners = cornerPositions.map(pos => {
            const key = this.worldToKey(pos.x, pos.z);
            return this.cornerPoints.get(key);
        });

        try {
            // Add center point
            const centerPoint = {
                worldPos: centerPos,
                groundType: newGroundType
            };
            this.centerPoints.set(centerKey, centerPoint);

            // Notify server of center point update
            if (this.socket) {
                this.socket.emit('updateMap', {
                    type: 'centerPoint',
                    key: centerKey,
                    data: centerPoint
                });
            }

            // Add corner points if they don't exist at their grid positions
            cornerPositions.forEach((pos, index) => {
                const key = this.worldToKey(pos.x, pos.z);
                if (!this.cornerPoints.has(key)) {
                    const groundTypeIndex = isUpward ? 
                        (index === 0 ? 1 : index === 1 ? 3 : 2) :  // upward: top, bottom left, bottom right
                        (index === 0 ? 3 : index === 1 ? 2 : 1);   // downward: bottom, top left, top right
                    
                    const cornerPoint = {
                        worldPos: pos,
                        gridPos: { q, r },
                        groundType: existingCorners[index]?.groundType ?? newGroundType
                    };
                    
                    this.cornerPoints.set(key, cornerPoint);

                    // Notify server of corner point update
                    if (this.socket) {
                        this.socket.emit('updateMap', {
                            type: 'cornerPoint',
                            key: key,
                            data: cornerPoint
                        });
                    }
                }
            });

            // Update the visual representation
            this.updateDebugOverlay();
            return true;
        } catch (error) {
            console.error('[TriangleMapSystem] Error adding triangle:', error);
            return false;
        }
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
        // Check if the position exists in centerPoints
        const key = `${q},${r}`;
        const centerPoint = this.centerPoints.get(key);
        
        if (centerPoint && centerPoint.worldPos) {
            return {
                x: centerPoint.worldPos.x,
                y: 0,
                z: centerPoint.worldPos.z
            };
        }

        // If not found in centerPoints, calculate the position
        // Convert axial coordinates (q,r) to world coordinates (x,z)
        const x = this.size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
        const z = this.size * (3/2 * r);

        return { x, y: 0, z };
    }

    getGridPosition(worldX, worldZ) {
        // Convert world coordinates (x,z) to axial coordinates (q,r)
        const q = (Math.sqrt(3)/3 * worldX - 1/3 * worldZ) / this.size;
        const r = (2/3 * worldZ) / this.size;

        // Round to nearest grid coordinates
        return {
            q: Math.round(q),
            r: Math.round(r)
        };
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

    addCornerPoint(point) {
        if (!point || !point.data || !point.data.worldPos) {
            console.error('[TriangleMapSystem] Invalid corner point data:', point);
            return false;
        }

        // Ensure worldPos has valid x and z coordinates
        const worldPos = point.data.worldPos;
        if (typeof worldPos !== 'object' || typeof worldPos.x !== 'number' || typeof worldPos.z !== 'number') {
            console.error('[TriangleMapSystem] Invalid world position in corner point:', worldPos);
            return false;
        }

        const key = this.worldToKey(worldPos.x, worldPos.z);
        
        if (!key) {
            console.error('[TriangleMapSystem] Failed to generate key for corner point:', point);
            return false;
        }

        // Check if point already exists at this position using spatial index
        if (!this.spatialIndex.insert(key, {
            ...point.data,
            worldPos: { x: Number(worldPos.x), y: 0, z: Number(worldPos.z) }
        })) {
            console.log('[TriangleMapSystem] Corner point already exists at position:', worldPos);
            return false;
        }

        // If we got here, the point is new and valid
        this.cornerPoints.set(key, point.data);
        this.updateDebugOverlay();
        return true;
    }

    addCenterPoint(point) {
        if (!point || !point.data || !point.data.worldPos) {
            console.error('[TriangleMapSystem] Invalid center point data:', point);
            return false;
        }

        // Ensure worldPos has valid x and z coordinates
        const worldPos = point.data.worldPos;
        if (typeof worldPos !== 'object' || typeof worldPos.x !== 'number' || typeof worldPos.z !== 'number') {
            console.error('[TriangleMapSystem] Invalid world position in center point:', worldPos);
            return false;
        }

        const key = this.worldToKey(worldPos.x, worldPos.z);

        if (!key) {
            console.error('[TriangleMapSystem] Failed to generate key for center point:', point);
            return false;
        }

        // Check if point already exists at this position using spatial index
        if (!this.spatialIndex.insert(key, {
            ...point.data,
            worldPos: { x: Number(worldPos.x), y: 0, z: Number(worldPos.z) }
        })) {
            console.log('[TriangleMapSystem] Center point already exists at position:', worldPos);
            return false;
        }

        // If we got here, the point is new and valid
        this.centerPoints.set(key, point.data);
        this.updateDebugOverlay();
        return true;
    }

    // Get nearby points within a radius
    getNearbyPoints(position, radius) {
        return this.spatialIndex.findNearby(position, radius);
    }

    // Clear all points
    clear() {
        this.centerPoints.clear();
        this.cornerPoints.clear();
        this.spatialIndex = new SpatialIndex();
        this.updateDebugOverlay();
    }

    // Check if a point is inside a circle arc
    isPointInCircleArc(worldX, worldZ, centerX, centerZ, radius) {
        const dx = worldX - centerX;
        const dz = worldZ - centerZ;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance <= radius;
    }

    // Get the ground type at a given world position
    getGroundTypeAtPosition(worldX, worldZ) {
        // First check if we're inside any circle arcs
        const circleRadius = this.size * 0.8; // Adjust this to match your circle arc size
        
        // Check nearby center points for circle arcs
        for (const [key, centerPoint] of this.centerPoints) {
            const [q, r] = key.split(',').map(Number);
            const worldPos = centerPoint.worldPos;
            
            if (this.isPointInCircleArc(worldX, worldZ, worldPos.x, worldPos.z, circleRadius)) {
                if (window.DEBUG_MODE) {
                    console.log(`[TriangleMapSystem] Found point in circle arc at (${q}, ${r}) with ground type ${centerPoint.groundType}`);
                }
                return centerPoint.groundType;
            }
        }

        // If not in any circle arc, check triangles
        const h = this.size * Math.sqrt(3);
        const ver_offset = h * 1/6;
        
        // Calculate grid coordinates taking into account viewport orientation
        let q = Math.round(worldX / this.size);
        // Invert Z coordinate to match viewport orientation
        let adjustedZ = -worldZ; // Invert Z to match viewport
        let r = Math.round((adjustedZ + (q % 2 === 0 ? ver_offset : -ver_offset)) / h);

        // Check nearby triangles (the exact one and its neighbors)
        const potentialTriangles = [
            { q, r },
            { q: q+1, r },
            { q: q-1, r },
            { q, r: r+1 },
            { q, r: r-1 },
            // Add diagonal neighbors for better coverage
            { q: q+1, r: r+1 },
            { q: q-1, r: r+1 },
            { q: q+1, r: r-1 },
            { q: q-1, r: r-1 }
        ];

        for (const pos of potentialTriangles) {
            if (!this.hasCenterPoint(pos.q, pos.r)) continue;

            const cornerPositions = this.calculateCornerPositions(pos.q, pos.r);
            const isUpward = (pos.q + pos.r) % 2 === 0;

            // Check if point is inside this triangle
            if (this.isPointInTriangle(
                worldX, worldZ,
                cornerPositions[0].x, cornerPositions[0].z,
                cornerPositions[1].x, cornerPositions[1].z,
                cornerPositions[2].x, cornerPositions[2].z
            )) {
                const groundType = this.centerPoints.get(this.gridToKey(pos.q, pos.r)).groundType;
                if (window.DEBUG_MODE) {
                    console.log(`[TriangleMapSystem] Ground type at (${worldX.toFixed(2)}, ${worldZ.toFixed(2)}) is ${groundType} in triangle (${pos.q}, ${pos.r})`);
                }
                return groundType;
            }
        }

        if (window.DEBUG_MODE) {
            console.log(`[TriangleMapSystem] No ground found at position (${worldX.toFixed(2)}, ${worldZ.toFixed(2)})`);
        }
        return null; // No valid ground found at this position
    }

    // Check if a path between two points crosses water or leaves the map
    isValidPath(startX, startZ, endX, endZ) {
        // Check several points along the path
        const steps = 5; // Number of points to check
        const results = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startX + (endX - startX) * t;
            const z = startZ + (endZ - startZ) * t;
            
            const groundType = this.getGroundTypeAtPosition(x, z);
            results.push({
                position: { x, z },
                groundType: groundType
            });

            // Path is invalid if any point is off the map or in water
            if (!groundType || groundType === 'water') {
                if (window.DEBUG_MODE) {
                    console.log(`[TriangleMapSystem] Invalid path at ${i}/${steps}:`, results);
                }
                return false;
            }
        }

        if (window.DEBUG_MODE) {
            console.log(`[TriangleMapSystem] Valid path found:`, results);
        }
        return true;
    }

    // Helper method to check if a point is inside a triangle
    isPointInTriangle(px, pz, x1, z1, x2, z2, x3, z3) {
        const area = 0.5 * (-z2 * x3 + z1 * (-x2 + x3) + x1 * (z2 - z3) + x2 * z3);
        const s = 1 / (2 * area) * (z1 * x3 - x1 * z3 + (z3 - z1) * px + (x1 - x3) * pz);
        const t = 1 / (2 * area) * (x1 * z2 - z1 * x2 + (z1 - z2) * px + (x2 - x1) * pz);
        
        return s >= 0 && t >= 0 && (1 - s - t) >= 0;
    }

    getAllCenterPoints() {
        const points = [];
        for (const [key, point] of this.centerPoints.entries()) {
            const [q, r] = key.split(',').map(Number);
            points.push({
                gridPos: { q, r },
                worldPos: point.worldPos,
                groundType: point.groundType
            });
        }
        return points;
    }

}

export default TriangleMapSystem;
