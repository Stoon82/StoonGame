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

export class Stoonie {
    constructor(gender = Math.random() < 0.5 ? 'male' : 'female') {
        // Basic attributes
        this.id = generateUUID();
        this.gender = gender;
        this.age = 0; // Age in days
        this.maxAge = 70 + Math.random() * 30; // Random max age between 70-100 days
        this.pregnant = false;
        this.pregnancyProgress = 0; // 0-1
        this.pregnancyDuration = 9; // 9 days for pregnancy

        // Position
        this.q = 0;
        this.r = 0;
        this.worldX = 0;
        this.worldZ = 0;
        this.targetWorldX = 0;
        this.targetWorldZ = 0;
        this.moveProgress = 1; // 1 means movement complete
        this.moveDuration = 2; // seconds to complete a move
        this.moveTimer = 0;
        this.moveDelay = 1 + Math.random() * 2; // Random delay between moves
        this.delayTimer = 0;
        this.speed = 0.5; // units per second
        this.wanderRadius = 0.4; // How far from triangle center they can wander

        // Needs system (0-100)
        this.needs = {
            hunger: 100,    // Decreases over time, replenished by eating
            thirst: 100,    // Decreases over time, replenished by drinking
            energy: 100,    // Decreases with activity, replenished by resting
            sleep: 100,     // Decreases while awake, replenished by sleeping
            health: 100     // Affected by other needs, medical care
        };

        // Need decay rates per game tick
        this.decayRates = {
            hunger: 1,
            thirst: 1.5,
            energy: 0.5,
            sleep: 0.8
        };

        // Current activity
        this.currentActivity = 'idle'; // idle, sleeping, eating, drinking, working, etc.

        // Autonomous movement
        this.lastMoveTime = Date.now();
        this.moveInterval = 1000; // Move every 1 second
        this.state = 'idle'; // idle, moving, sleeping, eating

        // Soul management
        this.hasConnectedSoul = false;
        this.connectedSoul = null;
    }

    // Update needs based on time passed
    update(deltaTime, grid) {
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

        // Update movement
        if (this.moveProgress >= 1) {
            // Movement complete, update delay timer
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
            this.worldX = this.startWorldX + (this.targetWorldX - this.startWorldX) * progress;
            this.worldZ = this.startWorldZ + (this.targetWorldZ - this.startWorldZ) * progress;
        }

        // Update pregnancy if applicable
        if (this.pregnant) {
            this.pregnancyProgress += deltaTime / (this.pregnancyDuration * 24 * 60 * 60);
            if (this.pregnancyProgress >= 1) {
                return this.giveBirth();
            }
        }

        // Autonomous movement
        if (Date.now() - this.lastMoveTime >= this.moveInterval) {
            this.updateState();
            this.applyStateEffects(deltaTime);
            this.lastMoveTime = Date.now();
        }

        return true; // Stoonie survives this update
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    startNewMove(grid) {
        // Get current triangle and its neighbors
        const currentTriangle = grid.getTriangle(this.q, this.r);
        if (!currentTriangle) return;

        const neighbors = grid.getNeighbors(this.q, this.r)
            .map(pos => grid.getTriangle(pos.q, pos.r))
            .filter(triangle => triangle && !triangle.groundTypes.includes('WATER')); // Filter out water triangles

        // Add current triangle if it's not water
        if (!currentTriangle.groundTypes.includes('WATER')) {
            neighbors.push(currentTriangle);
        }

        if (neighbors.length === 0) return;

        // Pick a random triangle from valid options
        const targetTriangle = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Get the world position of the target triangle
        const worldPos = grid.getWorldPosition(targetTriangle.q, targetTriangle.r);
        
        // Add some random offset within the triangle
        const randomAngle = Math.random() * Math.PI * 2;
        const randomRadius = Math.random() * this.wanderRadius;
        const offsetX = Math.cos(randomAngle) * randomRadius;
        const offsetZ = Math.sin(randomAngle) * randomRadius;

        // Store current position
        this.startWorldX = this.worldX;
        this.startWorldZ = this.worldZ;
        
        // Set target position with offset
        this.targetWorldX = worldPos.x + offsetX;
        this.targetWorldZ = worldPos.z + offsetZ;
        
        // Update grid position
        this.q = targetTriangle.q;
        this.r = targetTriangle.r;
        
        // Calculate movement duration based on distance and speed
        const dx = this.targetWorldX - this.startWorldX;
        const dz = this.targetWorldZ - this.startWorldZ;
        const distance = Math.sqrt(dx * dx + dz * dz);
        this.moveDuration = distance / this.speed;
        
        // Reset movement progress
        this.moveProgress = 0;
        this.moveTimer = 0;
    }

    updateState() {
        // Update state based on needs
        if (this.needs.energy < 20 || this.needs.sleep > 80) {
            this.state = 'sleeping';
        } else if (this.needs.hunger > 80) {
            this.state = 'eating';
        } else if (this.needs.thirst > 80) {
            this.state = 'drinking';
        } else {
            this.state = 'moving';
        }
    }

    applyStateEffects(deltaTime) {
        switch (this.state) {
            case 'sleeping':
                this.needs.energy = Math.min(100, this.needs.energy + deltaTime * 10);
                this.needs.sleep = Math.max(0, this.needs.sleep - deltaTime * 20);
                break;
            case 'eating':
                this.needs.hunger = Math.max(0, this.needs.hunger - deltaTime * 20);
                break;
            case 'drinking':
                this.needs.thirst = Math.max(0, this.needs.thirst - deltaTime * 20);
                break;
            case 'moving':
                //this.move(window.game.grid); // Access grid through game instance
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
        // Disconnect soul if connected
        if (this.hasConnectedSoul && this.connectedSoul) {
            this.disconnectSoul(cause);
        }
        
        this.alive = false;
        return false; // Indicate Stoonie has died
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
        const status = {
            id: this.id,
            gender: this.gender,
            age: Math.floor(this.age),
            position: { q: this.q, r: this.r, worldX: this.worldX, worldZ: this.worldZ },
            needs: this.needs,
            activity: this.currentActivity,
            pregnant: this.pregnant,
            pregnancyProgress: this.pregnancyProgress
        };
        status.soulConnection = {
            hasConnectedSoul: this.hasConnectedSoul,
            soulId: this.connectedSoul?.id || null,
            soulLevel: this.connectedSoul?.level || null,
            availableMana: this.connectedSoul?.mana.current || 0
        };
        return status;
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
}
