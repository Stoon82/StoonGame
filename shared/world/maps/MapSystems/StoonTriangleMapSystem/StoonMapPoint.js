import { GROUND_TYPES, getGroundTypeColor } from '../../../groundTypes.js';

export class StoonMapPoint {
    constructor(q, r, isCorner = false, groundTypeIndex = 0) {
        this.q = q;
        this.r = r;
        this.isCorner = isCorner;
        this.groundTypeIndex = groundTypeIndex;
        this.groundTypeColor = getGroundTypeColor(GROUND_TYPES[groundTypeIndex]);
    }

    setGroundType(index) {
        this.groundTypeIndex = index;
        this.groundTypeColor = getGroundTypeColor(GROUND_TYPES[index]);
    }

    toJSON() {
        return {
            q: this.q,
            r: this.r,
            isCorner: this.isCorner,
            groundTypeIndex: this.groundTypeIndex,
            groundTypeColor: this.groundTypeColor
        };
    }
}

export default StoonMapPoint;
