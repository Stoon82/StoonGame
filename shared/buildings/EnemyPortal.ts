import { Building } from './Building';
import { Enemy, EnemyType, ENEMY_PROPERTIES } from '../entities/Enemy';
import { Vector2 } from '../types/Vector2';

export interface PortalProperties {
    spawnInterval: number;  // Time between spawns in milliseconds
    maxActiveEnemies: number;
    spawnRadius: number;  // Radius around portal where enemies can spawn
    health: number;
    defense: number;
}

export class EnemyPortal extends Building {
    private properties: PortalProperties;
    private lastSpawnTime: number = 0;
    private activeEnemies: Enemy[] = [];
    private waveNumber: number = 0;

    constructor(
        position: Vector2,
        properties: PortalProperties = {
            spawnInterval: 10000,  // 10 seconds between spawns
            maxActiveEnemies: 5,
            spawnRadius: 3,
            health: 200,
            defense: 10
        }
    ) {
        super({
            type: 'ENEMY_PORTAL',
            position,
            size: { width: 3, height: 3 },
            sprite: 'assets/buildings/enemy_portal.png',
            isBlocking: true,
            health: properties.health
        });

        this.properties = properties;
    }

    public update(currentTime: number): Enemy[] {
        if (!this.isActive) return [];

        // Check if it's time to spawn new enemies
        if (
            currentTime - this.lastSpawnTime >= this.properties.spawnInterval &&
            this.activeEnemies.length < this.properties.maxActiveEnemies
        ) {
            const newEnemies = this.spawnEnemyWave();
            this.lastSpawnTime = currentTime;
            return newEnemies;
        }

        // Clean up dead enemies
        this.activeEnemies = this.activeEnemies.filter(enemy => enemy.isActive);
        return [];
    }

    private spawnEnemyWave(): Enemy[] {
        const newEnemies: Enemy[] = [];
        const enemiesToSpawn = this.calculateWaveComposition();

        enemiesToSpawn.forEach(enemyType => {
            const spawnPosition = this.getRandomSpawnPosition();
            const enemy = new Enemy(enemyType, spawnPosition);
            this.activeEnemies.push(enemy);
            newEnemies.push(enemy);
        });

        this.waveNumber++;
        return newEnemies;
    }

    private calculateWaveComposition(): EnemyType[] {
        const enemies: EnemyType[] = [];
        const remainingSlots = this.properties.maxActiveEnemies - this.activeEnemies.length;

        // As wave number increases, spawn stronger enemies
        if (this.waveNumber >= 10) {
            // Later waves can spawn Elite Dark Stoonies
            enemies.push(EnemyType.ELITE_DARK_STOONIE);
            for (let i = 1; i < remainingSlots; i++) {
                enemies.push(Math.random() < 0.4 ? EnemyType.CORRUPTED_STOONIE : EnemyType.DARK_STOONIE);
            }
        } else if (this.waveNumber >= 5) {
            // Mid waves can spawn Corrupted Stoonies
            enemies.push(EnemyType.CORRUPTED_STOONIE);
            for (let i = 1; i < remainingSlots; i++) {
                enemies.push(EnemyType.DARK_STOONIE);
            }
        } else {
            // Early waves only spawn Dark Stoonies
            for (let i = 0; i < remainingSlots; i++) {
                enemies.push(EnemyType.DARK_STOONIE);
            }
        }

        return enemies;
    }

    private getRandomSpawnPosition(): Vector2 {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.properties.spawnRadius;
        
        return {
            x: this.position.x + Math.cos(angle) * distance,
            y: this.position.y + Math.sin(angle) * distance
        };
    }

    public destroy(): void {
        this.isActive = false;
        // Kill all active enemies when portal is destroyed
        this.activeEnemies.forEach(enemy => {
            enemy.isActive = false;
        });
        this.activeEnemies = [];
    }

    public getActiveEnemyCount(): number {
        return this.activeEnemies.length;
    }

    public getCurrentWave(): number {
        return this.waveNumber;
    }
}
