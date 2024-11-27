export class BuildingPlacement {
    constructor(buildingSystem, triangleMapSystem, stoonieManager) {
        this.buildingSystem = buildingSystem;
        this.triangleMapSystem = triangleMapSystem;
        this.stoonieManager = stoonieManager;
        this.selectedBuildingType = null;
        this.selectedSize = null;
        this.isPlacing = false;

        // Bind mouse event handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        // Add event listeners
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    startPlacing(buildingType, size) {
        this.selectedBuildingType = buildingType;
        this.selectedSize = size;
        this.isPlacing = true;
    }

    stopPlacing() {
        this.selectedBuildingType = null;
        this.selectedSize = null;
        this.isPlacing = false;
        this.buildingSystem.clearPlaceholder();
    }

    onMouseMove(event) {
        if (!this.isPlacing) return;

        // Convert mouse position to world coordinates
        const worldPos = this.getWorldPosition(event);
        if (!worldPos) return;

        // Update building placeholder position
        this.buildingSystem.setPlaceholder(this.selectedBuildingType, worldPos);
    }

    onMouseDown(event) {
        if (!this.isPlacing) return;

        // Convert mouse position to world coordinates
        const worldPos = this.getWorldPosition(event);
        if (!worldPos) return;

        // Try to place the building
        if (this.buildingSystem.canPlaceBuilding(this.selectedBuildingType, this.selectedSize, worldPos)) {
            const building = this.buildingSystem.placeBuilding(this.selectedBuildingType, this.selectedSize, worldPos);
            
            if (building) {
                // Find nearby idle Stoonies and assign them to construction
                const nearbyStoonies = this.stoonieManager.findStooniesInRange(worldPos.x, worldPos.z, 10);
                for (const stoonie of nearbyStoonies) {
                    if (building.assignedWorkers.size >= building.maxWorkers) break;
                    
                    // Only assign idle Stoonies
                    if (!stoonie.currentTask) {
                        stoonie.currentTask = new ConstructionTask(building, stoonie);
                        this.buildingSystem.assignWorkerToBuilding(building.id, stoonie.id);
                    }
                }
            }
        }
    }

    onMouseUp(event) {
        // Optional: Add any mouse up handling
    }

    getWorldPosition(event) {
        // This method should be implemented to convert screen coordinates to world coordinates
        // using your game's camera and coordinate system
        // For now, returning a placeholder implementation
        return {
            x: event.clientX / 100,
            y: 0,
            z: event.clientY / 100
        };
    }

    destroy() {
        // Clean up event listeners
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}
