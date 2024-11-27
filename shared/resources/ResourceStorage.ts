import { ResourceType, ResourceStack, ResourceProperties, RESOURCE_PROPERTIES } from './ResourceTypes';

export class ResourceStorage {
    private resources: Map<ResourceType, ResourceStack>;
    private capacity: number;

    constructor(capacity: number = Infinity) {
        this.resources = new Map();
        this.capacity = capacity;
    }

    // Add resources to storage
    public addResource(type: ResourceType, amount: number): boolean {
        const currentStack = this.resources.get(type);
        const properties = RESOURCE_PROPERTIES[type];

        if (!currentStack) {
            this.resources.set(type, {
                type,
                amount,
                maxAmount: Math.floor(this.capacity / properties.weight)
            });
            return true;
        }

        if (this.hasSpaceFor(type, amount)) {
            currentStack.amount += amount;
            return true;
        }

        return false;
    }

    // Remove resources from storage
    public removeResource(type: ResourceType, amount: number): boolean {
        const currentStack = this.resources.get(type);
        
        if (!currentStack || currentStack.amount < amount) {
            return false;
        }

        currentStack.amount -= amount;
        
        if (currentStack.amount === 0) {
            this.resources.delete(type);
        }
        
        return true;
    }

    // Check if there's enough space for resources
    public hasSpaceFor(type: ResourceType, amount: number): boolean {
        const currentStack = this.resources.get(type);
        const properties = RESOURCE_PROPERTIES[type];
        const maxAmount = Math.floor(this.capacity / properties.weight);

        if (!currentStack) {
            return amount <= maxAmount;
        }

        return currentStack.amount + amount <= maxAmount;
    }

    // Get current amount of a resource
    public getAmount(type: ResourceType): number {
        return this.resources.get(type)?.amount || 0;
    }

    // Get all stored resources
    public getAllResources(): ResourceStack[] {
        return Array.from(this.resources.values());
    }

    // Get total weight of stored resources
    public getTotalWeight(): number {
        let totalWeight = 0;
        for (const [type, stack] of this.resources) {
            totalWeight += RESOURCE_PROPERTIES[type].weight * stack.amount;
        }
        return totalWeight;
    }

    // Get remaining capacity
    public getRemainingCapacity(): number {
        return this.capacity - this.getTotalWeight();
    }

    // Check if storage has enough of specified resources
    public hasResources(requirements: ResourceStack[]): boolean {
        return requirements.every(req => 
            this.getAmount(req.type) >= req.amount
        );
    }
}
