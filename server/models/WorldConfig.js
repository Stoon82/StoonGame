import { GROUND_TYPE_IDS } from '../../shared/world/groundTypes.js';

export class WorldConfig {
    constructor({
        name = 'New World',
        seed = Math.random().toString(36).substring(7),
        maxPlayers = 10,
        isPublic = true,
        mapSystem = 'default',
        mapParameters = {
            initialSize: 1,
            maxSize: 100,
            groundTypes: GROUND_TYPE_IDS,
            allowDiagonalConnections: true
        }
    } = {}) {
        this.name = name;
        this.seed = seed;
        this.maxPlayers = maxPlayers;
        this.isPublic = isPublic;
        this.mapSystem = mapSystem;
        this.mapParameters = mapParameters;
        this.createdAt = new Date().toISOString();
        this.lastActive = new Date().toISOString();
    }

    toJSON() {
        return {
            name: this.name,
            seed: this.seed,
            maxPlayers: this.maxPlayers,
            isPublic: this.isPublic,
            mapSystem: this.mapSystem,
            mapParameters: this.mapParameters,
            createdAt: this.createdAt,
            lastActive: this.lastActive
        };
    }

    static fromJSON(json) {
        const config = new WorldConfig();
        Object.assign(config, json);
        return config;
    }
}

export default WorldConfig;
