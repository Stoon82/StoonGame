import { MapSystemInterface } from '../../../MapSystemInterface.js';
import StoonTriangleData from './StoonTriangleData.js';
import StoonMapPoint from './StoonMapPoint.js';

export class StoonTriangleMapSystem extends MapSystemInterface {
    constructor(config = {}) {
        super();
        this.cornerPoints = new Map();
        this.centerPoints = new Map();
        this.size = config.size || 1;
        this.socket = config.socket || null;
        this.scene = null;

        if (this.socket) {
            this.setupSocketListeners();
        }
    }

    clear() {
        this.cornerPoints.clear();
        this.centerPoints.clear();
    }

    addTriangle(q, r, groundTypes) {
        const key = `${q},${r}`;
        if (this.centerPoints.has(key)) {
            return false;
        }

        // Add center point
        const centerPoint = {
            worldPos: this.gridToWorld(q, r),
            gridPos: { q, r },
            groundType: groundTypes[0]
        };
        this.centerPoints.set(key, centerPoint);

        return true;
    }

    getTriangle(q, r) {
        const key = `${q},${r}`;
        return this.centerPoints.get(key);
    }

    getAllTriangles() {
        return Array.from(this.centerPoints.values());
    }

    // Helper method to convert grid coordinates to world coordinates
    gridToWorld(q, r) {
        const x = (q * Math.sqrt(3) + (r & 1) * Math.sqrt(3) / 2) * this.size;
        const z = (r * 1.5) * this.size;
        return { x, z };
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('mapState', (mapData) => {
            console.log('[StoonTriangleMapSystem] Received map state:', mapData);
            this.loadMapData(mapData);
        });

        this.socket.on('mapUpdate', (update) => {
            console.log('[StoonTriangleMapSystem] Received map update:', update);
            if (update.type === 'centerPoint') {
                this.centerPoints.set(update.key, update.data);
            }
        });
    }

    loadMapData(mapData) {
        if (!mapData) return;
        
        // Clear existing data
        this.clear();

        // Load center points
        if (mapData.centerPoints) {
            Object.entries(mapData.centerPoints).forEach(([key, point]) => {
                this.centerPoints.set(key, point);
            });
        }
    }
}

export default StoonTriangleMapSystem;
