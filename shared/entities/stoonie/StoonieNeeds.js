export class StoonieNeeds {
    constructor() {
        // Needs system (0-100)
        this.needs = {
            hunger: 100,    // Decreases over time, replenished by eating
            thirst: 100,    // Decreases over time, replenished by drinking
            energy: 100,    // Decreases with activity, replenished by resting
            sleep: 0,       // Increases while awake, decreased by sleeping
            health: 100     // Affected by other needs, medical care
        };

        // Need decay rates per second
        this.decayRates = {
            hunger: 0.5,
            thirst: 0.8,
            energy: 0.3,
            sleep: 0.4
        };
    }

    update(deltaTime) {
        // Update all needs based on decay rates
        for (const [need, rate] of Object.entries(this.decayRates)) {
            if (need === 'sleep') {
                this.needs.sleep = Math.min(100, this.needs.sleep + rate * deltaTime);
            } else {
                this.needs[need] = Math.max(0, this.needs[need] - rate * deltaTime);
            }
        }

        // Health decreases if other needs are critically low
        let healthDecay = 0;
        if (this.needs.hunger < 20) healthDecay += 0.2;
        if (this.needs.thirst < 20) healthDecay += 0.3;
        if (this.needs.energy < 20) healthDecay += 0.1;
        if (this.needs.sleep > 80) healthDecay += 0.2;

        this.needs.health = Math.max(0, this.needs.health - healthDecay * deltaTime);
        
        return this.needs.health > 0; // Return false if health reaches 0
    }

    // Fulfill needs
    eat(amount) {
        this.needs.hunger = Math.min(100, this.needs.hunger + amount);
        this.needs.energy = Math.min(100, this.needs.energy + amount * 0.2);
    }

    drink(amount) {
        this.needs.thirst = Math.min(100, this.needs.thirst + amount);
    }

    sleep(duration) {
        const sleepRecovery = duration * 20;
        this.needs.sleep = Math.max(0, this.needs.sleep - sleepRecovery);
        this.needs.energy = Math.min(100, this.needs.energy + sleepRecovery * 0.5);
    }

    rest(duration) {
        this.needs.energy = Math.min(100, this.needs.energy + duration * 10);
    }

    // Get current needs status
    getNeeds() {
        return { ...this.needs };
    }

    // Check if any need is critical
    hasCriticalNeeds() {
        return this.needs.hunger < 20 || 
               this.needs.thirst < 20 || 
               this.needs.energy < 20 || 
               this.needs.sleep > 80 ||
               this.needs.health < 20;
    }

    // Get the most urgent need
    getMostUrgentNeed() {
        const needsUrgency = {
            hunger: (100 - this.needs.hunger) / this.decayRates.hunger,
            thirst: (100 - this.needs.thirst) / this.decayRates.thirst,
            energy: (100 - this.needs.energy) / this.decayRates.energy,
            sleep: this.needs.sleep / this.decayRates.sleep
        };

        return Object.entries(needsUrgency)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
}
