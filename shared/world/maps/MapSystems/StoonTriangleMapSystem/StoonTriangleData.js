import { GROUND_TYPES } from '../../../groundTypes.js';

export class StoonTriangleData {
    constructor(q, r, size = 1) {
        this.q = q;
        this.r = r;
        this.size = size;

        // Initialize positions
        this.centerPosition = this.calculateCenterPosition();
        this.cornerPositions = this.calculateCornerPositions();

        // Initialize ground types
        this.centerGroundType = GROUND_TYPES.GRASS.id;
        this.cornerGroundTypes = [
            GROUND_TYPES.GRASS.id,
            GROUND_TYPES.GRASS.id,
            GROUND_TYPES.GRASS.id
        ];
    }

    calculateCenterPosition() {
        const x = (this.q * Math.sqrt(3) + (this.r & 1) * Math.sqrt(3) / 2) * this.size;
        const z = (this.r * 1.5) * this.size;
        return { x, z };
    }

    calculateCornerPositions() {
        const center = this.calculateCenterPosition();
        const height = Math.sqrt(3) / 2 * this.size;

        return [
            { x: center.x, z: center.z + height }, // Top corner
            { x: center.x - this.size / 2, z: center.z - height / 2 }, // Bottom-left corner
            { x: center.x + this.size / 2, z: center.z - height / 2 }  // Bottom-right corner
        ];
    }

    setCenterGroundType(type) {
        this.centerGroundType = type;
    }

    setCornerGroundType(index, type) {
        if (index >= 0 && index < this.cornerGroundTypes.length) {
            this.cornerGroundTypes[index] = type;
        }
    }
}

export default StoonTriangleData;
