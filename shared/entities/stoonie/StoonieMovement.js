export class StoonieMovement {
    constructor() {
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
        this.moveDelay = 0.5 + Math.random(); // Random delay between moves
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

        this.currentGroundType = null;
    }

    update(deltaTime, mapSystem) {
        if (this.moveProgress < 1) {
            // Update movement progress
            this.moveTimer += deltaTime * this.speed;
            this.moveProgress = Math.min(1, this.moveTimer / this.moveDuration);

            // Update position using easing
            const t = this.easeInOutQuad(this.moveProgress);
            this.worldX = this.startWorldX + (this.targetWorldX - this.startWorldX) * t;
            this.worldZ = this.startWorldZ + (this.targetWorldZ - this.startWorldZ) * t;

            // Check if movement is complete
            if (this.moveProgress >= 1) {
                this.moveTimer = 0;
                this.delayTimer = 0;
            }
        } else {
            // Update delay timer
            this.delayTimer += deltaTime;
            if (this.delayTimer >= this.moveDelay) {
                this.startNewMove(mapSystem);
            }
        }
    }

    startNewMove(mapSystem) {
        if (!mapSystem) return;

        // Get current position's ground type
        const currentPos = mapSystem.getWorldPosition(this.q, this.r);
        if (!currentPos) return;

        // Store start position
        this.startWorldX = this.worldX;
        this.startWorldZ = this.worldZ;

        // Calculate new target position within wander radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.wanderRadius;
        this.targetWorldX = currentPos.x + Math.cos(angle) * distance;
        this.targetWorldZ = currentPos.z + Math.sin(angle) * distance;

        // Update ground type and speed
        this.currentGroundType = mapSystem.getGroundTypeAt(this.targetWorldX, this.targetWorldZ);
        this.speed = this.baseSpeed * (this.groundSpeedModifiers[this.currentGroundType?.toLowerCase()] || 1);

        // Reset movement progress
        this.moveProgress = 0;
        this.moveTimer = 0;
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    moveTo(q, r) {
        this.q = q;
        this.r = r;
        this.moveProgress = 1; // Force immediate completion of any current movement
    }

    getPosition() {
        return {
            q: this.q,
            r: this.r,
            worldX: this.worldX,
            worldZ: this.worldZ
        };
    }

    getCurrentGroundType() {
        return this.currentGroundType;
    }

    getMovementStatus() {
        return {
            moveProgress: this.moveProgress,
            speed: this.speed,
            groundType: this.currentGroundType
        };
    }
}
