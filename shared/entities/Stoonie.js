// UUID generation for browser and Node.js environments
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

import * as THREE from 'three';

export class Stoonie {
    constructor(gender = Math.random() < 0.5 ? 'male' : 'female', scene = null) {
        // Basic attributes
        this.id = generateUUID();
        this.gender = gender;
        this.age = 0; // Age in days
        this.maxAge = 70 + Math.random() * 30; // Random max age between 70-100 days
        this.pregnant = false;
        this.pregnancyProgress = 0; // 0-1
        this.pregnancyDuration = 9; // 9 days for pregnancy
        this.scene = scene;  // Store scene reference

        // Position
        this.q = 0;
        this.r = 0;
        this.worldX = 0;
        this.worldZ = 0;
        this.targetWorldX = 0;
        this.targetWorldZ = 0;
        this.moveProgress = 1; // 1 means movement complete
        this.moveDuration = 1.5; // seconds to complete a move
        this.moveTimer = 0;
        this.moveDelay = 0.5 + Math.random(); // Random delay between moves (0.5-1.5 seconds)
        this.delayTimer = 0;
        this.baseSpeed = 1.0; // Base movement speed
        this.speed = this.baseSpeed; // Current speed (modified by terrain)
        this.wanderRadius = 0.6; // How far from triangle center they can wander
        
        // Ground type movement modifiers
        this.groundSpeedModifiers = {
            grass: 1.5,    // Fast on grass
            sand: 0.6,     // Slow on sand
            water: 0.0,    // Can't move on water
            rock: 1.0      // Normal speed on rock
        };

        // Current ground info
        this.currentGroundType = null;

        // Needs system (0-100)
        this.needs = {
            hunger: 100,    // Decreases over time, replenished by eating
            thirst: 100,    // Decreases over time, replenished by drinking
            energy: 100,    // Decreases with activity, replenished by resting
            sleep: 0,     // Increases while awake, decreased by sleeping
            health: 100     // Affected by other needs, medical care
        };

        // Need decay rates per second
        this.decayRates = {
            hunger: 0.5,
            thirst: 0.8,
            energy: 0.3,
            sleep: 0.4
        };

        // Current activity
        this.currentActivity = 'idle'; // idle, sleeping, eating, drinking, working, etc.

        // Autonomous movement
        this.lastMoveTime = Date.now();
        this.moveInterval = 1000; // Move every 1 second
        this.state = 'moving'; // Start in moving state

        // Soul management
        this.hasConnectedSoul = false;
        this.connectedSoul = null;

        // Debug visualization
        this.debugLines = [];
        this.debugLinesTimeout = null;
    }

    // Show ground check visualization
    showGroundCheck(x, z, groundType, scene) {
        if (!window.DEBUG_MODE || !scene) return;

        // Clean up old lines first
        while (this.debugLines && this.debugLines.length > 5) {
            const oldLine = this.debugLines.shift();
            if (oldLine && oldLine.parent) {
                oldLine.parent.remove(oldLine);
                oldLine.geometry.dispose();
                oldLine.material.dispose();
            }
        }

        // Create a vertical line geometry
        const geometry = new THREE.BufferGeometry();
        const color = this.getGroundTypeColor(groundType);
        const material = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 3
        });

        // Create points for vertical line
        const points = [
            new THREE.Vector3(x, 0, z),
            new THREE.Vector3(x, 10, z)  // Even taller for better visibility
        ];
        geometry.setFromPoints(points);

        // Create and add the line
        const line = new THREE.Line(geometry, material);
        scene.add(line);

        // Initialize debugLines array if needed
        if (!this.debugLines) {
            this.debugLines = [];
        }

        // Add new line to tracking array
        this.debugLines.push(line);

        // Log the check for debugging
        if (window.DEBUG_MODE) {
            console.log(`[Stoonie ${this.id}] Ground check at (${x.toFixed(2)}, ${z.toFixed(2)}): ${groundType} (color: 0x${color.toString(16)})`);
        }
    }

    getGroundTypeColor(groundType) {
        if (!groundType) return 0xff0000; // Red for null/undefined
        
        const colors = {
            grass: 0x00ff00,  // Bright green
            sand: 0xffff00,   // Yellow
            water: 0x0000ff,  // Blue
            rock: 0x808080    // Gray
        };
        
        return colors[groundType] || 0xff0000; // Red for unknown types
    }

    update(deltaTime, grid) {
        // Check current ground type and update UI immediately
        const newGroundType = grid.getGroundTypeAtPosition(this.worldX, this.worldZ);
        if (newGroundType !== this.currentGroundType) {
            this.currentGroundType = newGroundType;
            if (window.DEBUG_MODE) {
                console.log(`[Stoonie ${this.id}] Ground type changed to: ${this.currentGroundType}`);
            }
        }
        
        if (window.DEBUG_MODE && grid.scene) {
            this.showGroundCheck(this.worldX, this.worldZ, this.currentGroundType, grid.scene);
        }
        
        // Don't die on invalid ground, just try to move somewhere else
        if (!this.currentGroundType || this.currentGroundType === 'water') {
            console.log(`[Stoonie ${this.id}] On invalid ground (${this.currentGroundType}), trying to move`);
            this.moveProgress = 1;  // Force new move next update
            this.delayTimer = this.moveDelay;
            return true;  // Keep stoonie alive
        }

        // Age the Stoonie
        this.age += deltaTime / (24 * 60 * 60); // Convert seconds to days

        // Check for death by old age
        if (this.age >= this.maxAge) {
            return this.die('old_age');
        }

        // Update needs
        for (const [need, decayRate] of Object.entries(this.decayRates)) {
            this.needs[need] = Math.max(0, this.needs[need] - decayRate * deltaTime);
        }

        // Health decreases if other needs are critically low
        let healthImpact = 0;
        for (const [need, value] of Object.entries(this.needs)) {
            if (need !== 'health' && value < 20) {
                healthImpact += (20 - value) * 0.1;
            }
        }
        this.needs.health = Math.max(0, this.needs.health - healthImpact * deltaTime);

        // Check for death by poor health
        if (this.needs.health <= 0) {
            return this.die('poor_health');
        }

        // Update state based on needs
        this.updateState();

        // Always update movement unless sleeping
        if (this.state !== 'sleeping') {
            if (this.moveProgress >= 1) {
                this.delayTimer += deltaTime;
                if (this.delayTimer >= this.moveDelay) {
                    this.delayTimer = 0;
                    this.startNewMove(grid);
                }
            } else {
                // Update movement progress
                this.moveTimer += deltaTime;
                this.moveProgress = Math.min(1, this.moveTimer / this.moveDuration);

                // Smooth interpolation
                const progress = this.easeInOutQuad(this.moveProgress);
                const newX = this.startWorldX + (this.targetWorldX - this.startWorldX) * progress;
                const newZ = this.startWorldZ + (this.targetWorldZ - this.startWorldZ) * progress;

                // Check ground type at new position before moving
                const newPosGroundType = grid.getGroundTypeAtPosition(newX, newZ);
                if (window.DEBUG_MODE && grid.scene) {
                    this.showGroundCheck(newX, newZ, newPosGroundType, grid.scene);
                }
                
                if (!newPosGroundType || newPosGroundType === 'water') {
                    console.log(`[Stoonie ${this.id}] Invalid position detected during movement (${newPosGroundType}), finding new direction`);
                    // Cancel current move and try a new direction immediately
                    this.moveProgress = 1;
                    this.delayTimer = this.moveDelay;
                    return true;  // Keep stoonie alive
                }

                // Apply movement and update ground type
                this.worldX = newX;
                this.worldZ = newZ;
                this.currentGroundType = newPosGroundType;
            }
        }

        // Apply state effects
        this.applyStateEffects(deltaTime);

        // Update pregnancy if applicable
        if (this.pregnant) {
            this.pregnancyProgress += deltaTime / (this.pregnancyDuration * 24 * 60 * 60);
            if (this.pregnancyProgress >= 1) {
                return this.giveBirth();
            }
        }

        return true; // Stoonie survives this update
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    startNewMove(mapSystem) {
        // Get current triangle data
        const currentWorldPos = mapSystem.getWorldPosition(this.q, this.r);
        if (!currentWorldPos) {
            console.error(`[Stoonie ${this.id}] No valid current position`);
            return;
        }

        // Double check current position is valid
        const currentGroundType = mapSystem.getGroundTypeAtPosition(this.worldX, this.worldZ);
        if (!currentGroundType || currentGroundType === 'water') {
            console.error(`[Stoonie ${this.id}] Currently on invalid ground (${currentGroundType})`);
            return;
        }

        // Get all possible neighbors
        const allNeighbors = mapSystem.getNeighbors(this.q, this.r);
        
        // Shuffle neighbors for random selection
        const shuffledNeighbors = [...allNeighbors].sort(() => Math.random() - 0.5);

        // Try each neighbor until we find a valid one
        for (const targetPos of shuffledNeighbors) {
            const targetWorldPos = mapSystem.getWorldPosition(targetPos.q, targetPos.r);
            if (!targetWorldPos) continue;

            // Check ground type at target center
            const targetGroundType = mapSystem.getGroundTypeAtPosition(targetWorldPos.x, targetWorldPos.z);
            if (!targetGroundType || targetGroundType === 'water') {
                console.log(`[Stoonie ${this.id}] Skipping invalid neighbor (${targetPos.q}, ${targetPos.r}): ${targetGroundType}`);
                continue;
            }

            // Try to find a valid random offset
            let validOffset = false;
            let offsetX = 0;
            let offsetZ = 0;
            
            for (let attempts = 0; attempts < 5; attempts++) {
                const randomAngle = Math.random() * Math.PI * 2;
                const randomRadius = Math.random() * this.wanderRadius;
                const testOffsetX = Math.cos(randomAngle) * randomRadius;
                const testOffsetZ = Math.sin(randomAngle) * randomRadius;

                // Test the offset position
                const offsetGroundType = mapSystem.getGroundTypeAtPosition(
                    targetWorldPos.x + testOffsetX,
                    targetWorldPos.z + testOffsetZ
                );

                if (offsetGroundType && offsetGroundType !== 'water') {
                    validOffset = true;
                    offsetX = testOffsetX;
                    offsetZ = testOffsetZ;
                    break;
                }
            }

            // Set target position (either with offset or center)
            this.startWorldX = this.worldX;
            this.startWorldZ = this.worldZ;
            this.targetWorldX = targetWorldPos.x + (validOffset ? offsetX : 0);
            this.targetWorldZ = targetWorldPos.z + (validOffset ? offsetZ : 0);
            
            // Final validation of target position
            const finalGroundType = mapSystem.getGroundTypeAtPosition(this.targetWorldX, this.targetWorldZ);
            if (!finalGroundType || finalGroundType === 'water') {
                console.log(`[Stoonie ${this.id}] Final position check failed: ${finalGroundType}`);
                continue;
            }

            // Update grid position and movement parameters
            this.q = targetPos.q;
            this.r = targetPos.r;
            
            // Update speed based on ground type
            this.speed = this.baseSpeed * (this.groundSpeedModifiers[finalGroundType] || 1.0);
            
            // Calculate movement duration based on distance and current speed
            const dx = this.targetWorldX - this.startWorldX;
            const dz = this.targetWorldZ - this.startWorldZ;
            const distance = Math.sqrt(dx * dx + dz * dz);
            this.moveDuration = distance / this.speed;
            
            // Reset movement progress
            this.moveProgress = 0;
            this.moveTimer = 0;

            // Apply energy cost for movement (higher cost on sand)
            const energyCost = finalGroundType === 'sand' ? 3 : 2;
            this.needs.energy = Math.max(0, this.needs.energy - energyCost);

            console.log(`[Stoonie ${this.id}] Moving to (${targetPos.q}, ${targetPos.r}) on ${finalGroundType}`);
            return; // Successfully found move
        }

        console.log(`[Stoonie ${this.id}] No valid moves found, staying put`);
    }

    updateState() {
        const prevState = this.state;
        
        // Update state based on needs
        if (this.needs.energy < 20) {
            this.state = 'sleeping';
        } else if (this.needs.hunger > 80) {
            this.state = 'eating';
        } else if (this.needs.thirst > 80) {
            this.state = 'drinking';
        } else {
            this.state = 'moving';
        }

        // If state changed, reset movement
        if (prevState !== this.state) {
            this.moveProgress = 1;
            this.delayTimer = 0;
        }
    }

    applyStateEffects(deltaTime) {
        const effectMultiplier = 1.5; // Increase effect rates
        
        switch (this.state) {
            case 'sleeping':
                this.needs.energy = Math.min(100, this.needs.energy + deltaTime * 15 * effectMultiplier);
                this.needs.sleep = Math.max(0, this.needs.sleep - deltaTime * 30 * effectMultiplier);
                break;
            case 'eating':
                this.needs.hunger = Math.max(0, this.needs.hunger - deltaTime * 30 * effectMultiplier);
                this.needs.energy -= deltaTime * 2; // Eating consumes some energy
                break;
            case 'drinking':
                this.needs.thirst = Math.max(0, this.needs.thirst - deltaTime * 30 * effectMultiplier);
                this.needs.energy -= deltaTime * 1; // Drinking consumes little energy
                break;
            case 'moving':
                this.needs.energy -= deltaTime * 3; // Moving consumes more energy
                this.needs.thirst -= deltaTime * 2; // Moving makes them thirstier
                this.needs.hunger -= deltaTime * 1.5; // Moving makes them hungrier
                break;
        }
    }

    // Attempt to mate with another Stoonie
    mate(partner) {
        if (this.gender === partner.gender) return false;
        if (this.gender === 'female' && !this.pregnant && this.age >= 16 && this.age <= 45) {
            this.pregnant = true;
            this.pregnancyProgress = 0;
            return true;
        }
        return false;
    }

    // Give birth to a new Stoonie
    giveBirth() {
        this.pregnant = false;
        this.pregnancyProgress = 0;
        // Return a new baby Stoonie
        return new Stoonie(Math.random() < 0.5 ? 'male' : 'female');
    }

    // Handle death
    die(cause) {
        console.log(`[Stoonie ${this.id}] Died from ${cause}`);
        
        // Clean up debug lines
        if (this.debugLines) {
            this.debugLines.forEach(line => {
                if (line && line.parent) {
                    line.parent.remove(line);
                    line.geometry.dispose();
                    line.material.dispose();
                }
            });
            this.debugLines = [];
        }
        
        this.dispose();
        return false; // Indicates stoonie should be removed
    }

    // Soul management
    connectSoul(soul) {
        if (this.hasConnectedSoul || !soul) return false;
        
        this.connectedSoul = soul;
        this.hasConnectedSoul = true;
        soul.connectToStoonie(this.id);
        return true;
    }

    disconnectSoul(reason = null) {
        if (!this.hasConnectedSoul || !this.connectedSoul) return false;
        
        this.connectedSoul.disconnectFromStoonie(reason);
        this.connectedSoul = null;
        this.hasConnectedSoul = false;
        return true;
    }

    // Add experience to connected soul
    gainExperience(amount, skillType = null) {
        if (this.hasConnectedSoul && this.connectedSoul) {
            this.connectedSoul.gainExperience(amount, skillType);
            return true;
        }
        return false;
    }

    // Use soul powers
    useMana(amount) {
        if (this.hasConnectedSoul && this.connectedSoul) {
            return this.connectedSoul.useMana(amount);
        }
        return false;
    }

    // Check if Stoonie knows a specific spell or recipe
    knowsSpell(spellId) {
        return this.hasConnectedSoul && 
               this.connectedSoul && 
               this.connectedSoul.skills.magic.spells.has(spellId);
    }

    knowsRecipe(recipeId) {
        return this.hasConnectedSoul && 
               this.connectedSoul && 
               this.connectedSoul.skills.crafting.recipes.has(recipeId);
    }

    // Override getStatus to include soul information
    getStatus() {
        return {
            id: this.id,
            gender: this.gender,
            age: this.age,
            pregnant: this.pregnant,
            pregnancyProgress: this.pregnancyProgress,
            needs: this.needs,
            state: this.state,
            position: { q: this.q, r: this.r, x: this.worldX, z: this.worldZ },
            groundType: this.currentGroundType || 'unknown',
            soulConnection: {
                hasConnectedSoul: this.hasConnectedSoul,
                soulId: this.connectedSoul?.id || null,
                soulLevel: this.connectedSoul?.level || null,
                availableMana: this.connectedSoul?.mana.current || 0
            }
        };
    }

    // Fulfill needs
    eat(amount) {
        this.needs.hunger = Math.min(100, this.needs.hunger + amount);
    }

    drink(amount) {
        this.needs.thirst = Math.min(100, this.needs.thirst + amount);
    }

    sleep(duration) {
        this.currentActivity = 'sleeping';
        this.needs.sleep = Math.min(100, this.needs.sleep + duration);
        this.needs.energy = Math.min(100, this.needs.energy + duration * 0.5);
    }

    rest(duration) {
        this.currentActivity = 'resting';
        this.needs.energy = Math.min(100, this.needs.energy + duration);
    }

    // Move to a new position on the grid
    moveTo(q, r) {
        this.q = q;
        this.r = r;
        this.needs.energy = Math.max(0, this.needs.energy - 5); // Moving costs energy
    }

    dispose() {
        // Clean up debug lines
        if (this.debugLines) {
            this.debugLines.forEach(line => {
                if (line && line.parent) {
                    line.parent.remove(line);
                    line.geometry.dispose();
                    line.material.dispose();
                }
            });
            this.debugLines = [];
        }
    }
}
