import Stoonie from './Stoonie.js';

export class StoonieManager {
    constructor(mapSystem) {
        this.grid = mapSystem;  // Keep grid reference for backward compatibility
        this.mapSystem = mapSystem;  // Store mapSystem reference
        this.stoonies = new Map(); // All living Stoonies
        this.selectedStoonieId = null;
        this.lastUpdateTime = performance.now() / 1000;
    }

    createStoonie(options = {}) {
        let worldX, worldZ;

        if (options.q !== undefined && options.r !== undefined) {
            // Create from grid position
            const worldPos = this.mapSystem.getWorldPosition(options.q, options.r);
            if (!worldPos) {
                console.error(`[StoonieManager] Cannot create Stoonie: No valid world position at (${options.q}, ${options.r})`);
                return null;
            }
            worldX = worldPos.x;
            worldZ = worldPos.z;
        } else if (options.worldX !== undefined && options.worldZ !== undefined) {
            // Create from world position
            worldX = options.worldX;
            worldZ = options.worldZ;
        } else {
            console.error('[StoonieManager] Cannot create Stoonie: No valid position provided');
            return null;
        }

        // Create properties object for Stoonie
        const properties = {
            gender: options.gender || (Math.random() < 0.5 ? 'male' : 'female'),
            worldX: worldX,
            worldZ: worldZ,
            scene: this.mapSystem.scene,
            speed: 1.0 + (Math.random() * 0.5), // Random speed between 1.0 and 1.5
            moveDelay: 0.5 + Math.random(),
            wanderRadius: 0.6
        };

        // Create new Stoonie with properties
        const stoonie = new Stoonie(properties);

        // Add to manager
        this.stoonies.set(stoonie.id, stoonie);
        console.log(`[StoonieManager] Created Stoonie ${stoonie.id} at world pos: (${worldX.toFixed(2)}, ${worldZ.toFixed(2)})`);

        // Emit event for renderer to create visual representation
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('stoonieCreated', { detail: stoonie }));
        }

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

    findStooniesInRange(x, z, range) {
        const nearbyStoonies = [];
        for (const stoonie of this.stoonies.values()) {
            const dx = stoonie.worldX - x;
            const dz = stoonie.worldZ - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= range) {
                nearbyStoonies.push(stoonie);
            }
        }
        return nearbyStoonies;
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
