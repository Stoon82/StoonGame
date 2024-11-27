class Building {
    constructor(type, size, position) {
        this.type = type;
        this.size = size;
        this.position = position;
        this.id = crypto.randomUUID();
    }
}

class BuildingSystem {
    constructor() {
        this.buildings = new Map();
        this.buildingTypes = {
            tent: {
                small: { width: 1, height: 1, cost: 50 },
                medium: { width: 2, height: 2, cost: 100 },
                big: { width: 3, height: 3, cost: 150 }
            },
            hut: {
                small: { width: 1, height: 1, cost: 100 },
                medium: { width: 2, height: 2, cost: 200 },
                big: { width: 3, height: 3, cost: 300 }
            },
            house: {
                small: { width: 2, height: 2, cost: 200 },
                medium: { width: 3, height: 3, cost: 400 },
                big: { width: 4, height: 4, cost: 600 }
            }
        };
    }

    canPlaceBuilding(type, size, position) {
        const buildingSpec = this.buildingTypes[type]?.[size];
        if (!buildingSpec) return false;

        // TODO: Add collision detection with other buildings
        // TODO: Add ground type validation
        // TODO: Add resource validation
        return true;
    }

    placeBuilding(type, size, position) {
        if (!this.canPlaceBuilding(type, size, position)) {
            return null;
        }

        const building = new Building(type, size, position);
        this.buildings.set(building.id, building);
        return building;
    }

    removeBuilding(buildingId) {
        return this.buildings.delete(buildingId);
    }

    getBuildingAtPosition(position) {
        // TODO: Implement position-based building lookup
        return null;
    }

    getAllBuildings() {
        return Array.from(this.buildings.values());
    }

    getAvailableBuildings() {
        const available = [];
        for (const [type, sizes] of Object.entries(this.buildingTypes)) {
            for (const [size, specs] of Object.entries(sizes)) {
                available.push({
                    type,
                    size,
                    specs
                });
            }
        }
        return available;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Building, BuildingSystem };
}
