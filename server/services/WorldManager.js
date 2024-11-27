const fs = require('fs').promises;
const path = require('path');
const WorldConfig = require('../models/WorldConfig');

class WorldManager {
    constructor() {
        this.activeWorlds = new Map();
        this.worldsDir = path.join(__dirname, '..', 'maps', 'worlds');
        this.playersDir = path.join(__dirname, '..', 'maps', 'players');
        this.ensureDirectories();
    }

    async ensureDirectories() {
        await fs.mkdir(this.worldsDir, { recursive: true });
        await fs.mkdir(this.playersDir, { recursive: true });
    }

    async createWorld(config) {
        const worldConfig = new WorldConfig(config);
        const worldId = `world_${worldConfig.seed}`;
        
        // Create world data structure
        const worldData = {
            config: worldConfig.toJSON(),
            mapData: {
                centerPoints: {},
                cornerPoints: {},
                buildings: {},
                resources: {}
            },
            players: new Set(),
            lastUpdate: Date.now(),
            version: '1.0.0'
        };

        // Save world data
        await this.saveWorld(worldId, worldData);
        this.activeWorlds.set(worldId, worldData);
        
        return worldId;
    }

    async loadWorld(worldId) {
        console.log(`[WorldManager] Loading world ${worldId}...`);

        if (this.activeWorlds.has(worldId)) {
            console.log(`[WorldManager] Found world ${worldId} in active worlds cache`);
            return this.activeWorlds.get(worldId);
        }

        try {
            const filePath = path.join(this.worldsDir, `${worldId}.json`);
            console.log(`[WorldManager] Reading from file: ${filePath}`);

            const data = await fs.readFile(filePath, 'utf8');
            const worldData = JSON.parse(data);

            // Log the data being loaded
            console.log(`[WorldManager] World ${worldId} data loaded:`, {
                centerPoints: Object.keys(worldData.mapData?.centerPoints || {}).length,
                cornerPoints: Object.keys(worldData.mapData?.cornerPoints || {}).length,
                players: worldData.players?.length || 0,
                lastUpdate: worldData.lastUpdate
            });

            // Convert players array back to Set
            worldData.players = new Set(worldData.players || []);
            
            // Add to active worlds
            this.activeWorlds.set(worldId, worldData);
            
            console.log(`[WorldManager] Successfully loaded world ${worldId}`);
            return worldData;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`[WorldManager] No existing save file for world ${worldId}, will create new`);
                return null;
            }
            console.error(`[WorldManager] Failed to load world ${worldId}:`, error);
            return null;
        }
    }

    async saveWorld(worldId, worldData) {
        try {
            console.log(`[WorldManager] Starting to save world ${worldId}...`);

            // Ensure directories exist
            await this.ensureDirectories();

            // Validate world data
            if (!worldData) {
                throw new Error('No world data provided');
            }

            if (!worldData.mapData) {
                console.warn(`[WorldManager] No mapData in world ${worldId}, initializing empty structure`);
                worldData.mapData = {
                    centerPoints: {},
                    cornerPoints: {},
                    buildings: {},
                    resources: {}
                };
            }

            // Create a copy of the data for saving
            const saveData = {
                ...worldData,
                players: Array.from(worldData.players || [])
            };

            // Log the data being saved
            console.log(`[WorldManager] Saving world ${worldId} data:`, {
                centerPoints: Object.keys(saveData.mapData?.centerPoints || {}).length,
                cornerPoints: Object.keys(saveData.mapData?.cornerPoints || {}).length,
                players: saveData.players.length,
                lastUpdate: saveData.lastUpdate
            });

            const filePath = path.join(this.worldsDir, `${worldId}.json`);
            await fs.writeFile(filePath, JSON.stringify(saveData, null, 2));
            
            // Update active worlds cache
            this.activeWorlds.set(worldId, worldData);
            
            console.log(`[WorldManager] Successfully saved world ${worldId}`);
            return true;
        } catch (error) {
            console.error(`[WorldManager] Failed to save world ${worldId}:`, error);
            return false;
        }
    }

    async listWorlds({ isPublic = true, active = true } = {}) {
        try {
            const files = await fs.readdir(this.worldsDir);
            const worlds = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const worldId = file.replace('.json', '');
                    const worldData = await this.loadWorld(worldId);
                    
                    if (worldData &&
                        (!isPublic || worldData.config.isPublic) &&
                        (!active || worldData.players.size > 0)) {
                        worlds.push({
                            id: worldId,
                            name: worldData.config.name,
                            players: worldData.players.size,
                            maxPlayers: worldData.config.maxPlayers,
                            lastActive: worldData.config.lastActive
                        });
                    }
                }
            }

            return worlds;
        } catch (error) {
            console.error('Failed to list worlds:', error);
            return [];
        }
    }

    async updateWorld(worldId, update) {
        const worldData = this.activeWorlds.get(worldId);
        if (!worldData) return false;

        if (update.type === 'centerPoint') {
            worldData.mapData.centerPoints[update.key] = update.data;
        } else if (update.type === 'cornerPoint') {
            worldData.mapData.cornerPoints[update.key] = update.data;
        } else if (update.type === 'building') {
            worldData.mapData.buildings[update.key] = update.data;
        } else if (update.type === 'resource') {
            worldData.mapData.resources[update.key] = update.data;
        }

        await this.saveWorld(worldId, worldData);
        return true;
    }

    addPlayer(worldId, playerId) {
        const worldData = this.activeWorlds.get(worldId);
        if (!worldData) return false;

        if (worldData.players.size >= worldData.config.maxPlayers) {
            return false;
        }

        worldData.players.add(playerId);
        return true;
    }

    removePlayer(worldId, playerId) {
        const worldData = this.activeWorlds.get(worldId);
        if (!worldData) return false;

        worldData.players.delete(playerId);
        
        // Save world if no players are left
        if (worldData.players.size === 0) {
            this.saveWorld(worldId, worldData);
        }
        
        return true;
    }

    async getActiveWorldCount() {
        return this.activeWorlds.size;
    }

    async getTotalPlayerCount() {
        let totalPlayers = 0;
        for (const [_, worldData] of this.activeWorlds) {
            totalPlayers += worldData.players.size;
        }
        return totalPlayers;
    }

    async getPlayerCount(worldId) {
        const worldData = await this.loadWorld(worldId);
        return worldData ? worldData.players.size : 0;
    }

    async getMaxPlayers(worldId) {
        const worldData = await this.loadWorld(worldId);
        return worldData ? worldData.config.maxPlayers || 10 : 0;
    }

    async getLastUpdateTime(worldId) {
        const worldData = await this.loadWorld(worldId);
        return worldData ? worldData.lastUpdate || Date.now() : null;
    }
}

module.exports = new WorldManager();
