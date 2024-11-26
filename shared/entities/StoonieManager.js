import { Stoonie } from './Stoonie.js';

export class StoonieManager {
    constructor() {
        this.stoonies = new Map(); // All living Stoonies
        this.selectedStoonieId = null;
    }

    createStoonie(gender = null) {
        const stoonie = new Stoonie(gender);
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

    update(deltaTime) {
        // Create a new Map to store surviving Stoonies
        const survivors = new Map();
        
        // Update each Stoonie
        for (const [id, stoonie] of this.stoonies) {
            if (stoonie.update(deltaTime)) {
                survivors.set(id, stoonie);
            }
        }
        
        // Replace the stoonies map with survivors
        this.stoonies = survivors;
    }

    getStatus() {
        return {
            totalStoonies: this.stoonies.size,
            selectedStoonieId: this.selectedStoonieId,
            stoonies: Array.from(this.stoonies.values()).map(s => s.getStatus())
        };
    }
}
