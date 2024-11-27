export class StoonieSoulSystem {
    constructor() {
        this.hasConnectedSoul = false;
        this.connectedSoul = null;
    }

    // Soul management
    connectSoul(soul) {
        if (this.hasConnectedSoul || !soul) return false;
        
        this.connectedSoul = soul;
        this.hasConnectedSoul = true;
        return true;
    }

    disconnectSoul(reason = null) {
        if (!this.hasConnectedSoul) return false;

        const soul = this.connectedSoul;
        this.connectedSoul = null;
        this.hasConnectedSoul = false;

        return {
            event: 'soulDisconnected',
            soul,
            reason
        };
    }

    // Add experience to connected soul
    gainExperience(amount, skillType = null) {
        if (!this.hasConnectedSoul || !this.connectedSoul) return false;

        if (skillType) {
            this.connectedSoul.gainSkillExperience(skillType, amount);
        } else {
            this.connectedSoul.gainExperience(amount);
        }
        return true;
    }

    // Use soul powers
    useMana(amount) {
        if (!this.hasConnectedSoul || !this.connectedSoul) return false;
        return this.connectedSoul.useMana(amount);
    }

    // Check if Stoonie knows a specific spell or recipe
    knowsSpell(spellId) {
        return this.hasConnectedSoul && 
               this.connectedSoul && 
               this.connectedSoul.knowsSpell(spellId);
    }

    knowsRecipe(recipeId) {
        return this.hasConnectedSoul && 
               this.connectedSoul && 
               this.connectedSoul.knowsRecipe(recipeId);
    }

    getSoulStatus() {
        if (!this.hasConnectedSoul || !this.connectedSoul) {
            return {
                hasSoul: false,
                soulId: null,
                level: 0,
                experience: 0,
                skills: {}
            };
        }

        return {
            hasSoul: true,
            soulId: this.connectedSoul.id,
            level: this.connectedSoul.level,
            experience: this.connectedSoul.experience,
            skills: this.connectedSoul.skills
        };
    }
}
