export class ConstructionTask {
    constructor(building, stoonie) {
        this.building = building;
        this.stoonie = stoonie;
        this.state = 'moving_to_site';
        this.resourceGatheringProgress = {};
        this.lastPosition = { x: stoonie.worldX, z: stoonie.worldZ };
        this.targetPosition = { 
            x: building.position.x + (Math.random() - 0.5), // Add small random offset
            z: building.position.z + (Math.random() - 0.5)
        };
        
        // Initialize resource gathering progress
        for (const [resource, amount] of Object.entries(building.requiredResources)) {
            if (amount > 0) {
                this.resourceGatheringProgress[resource] = 0;
            }
        }
    }

    update(deltaTime) {
        switch (this.state) {
            case 'moving_to_site':
                // Move towards the building site
                const dx = this.targetPosition.x - this.stoonie.worldX;
                const dz = this.targetPosition.z - this.stoonie.worldZ;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance > 0.1) {
                    // Move towards target
                    const speed = this.stoonie.speed * deltaTime / 1000;
                    const moveX = (dx / distance) * speed;
                    const moveZ = (dz / distance) * speed;
                    
                    this.stoonie.worldX += moveX;
                    this.stoonie.worldZ += moveZ;
                } else {
                    this.state = 'gathering_resources';
                }
                break;

            case 'gathering_resources':
                // Simulate resource gathering
                for (const [resource, amount] of Object.entries(this.building.requiredResources)) {
                    if (amount > 0) {
                        // Gather resources at a rate of 1 per second
                        this.resourceGatheringProgress[resource] += deltaTime / 1000;
                        
                        if (this.resourceGatheringProgress[resource] >= amount) {
                            delete this.building.requiredResources[resource];
                            delete this.resourceGatheringProgress[resource];

                            // Grant experience to the connected soul if any
                            if (this.stoonie.connectedSoul) {
                                this.stoonie.connectedSoul.gainExperience(10, 'construction');
                            }
                        }
                    }
                }

                // Check if all resources are gathered
                if (Object.keys(this.building.requiredResources).length === 0) {
                    this.state = 'constructing';
                }
                break;

            case 'constructing':
                // Construction progress is handled by BuildingSystem
                // Just check if the building is complete
                if (this.building.state === 'complete') {
                    this.state = 'complete';
                    // Grant final experience bonus to connected soul
                    if (this.stoonie.connectedSoul) {
                        this.stoonie.connectedSoul.gainExperience(50, 'construction');
                    }
                }
                break;
        }

        // Update last position
        this.lastPosition.x = this.stoonie.worldX;
        this.lastPosition.z = this.stoonie.worldZ;
    }

    isComplete() {
        return this.state === 'complete';
    }

    getStatus() {
        return {
            type: 'construction',
            buildingId: this.building.id,
            state: this.state,
            resourceProgress: this.resourceGatheringProgress,
            position: {
                x: this.stoonie.worldX,
                z: this.stoonie.worldZ
            }
        };
    }
}
