export interface CombatStats {
    attack: number;
    defense: number;
    health: number;
    maxHealth: number;
    range: number;  // Attack range in game units
    attackSpeed: number;  // Attacks per second
    lastAttackTime?: number;  // For attack cooldown
}

export interface DamageResult {
    damage: number;
    isCritical: boolean;
    isKilled: boolean;
}

export class CombatSystem {
    // Calculate damage based on attacker's attack and defender's defense
    public static calculateDamage(
        attackerStats: CombatStats,
        defenderStats: CombatStats
    ): DamageResult {
        // Base damage calculation
        const baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense / 2);
        
        // 10% chance for critical hit (1.5x damage)
        const isCritical = Math.random() < 0.1;
        const damage = Math.round(isCritical ? baseDamage * 1.5 : baseDamage);
        
        // Check if this damage would kill the defender
        const isKilled = defenderStats.health <= damage;

        return { damage, isCritical, isKilled };
    }

    // Check if an entity can attack (based on attack speed and cooldown)
    public static canAttack(stats: CombatStats, currentTime: number): boolean {
        if (!stats.lastAttackTime) return true;
        
        const timeSinceLastAttack = currentTime - stats.lastAttackTime;
        const attackCooldown = 1000 / stats.attackSpeed; // Convert to milliseconds
        
        return timeSinceLastAttack >= attackCooldown;
    }

    // Check if target is within attack range
    public static isInRange(
        attackerX: number,
        attackerY: number,
        targetX: number,
        targetY: number,
        range: number
    ): boolean {
        const dx = targetX - attackerX;
        const dy = targetY - attackerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= range;
    }
}
