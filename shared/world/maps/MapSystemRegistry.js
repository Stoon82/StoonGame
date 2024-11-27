import TriangleMapSystem from './MapSystems/TriangleMapSystem/TriangleMapSystem.js';
import StoonTriangleMapSystem from './MapSystems/StoonTriangleMapSystem/StoonTriangleMapSystem.js';

class MapSystemRegistry {
    constructor() {
        this.mapSystems = new Map();
        this.register('triangle', TriangleMapSystem);
        this.register('stoon', StoonTriangleMapSystem);
    }

    register(name, mapSystemClass) {
        if (!this.mapSystems.has(name)) {
            this.mapSystems.set(name, mapSystemClass);
        }
    }

    getMapSystem(name) {
        return this.mapSystems.get(name);
    }

    createMapSystem(name, config) {
        const MapSystemClass = this.getMapSystem(name);
        if (MapSystemClass) {
            return new MapSystemClass(config);
        }
        throw new Error(`Map system ${name} not found`);
    }
}

const mapSystemRegistry = new MapSystemRegistry();
export default mapSystemRegistry;
