// Data structures for consistent map data handling between client and server

import { GROUND_TYPES } from './groundTypes.js';

export class StoonCenterPointData {
    constructor(worldPos, gridPos, groundType) {
        this.worldPos = {
            x: worldPos.x || 0,
            y: worldPos.y || 0,
            z: worldPos.z || 0
        };
        this.gridPos = {
            q: gridPos.q || 0,
            r: gridPos.r || 0
        };
        this.groundType = groundType || 'GRASS';
    }

    // Generate a consistent key for this center point
    getKey() {
        return `${this.gridPos.q},${this.gridPos.r}`;
    }

    // Create from raw data
    static fromData(data) {
        return new StoonCenterPointData(
            data.worldPos || {},
            data.gridPos || {},
            data.groundType
        );
    }

    // Convert to plain object for transmission
    toData() {
        return {
            worldPos: { ...this.worldPos },
            gridPos: { ...this.gridPos },
            groundType: this.groundType
        };
    }
}

export class StoonCornerPointData {
    constructor(worldPos, gridPos, groundType) {
        this.worldPos = {
            x: worldPos.x || 0,
            y: worldPos.y || 0,
            z: worldPos.z || 0
        };
        this.gridPos = {
            q: gridPos.q || 0,
            r: gridPos.r || 0
        };
        this.groundType = groundType || 'GRASS';
    }

    // Generate a consistent key for this corner point
    getKey() {
        return `${this.gridPos.q},${this.gridPos.r}`;
    }

    // Create from raw data
    static fromData(data) {
        return new StoonCornerPointData(
            data.worldPos || {},
            data.gridPos || {},
            data.groundType
        );
    }

    // Convert to plain object for transmission
    toData() {
        return {
            worldPos: { ...this.worldPos },
            gridPos: { ...this.gridPos },
            groundType: this.groundType
        };
    }
}

export class StoonTriangleData {
    constructor(q, r, groundType) {
        this.gridPos = {
            q: q || 0,
            r: r || 0
        };
        this.groundType = groundType || 'GRASS';
    }

    // Generate a consistent key for this triangle
    getKey() {
        return `${this.gridPos.q},${this.gridPos.r}`;
    }

    // Create from raw data
    static fromData(data) {
        return new StoonTriangleData(
            data.gridPos?.q,
            data.gridPos?.r,
            data.groundType
        );
    }

    // Convert to plain object for transmission
    toData() {
        return {
            gridPos: { ...this.gridPos },
            groundType: this.groundType
        };
    }
}

export class StoonMapData {
    constructor() {
        this.triangles = {};
        this.edges = {};
        this.buildings = {};
    }

    addTriangle(q, r, groundTypes) {
        const key = `${q},${r}`;
        if (!this.triangles[key]) {
            this.triangles[key] = {
                q,
                r,
                groundTypes: groundTypes || Array(4).fill(GROUND_TYPES.GRASS.id)
            };
            return true;
        }
        return false;
    }

    getTriangle(q, r) {
        return this.triangles[`${q},${r}`];
    }

    getAllTriangles() {
        return Object.values(this.triangles);
    }

    clear() {
        this.triangles = {};
        this.edges = {};
        this.buildings = {};
    }
}

export {
    StoonCenterPointData,
    StoonCornerPointData,
    StoonTriangleData,
    StoonMapData
};
