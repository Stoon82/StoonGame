import { CombatStats } from '../combat/CombatStats';
import { Vector2 } from '../types/Vector2';

export enum EnemyType {
    DARK_STOONIE = 'DARK_STOONIE',
    CORRUPTED_STOONIE = 'CORRUPTED_STOONIE',
    ELITE_DARK_STOONIE = 'ELITE_DARK_STOONIE'
}

export interface EnemyProperties {
    type: EnemyType;
    name: string;
    description: string;
    sprite: string;
    baseStats: CombatStats;
    moveSpeed: number;
    experienceValue: number;  // Experience given when killed
    resourceDrop?: { type: string; amount: number }[];  // Optional resource drops
}

export const ENEMY_PROPERTIES: Record<EnemyType, EnemyProperties> = {
    [EnemyType.DARK_STOONIE]: {
        type: EnemyType.DARK_STOONIE,
        name: 'Dark Stoonie',
        description: 'A corrupted Stoonie that attacks its former allies',
        sprite: 'assets/enemies/dark_stoonie.png',
        baseStats: {
            attack: 10,
            defense: 5,
            health: 50,
            maxHealth: 50,
            range: 1,
            attackSpeed: 1
        },
        moveSpeed: 2,
        experienceValue: 10
    },
    [EnemyType.CORRUPTED_STOONIE]: {
        type: EnemyType.CORRUPTED_STOONIE,
        name: 'Corrupted Stoonie',
        description: 'A more powerful corrupted Stoonie with ranged attacks',
        sprite: 'assets/enemies/corrupted_stoonie.png',
        baseStats: {
            attack: 15,
            defense: 3,
            health: 40,
            maxHealth: 40,
            range: 3,
            attackSpeed: 0.8
        },
        moveSpeed: 2.5,
        experienceValue: 15
    },
    [EnemyType.ELITE_DARK_STOONIE]: {
        type: EnemyType.ELITE_DARK_STOONIE,
        name: 'Elite Dark Stoonie',
        description: 'A powerful elite version of the Dark Stoonie',
        sprite: 'assets/enemies/elite_dark_stoonie.png',
        baseStats: {
            attack: 20,
            defense: 8,
            health: 80,
            maxHealth: 80,
            range: 1.5,
            attackSpeed: 1.2
        },
        moveSpeed: 1.8,
        experienceValue: 25
    }
};

export class Enemy {
    public id: string;
    public type: EnemyType;
    public position: Vector2;
    public stats: CombatStats;
    public target?: { id: string; position: Vector2 };
    public isActive: boolean = true;

    constructor(
        type: EnemyType,
        position: Vector2,
        id: string = Math.random().toString(36).substr(2, 9)
    ) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.stats = { ...ENEMY_PROPERTIES[type].baseStats };
    }

    public update(deltaTime: number): void {
        // Move towards target if exists
        if (this.target && this.isActive) {
            const dx = this.target.position.x - this.position.x;
            const dy = this.target.position.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const speed = ENEMY_PROPERTIES[this.type].moveSpeed * deltaTime;
                const moveX = (dx / distance) * speed;
                const moveY = (dy / distance) * speed;

                this.position.x += moveX;
                this.position.y += moveY;
            }
        }
    }

    public takeDamage(amount: number): boolean {
        this.stats.health -= amount;
        if (this.stats.health <= 0) {
            this.isActive = false;
            return true; // Enemy died
        }
        return false;
    }

    public heal(amount: number): void {
        this.stats.health = Math.min(
            this.stats.health + amount,
            this.stats.maxHealth
        );
    }
}
