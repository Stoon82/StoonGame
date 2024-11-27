export enum ResourceType {
    WOOD = 'WOOD',
    STONE = 'STONE',
    FOOD = 'FOOD',
    GOLD = 'GOLD',
    IRON = 'IRON',
    TOOLS = 'TOOLS'
}

export interface ResourceStack {
    type: ResourceType;
    amount: number;
    maxAmount?: number;  // For storage capacity limits
}

export interface ResourceCost {
    type: ResourceType;
    amount: number;
}

// Resource properties for game mechanics and visualization
export interface ResourceProperties {
    type: ResourceType;
    name: string;
    description: string;
    weight: number;  // For transportation mechanics
    baseValue: number;  // For trading/economy
    stackSize: number;  // How many can be stored in one slot
    sprite: string;  // Path to the resource sprite
}

// Define properties for each resource type
export const RESOURCE_PROPERTIES: Record<ResourceType, ResourceProperties> = {
    [ResourceType.WOOD]: {
        type: ResourceType.WOOD,
        name: 'Wood',
        description: 'Basic building material',
        weight: 1,
        baseValue: 1,
        stackSize: 50,
        sprite: 'assets/resources/wood.png'
    },
    [ResourceType.STONE]: {
        type: ResourceType.STONE,
        name: 'Stone',
        description: 'Heavy building material',
        weight: 2,
        baseValue: 2,
        stackSize: 30,
        sprite: 'assets/resources/stone.png'
    },
    [ResourceType.FOOD]: {
        type: ResourceType.FOOD,
        name: 'Food',
        description: 'Required for population growth',
        weight: 0.5,
        baseValue: 3,
        stackSize: 100,
        sprite: 'assets/resources/food.png'
    },
    [ResourceType.GOLD]: {
        type: ResourceType.GOLD,
        name: 'Gold',
        description: 'Valuable trading resource',
        weight: 0.3,
        baseValue: 10,
        stackSize: 200,
        sprite: 'assets/resources/gold.png'
    },
    [ResourceType.IRON]: {
        type: ResourceType.IRON,
        name: 'Iron',
        description: 'Advanced building material',
        weight: 1.5,
        baseValue: 5,
        stackSize: 40,
        sprite: 'assets/resources/iron.png'
    },
    [ResourceType.TOOLS]: {
        type: ResourceType.TOOLS,
        name: 'Tools',
        description: 'Required for advanced production',
        weight: 1,
        baseValue: 8,
        stackSize: 25,
        sprite: 'assets/resources/tools.png'
    }
}
