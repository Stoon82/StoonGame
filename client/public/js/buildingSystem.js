export default class BuildingSystem {
    constructor() {
        this.buildings = new Map();
        this.buildingTypes = {
            tent: {
                small: { 
                    width: 1, 
                    height: 1, 
                    cost: 50,
                    resources: { wood: 20, stone: 10 },
                    buildTime: 10000 // 10 seconds
                },
                medium: { 
                    width: 2, 
                    height: 2, 
                    cost: 100,
                    resources: { wood: 40, stone: 20 },
                    buildTime: 20000
                },
                big: { 
                    width: 3, 
                    height: 3, 
                    cost: 150,
                    resources: { wood: 60, stone: 30 },
                    buildTime: 30000
                }
            },
            hut: {
                small: { 
                    width: 1, 
                    height: 1, 
                    cost: 100,
                    resources: { wood: 30, stone: 20 },
                    buildTime: 15000
                },
                medium: { 
                    width: 2, 
                    height: 2, 
                    cost: 200,
                    resources: { wood: 60, stone: 40 },
                    buildTime: 25000
                },
                big: { 
                    width: 3, 
                    height: 3, 
                    cost: 300,
                    resources: { wood: 90, stone: 60 },
                    buildTime: 35000
                }
            },
            house: {
                small: { 
                    width: 2, 
                    height: 2, 
                    cost: 200,
                    resources: { wood: 50, stone: 40 },
                    buildTime: 20000
                },
                medium: { 
                    width: 3, 
                    height: 3, 
                    cost: 400,
                    resources: { wood: 100, stone: 80 },
                    buildTime: 30000
                },
                big: { 
                    width: 4, 
                    height: 4, 
                    cost: 600,
                    resources: { wood: 150, stone: 120 },
                    buildTime: 40000
                }
            }
        };
        
        // Track buildings under construction
        this.constructionSites = new Map();
        this.buildingPlaceholder = null;
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

        const buildingSpec = this.buildingTypes[type][size];
        const building = {
            id: crypto.randomUUID(),
            type,
            size,
            position,
            specs: buildingSpec,
            state: 'under_construction',
            constructionProgress: 0,
            requiredResources: { ...buildingSpec.resources },
            assignedWorkers: new Set(),
            maxWorkers: Math.ceil(buildingSpec.buildTime / 5000), // One worker per 5 seconds of build time
            startTime: Date.now()
        };
        
        this.buildings.set(building.id, building);
        this.constructionSites.set(building.id, building);
        return building;
    }

    updateConstruction(deltaTime, soulManager) {
        for (const [buildingId, building] of this.constructionSites) {
            // Skip if no workers assigned
            if (building.assignedWorkers.size === 0) continue;

            // Update construction progress
            const progressPerWorkerPerMs = 1 / building.specs.buildTime;
            const progressThisTick = progressPerWorkerPerMs * building.assignedWorkers.size * deltaTime;
            building.constructionProgress = Math.min(1, building.constructionProgress + progressThisTick);

            // Check if construction is complete
            if (building.constructionProgress >= 1) {
                building.state = 'complete';
                this.constructionSites.delete(buildingId);
                
                // Free up workers
                for (const workerId of building.assignedWorkers) {
                    const soul = soulManager.getSoul(workerId);
                    if (soul) {
                        soul.setTask(null);
                    }
                }
                building.assignedWorkers.clear();
            }
        }
    }

    assignWorkerToBuilding(buildingId, workerId) {
        const building = this.constructionSites.get(buildingId);
        if (!building || building.assignedWorkers.size >= building.maxWorkers) {
            return false;
        }
        building.assignedWorkers.add(workerId);
        return true;
    }

    unassignWorkerFromBuilding(buildingId, workerId) {
        const building = this.constructionSites.get(buildingId);
        if (!building) return false;
        return building.assignedWorkers.delete(workerId);
    }

    getConstructionSites() {
        return Array.from(this.constructionSites.values());
    }

    setPlaceholder(type, position) {
        this.buildingPlaceholder = { type, position };
    }

    clearPlaceholder() {
        this.buildingPlaceholder = null;
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
