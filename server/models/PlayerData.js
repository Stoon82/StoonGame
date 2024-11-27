export class PlayerData {
    constructor({
        id,
        username,
        stoonSouls = [],
        lastPosition = { x: 0, y: 0 },
        lastActive = new Date().toISOString(),
        currentWorld = null
    } = {}) {
        this.id = id;
        this.username = username;
        this.stoonSouls = stoonSouls;
        this.lastPosition = lastPosition;
        this.lastActive = lastActive;
        this.currentWorld = currentWorld;
    }

    addStoonSoul(soul) {
        this.stoonSouls.push({
            ...soul,
            acquiredAt: new Date().toISOString()
        });
    }

    removeStoonSoul(soulId) {
        this.stoonSouls = this.stoonSouls.filter(soul => soul.id !== soulId);
    }

    updatePosition(position) {
        this.lastPosition = position;
        this.lastActive = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            stoonSouls: this.stoonSouls,
            lastPosition: this.lastPosition,
            lastActive: this.lastActive,
            currentWorld: this.currentWorld
        };
    }

    static fromJSON(json) {
        return new PlayerData(json);
    }
}

export default PlayerData;
