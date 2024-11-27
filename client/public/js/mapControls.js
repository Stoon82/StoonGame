import { GROUND_TYPES, StoonCenterPointData, StoonCornerPointData, StoonTriangleData } from '/shared/world/StoonMapData.js';

class MapControls {
    constructor(mapSystem, socket) {
        this.mapSystem = mapSystem;
        this.socket = socket;
        this.currentGroundType = 'GRASS';
    }

    setGroundType(groundType) {
        this.currentGroundType = groundType;
    }

    addTriangle(q, r) {
        try {
            // Create triangle data
            const triangleData = new StoonTriangleData(q, r, this.currentGroundType);
            const triangleKey = triangleData.getKey();

            // Only add if it doesn't exist
            if (!this.mapSystem.triangles.has(triangleKey)) {
                // Create center point
                const centerPos = this.mapSystem.calculateCenterPosition(q, r);
                const centerData = new StoonCenterPointData(
                    centerPos,
                    { q, r },
                    this.currentGroundType
                );

                // Create corner points
                const cornerPositions = this.mapSystem.calculateCornerPositions(q, r);
                const cornerDataArray = cornerPositions.map(pos => 
                    new StoonCornerPointData(
                        pos,
                        { q, r },
                        this.currentGroundType
                    )
                );

                // Add to map system
                this.mapSystem.triangles.set(triangleKey, triangleData);
                this.mapSystem.centerPoints.set(centerData.getKey(), centerData);
                cornerDataArray.forEach(cornerData => {
                    this.mapSystem.cornerPoints.set(cornerData.getKey(), cornerData);
                });

                // Send updates to server
                if (this.socket) {
                    // Send triangle update
                    this.socket.emit('updateMap', {
                        type: 'triangle',
                        data: triangleData.toData(),
                        timestamp: Date.now()
                    });

                    // Send center point update
                    this.socket.emit('updateMap', {
                        type: 'centerPoint',
                        data: centerData.toData(),
                        timestamp: Date.now()
                    });

                    // Send corner point updates
                    cornerDataArray.forEach(cornerData => {
                        this.socket.emit('updateMap', {
                            type: 'cornerPoint',
                            data: cornerData.toData(),
                            timestamp: Date.now()
                        });
                    });
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('[MapControls] Error adding triangle:', error);
            return false;
        }
    }

    removeTriangle(q, r) {
        try {
            const triangleData = new StoonTriangleData(q, r, this.currentGroundType);
            const triangleKey = triangleData.getKey();

            if (this.mapSystem.triangles.has(triangleKey)) {
                // Remove from map system
                this.mapSystem.triangles.delete(triangleKey);

                // Remove center point
                const centerData = new StoonCenterPointData(
                    this.mapSystem.calculateCenterPosition(q, r),
                    { q, r },
                    this.currentGroundType
                );
                this.mapSystem.centerPoints.delete(centerData.getKey());

                // Remove corner points
                const cornerPositions = this.mapSystem.calculateCornerPositions(q, r);
                cornerPositions.forEach(pos => {
                    const cornerData = new StoonCornerPointData(
                        pos,
                        { q, r },
                        this.currentGroundType
                    );
                    this.mapSystem.cornerPoints.delete(cornerData.getKey());
                });

                // Send updates to server
                if (this.socket) {
                    this.socket.emit('removeMapElement', {
                        type: 'triangle',
                        key: triangleKey,
                        timestamp: Date.now()
                    });
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('[MapControls] Error removing triangle:', error);
            return false;
        }
    }

    updateGroundType(q, r, newGroundType) {
        try {
            const triangleData = new StoonTriangleData(q, r, newGroundType);
            const triangleKey = triangleData.getKey();

            if (this.mapSystem.triangles.has(triangleKey)) {
                // Update triangle
                this.mapSystem.triangles.set(triangleKey, triangleData);

                // Update center point
                const centerPos = this.mapSystem.calculateCenterPosition(q, r);
                const centerData = new StoonCenterPointData(
                    centerPos,
                    { q, r },
                    newGroundType
                );
                this.mapSystem.centerPoints.set(centerData.getKey(), centerData);

                // Update corner points
                const cornerPositions = this.mapSystem.calculateCornerPositions(q, r);
                cornerPositions.forEach(pos => {
                    const cornerData = new StoonCornerPointData(
                        pos,
                        { q, r },
                        newGroundType
                    );
                    this.mapSystem.cornerPoints.set(cornerData.getKey(), cornerData);
                });

                // Send updates to server
                if (this.socket) {
                    this.socket.emit('updateMap', {
                        type: 'triangle',
                        data: triangleData.toData(),
                        timestamp: Date.now()
                    });
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('[MapControls] Error updating ground type:', error);
            return false;
        }
    }
}

export default MapControls;
