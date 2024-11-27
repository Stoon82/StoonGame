import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import PlayerData from '../models/PlayerData.js';
import { GROUND_TYPES } from '../../shared/world/groundTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PlayerManager {
    constructor() {
        this.activePlayers = new Map();
        this.playersDir = join(__dirname, '..', 'maps', 'players');
        this.ensureDirectory();
    }

    async ensureDirectory() {
        await fs.mkdir(this.playersDir, { recursive: true });
    }

    async createPlayer(username) {
        const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
        const playerData = new PlayerData({
            id: playerId,
            username
        });

        await this.savePlayer(playerId, playerData);
        this.activePlayers.set(playerId, playerData);
        
        return playerId;
    }

    async loadPlayer(playerId) {
        const filePath = join(this.playersDir, `${playerId}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`[PlayerManager] Error loading player ${playerId}:`, error);
            return null;
        }
    }

    async getStoonSouls(playerId) {
        const playerData = await this.loadPlayer(playerId);
        return playerData ? playerData.stoonSouls || [] : [];
    }

    async savePlayer(playerId, playerData) {
        try {
            const filePath = join(this.playersDir, `${playerId}.json`);
            await fs.writeFile(filePath, JSON.stringify(playerData.toJSON(), null, 2));
            return true;
        } catch (error) {
            console.error(`Failed to save player ${playerId}:`, error);
            return false;
        }
    }

    async updatePlayer(playerId, update) {
        const playerData = this.activePlayers.get(playerId);
        if (!playerData) return false;

        if (update.type === 'position') {
            playerData.updatePosition(update.data);
        } else if (update.type === 'addSoul') {
            playerData.addStoonSoul(update.data);
        } else if (update.type === 'removeSoul') {
            playerData.removeStoonSoul(update.data);
        } else if (update.type === 'world') {
            playerData.currentWorld = update.data;
        }

        await this.savePlayer(playerId, playerData);
        return true;
    }

    async listPlayers({ online = true, worldId = null } = {}) {
        try {
            if (online) {
                return Array.from(this.activePlayers.values())
                    .filter(player => !worldId || player.currentWorld === worldId)
                    .map(player => ({
                        id: player.id,
                        username: player.username,
                        currentWorld: player.currentWorld,
                        lastActive: player.lastActive
                    }));
            }

            const files = await fs.readdir(this.playersDir);
            const players = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const playerId = file.replace('.json', '');
                    const playerData = await this.loadPlayer(playerId);
                    
                    if (playerData && (!worldId || playerData.currentWorld === worldId)) {
                        players.push({
                            id: playerData.id,
                            username: playerData.username,
                            currentWorld: playerData.currentWorld,
                            lastActive: playerData.lastActive
                        });
                    }
                }
            }

            return players;
        } catch (error) {
            console.error('Failed to list players:', error);
            return [];
        }
    }

    removePlayer(playerId) {
        return this.activePlayers.delete(playerId);
    }
}

export default new PlayerManager();
