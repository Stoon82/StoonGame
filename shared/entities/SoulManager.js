import { StoonieSoul } from './StoonieSoul.js';

export class SoulManager {
    constructor(maxSouls = 3) {
        this.maxSouls = maxSouls;
        this.souls = new Map(); // All souls owned by player
        this.availableSouls = new Set(); // Souls not currently connected to Stoonies
        
        // Initialize starting souls
        this.initializeStartingSouls();
    }

    initializeStartingSouls() {
        // Start with one soul
        const startingSoul = this.createNewSoul();
        this.souls.set(startingSoul.id, startingSoul);
        this.availableSouls.add(startingSoul.id);
    }

    createNewSoul() {
        if (this.souls.size >= this.maxSouls) {
            return null;
        }
        return new StoonieSoul();
    }

    // Soul management
    getSoul(soulId) {
        return this.souls.get(soulId);
    }

    getAvailableSouls() {
        return Array.from(this.availableSouls).map(id => this.souls.get(id));
    }

    connectSoulToStoonie(soulId, stoonie) {
        const soul = this.souls.get(soulId);
        if (!soul || !this.availableSouls.has(soulId)) return false;

        if (stoonie.connectSoul(soul)) {
            this.availableSouls.delete(soulId);
            return true;
        }
        return false;
    }

    disconnectSoulFromStoonie(soulId, reason = null) {
        const soul = this.souls.get(soulId);
        if (!soul || this.availableSouls.has(soulId)) return false;

        if (soul.isConnected) {
            soul.disconnectFromStoonie(reason);
            this.availableSouls.add(soulId);
            return true;
        }
        return false;
    }

    // Soul progression
    unlockNewSoul() {
        if (this.souls.size >= this.maxSouls) return null;

        const newSoul = this.createNewSoul();
        if (newSoul) {
            this.souls.set(newSoul.id, newSoul);
            this.availableSouls.add(newSoul.id);
            return newSoul;
        }
        return null;
    }

    // Status and information
    getStatus() {
        return {
            totalSouls: this.souls.size,
            maxSouls: this.maxSouls,
            availableSouls: this.availableSouls.size,
            souls: Array.from(this.souls.values()).map(soul => soul.getStatus())
        };
    }
}
