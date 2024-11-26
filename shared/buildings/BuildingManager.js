import { Building, BUILDING_TYPES } from './Building.js';

export class BuildingManager {
    constructor(grid) {
        this.grid = grid;
        this.buildings = new Map();
        this.buildingPlaceholder = null;
    }

    createBuilding(type, position) {
        if (!BUILDING_TYPES[type]) {
            console.error(`Invalid building type: ${type}`);
            return null;
        }

        if (!this.isValidBuildingPosition(position.q, position.r)) {
            console.error(`Invalid building position: ${JSON.stringify(position)}`);
            return null;
        }

        const building = new Building(type, position);
        this.buildings.set(building.id, building);
        return building;
    }

    removeBuilding(id) {
        return this.buildings.delete(id);
    }

    getBuilding(id) {
        return this.buildings.get(id);
    }

    update(deltaTime) {
        for (const building of this.buildings.values()) {
            building.update(deltaTime);
        }
    }

    setPlaceholder(type, position) {
        this.buildingPlaceholder = { type, position };
    }

    clearPlaceholder() {
        this.buildingPlaceholder = null;
    }

    getPlaceholder() {
        return this.buildingPlaceholder;
    }

    // Get all valid corner positions for a triangle
    getTriangleCorners(q, r) {
        const triangle = this.grid.getTriangle(q, r);
        if (!triangle) return [];

        const geometry = this.grid.getTriangleGeometry(q, r);
        return geometry.vertices.map((vertex, index) => ({
            q, r,
            corner: index,
            x: vertex.x,
            z: vertex.y // Note: y in 2D becomes z in 3D
        }));
    }

    // Check if a position is valid for building
    isValidBuildingPosition(q, r) {
        const triangle = this.grid.getTriangle(q, r);
        if (!triangle) return false;

        // Don't build on water
        if (triangle.groundTypes.includes('WATER')) return false;

        // Check if there's already a building too close to this position
        for (const building of this.buildings.values()) {
            const pos = building.position;
            const dx = pos.worldX - building.position.worldX;
            const dz = pos.worldZ - building.position.worldZ;
            const distSq = dx * dx + dz * dz;
            if (distSq < 0.5 * 0.5) { // Minimum 0.5 unit distance between buildings
                return false;
            }
        }

        return true;
    }

    // Get all buildings in range of a position
    getBuildingsInRange(q, r, range) {
        const result = [];
        for (const building of this.buildings.values()) {
            const pos = building.position;
            const distance = this.grid.getGridDistance(q, r, pos.q, pos.r);
            if (distance <= range) {
                result.push(building);
            }
        }
        return result;
    }
}
