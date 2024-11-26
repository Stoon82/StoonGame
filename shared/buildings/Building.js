function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const BUILDING_TYPES = {
    SMALL_TENT: {
        name: 'Small Tent',
        size: 0.3,
        resources: {
            wood: 10,
            stone: 5
        },
        buildTime: 30 // seconds
    },
    MEDIUM_TENT: {
        name: 'Medium Tent',
        size: 0.4,
        resources: {
            wood: 20,
            stone: 10
        },
        buildTime: 45
    },
    LARGE_TENT: {
        name: 'Large Tent',
        size: 0.5,
        resources: {
            wood: 30,
            stone: 15
        },
        buildTime: 60
    },
    SMALL_HUT: {
        name: 'Small Hut',
        size: 0.4,
        resources: {
            wood: 20,
            stone: 20
        },
        buildTime: 60
    },
    MEDIUM_HUT: {
        name: 'Medium Hut',
        size: 0.5,
        resources: {
            wood: 30,
            stone: 30
        },
        buildTime: 90
    },
    LARGE_HUT: {
        name: 'Large Hut',
        size: 0.6,
        resources: {
            wood: 40,
            stone: 40
        },
        buildTime: 120
    }
};

export class Building {
    constructor(type, position) {
        this.id = generateUUID();
        this.type = type;
        this.config = BUILDING_TYPES[type];
        this.position = position; // { q, r, corner }
        this.progress = 0; // 0 to 1
        this.resources = {
            wood: 0,
            stone: 0
        };
        this.builders = new Set(); // Stoonies currently building
        this.state = 'waiting_resources'; // waiting_resources, under_construction, completed
    }

    update(deltaTime) {
        if (this.state === 'under_construction' && this.hasRequiredResources()) {
            this.progress = Math.min(1, this.progress + (deltaTime / this.config.buildTime));
            if (this.progress >= 1) {
                this.state = 'completed';
                this.builders.clear();
            }
        }
    }

    addResource(type, amount) {
        const needed = this.config.resources[type] - this.resources[type];
        const added = Math.min(amount, needed);
        this.resources[type] += added;

        if (this.hasRequiredResources() && this.state === 'waiting_resources') {
            this.state = 'under_construction';
        }

        return added;
    }

    hasRequiredResources() {
        return Object.entries(this.config.resources).every(([type, amount]) => 
            this.resources[type] >= amount
        );
    }

    addBuilder(stoonieId) {
        this.builders.add(stoonieId);
    }

    removeBuilder(stoonieId) {
        this.builders.delete(stoonieId);
    }

    getStatus() {
        return {
            id: this.id,
            type: this.type,
            name: this.config.name,
            position: this.position,
            progress: this.progress,
            resources: this.resources,
            requiredResources: this.config.resources,
            state: this.state,
            builders: Array.from(this.builders)
        };
    }
}
