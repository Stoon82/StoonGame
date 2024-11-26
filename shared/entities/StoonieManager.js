import { Stoonie } from './Stoonie.js';

export class StoonieManager {
    constructor(grid) {
        this.grid = grid;
        this.stoonies = new Map(); // All living Stoonies
        this.selectedStoonieId = null;
        this.lastUpdateTime = performance.now() / 1000;
    }

    createStoonie(q, r, gender = null) {
        const stoonie = new Stoonie(gender);
        stoonie.q = q;
        stoonie.r = r;
        stoonie.targetQ = q;
        stoonie.targetR = r;
        stoonie.startQ = q;
        stoonie.startR = r;
        this.stoonies.set(stoonie.id, stoonie);
        return stoonie;
    }

    addStoonie(stoonie) {
        this.stoonies.set(stoonie.id, stoonie);
    }

    removeStoonie(id) {
        if (this.selectedStoonieId === id) {
            this.selectedStoonieId = null;
        }
        return this.stoonies.delete(id);
    }

    getStoonie(id) {
        return this.stoonies.get(id);
    }

    getStoonies() {
        return Array.from(this.stoonies.values());
    }

    getAllStoonies() {
        return Array.from(this.stoonies.values());
    }

    selectStoonie(id) {
        if (this.stoonies.has(id)) {
            this.selectedStoonieId = id;
            return true;
        }
        return false;
    }

    getSelectedStoonie() {
        return this.stoonies.get(this.selectedStoonieId);
    }

    update() {
        const currentTime = performance.now() / 1000;
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Update all Stoonies
        for (const stoonie of this.stoonies.values()) {
            stoonie.update(deltaTime, this.grid);
        }
    }

    getStatus() {
        return {
            totalStoonies: this.stoonies.size,
            selectedStoonieId: this.selectedStoonieId,
            stoonies: Array.from(this.stoonies.values()).map(s => s.getStatus())
        };
    }
}
