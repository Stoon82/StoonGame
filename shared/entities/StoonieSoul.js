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

export class StoonieSoul {
    constructor() {
        // Basic attributes
        this.id = generateUUID();
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = this.calculateExpForNextLevel();
        
        // Connection status
        this.connectedStoonieId = null;
        this.isConnected = false;

        // Powers and resources
        this.mana = {
            current: 100,
            max: 100,
            regenRate: 1 // per second
        };

        // Skills and their levels
        this.skills = {
            magic: {
                level: 1,
                experience: 0,
                spells: new Set() // Known spells
            },
            crafting: {
                level: 1,
                experience: 0,
                recipes: new Set() // Known recipes
            },
            gathering: {
                level: 1,
                experience: 0,
                knownResources: new Set() // Identifiable resources
            }
        };

        // Achievement and history tracking
        this.achievements = new Set();
        this.history = {
            totalStooniesConnected: 0,
            totalLifespan: 0, // Combined lifespan of all connected Stoonies
            significantEvents: [] // Array of important events
        };
    }

    // Experience and leveling
    gainExperience(amount, skillType = null) {
        if (skillType && this.skills[skillType]) {
            // Gain skill-specific experience
            this.skills[skillType].experience += amount;
            this.checkSkillLevelUp(skillType);
        }
        
        // Gain general soul experience
        this.experience += amount;
        this.checkLevelUp();
    }

    checkLevelUp() {
        while (this.experience >= this.experienceToNextLevel) {
            this.experience -= this.experienceToNextLevel;
            this.level++;
            this.experienceToNextLevel = this.calculateExpForNextLevel();
            this.onLevelUp();
        }
    }

    checkSkillLevelUp(skillType) {
        const skill = this.skills[skillType];
        const expNeeded = this.calculateSkillExpForNextLevel(skill.level);
        
        while (skill.experience >= expNeeded) {
            skill.experience -= expNeeded;
            skill.level++;
            this.onSkillLevelUp(skillType);
        }
    }

    calculateExpForNextLevel() {
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }

    calculateSkillExpForNextLevel(skillLevel) {
        return Math.floor(50 * Math.pow(1.4, skillLevel - 1));
    }

    // Connection management
    connectToStoonie(stoonieId) {
        if (this.isConnected) return false;
        
        this.connectedStoonieId = stoonieId;
        this.isConnected = true;
        this.history.totalStooniesConnected++;
        
        return true;
    }

    disconnectFromStoonie(deathCause = null) {
        if (!this.isConnected) return false;

        if (deathCause) {
            this.history.significantEvents.push({
                type: 'death',
                cause: deathCause,
                timestamp: Date.now()
            });
        }

        this.connectedStoonieId = null;
        this.isConnected = false;
        
        // Reset mana to base value
        this.mana.current = this.mana.max;
        
        return true;
    }

    // Power and resource management
    useMana(amount) {
        if (this.mana.current < amount) return false;
        this.mana.current -= amount;
        return true;
    }

    regenerateMana(deltaTime) {
        this.mana.current = Math.min(
            this.mana.max,
            this.mana.current + this.mana.regenRate * deltaTime
        );
    }

    // Learn new abilities
    learnSpell(spellId) {
        this.skills.magic.spells.add(spellId);
    }

    learnRecipe(recipeId) {
        this.skills.crafting.recipes.add(recipeId);
    }

    // Event handlers
    onLevelUp() {
        // Increase base stats
        this.mana.max += 10;
        this.mana.regenRate += 0.1;
    }

    onSkillLevelUp(skillType) {
        // Skill-specific bonuses could be applied here
    }

    // Get current status
    getStatus() {
        return {
            id: this.id,
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            isConnected: this.isConnected,
            connectedStoonieId: this.connectedStoonieId,
            mana: this.mana,
            skills: this.skills,
            history: this.history
        };
    }
}
