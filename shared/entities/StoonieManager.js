import Stoonie from './Stoonie.js';

export class StoonieManager {
    constructor(mapSystem) {
        this.grid = mapSystem;  // Keep grid reference for backward compatibility
        this.mapSystem = mapSystem;  // Store mapSystem reference
        this.stoonies = new Map(); // All living Stoonies
        this.selectedStoonieId = null;
        this.lastUpdateTime = performance.now() / 1000;
    }

    createStoonie(q, r, gender = null) {
        // Validate position
        if (q === undefined || r === undefined) {
            console.error('[StoonieManager] Cannot create Stoonie: Invalid grid position');
            return null;
        }

        // Get world position before creating Stoonie
        const worldPos = this.mapSystem.getWorldPosition(q, r);
        if (!worldPos) {
            console.error(`[StoonieManager] Cannot create Stoonie: No valid world position at (${q}, ${r})`);
            return null;
        }

        const stoonie = new Stoonie(gender, this.mapSystem.scene);
        
        // Set grid coordinates
        stoonie.q = q;
        stoonie.r = r;
        stoonie.targetQ = q;
        stoonie.targetR = r;
        stoonie.startQ = q;
        stoonie.startR = r;

        // Set world coordinates
        stoonie.worldX = worldPos.x;
        stoonie.worldZ = worldPos.z;
        stoonie.targetWorldX = worldPos.x;
        stoonie.targetWorldZ = worldPos.z;
        stoonie.startWorldX = worldPos.x;
        stoonie.startWorldZ = worldPos.z;

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
        // Update all Stoonies and collect dead ones
        const deadStoonies = [];
        
        for (const stoonie of this.stoonies.values()) {
            const isAlive = stoonie.update(deltaTime, this.mapSystem);
            if (!isAlive) {
                deadStoonies.push(stoonie.id);
            }
        }

        // Clean up dead Stoonies
        deadStoonies.forEach(id => {
            this.stoonies.delete(id);
            // Emit an event for the renderer to clean up
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('stoonieDied', { detail: { id } }));
            }
        });
    }

    getStatus() {
        return {
            totalStoonies: this.stoonies.size,
            selectedStoonieId: this.selectedStoonieId,
            stoonies: Array.from(this.stoonies.values()).map(s => s.getStatus())
        };
    }
}

export default StoonieManager;
