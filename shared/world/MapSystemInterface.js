// Interface for map systems
export class MapSystemInterface {
    constructor() {
        if (new.target === MapSystemInterface) {
            throw new TypeError('Cannot construct MapSystemInterface instances directly');
        }
    }

    // Method to clear the map
    clear() {
        throw new Error('Method clear() must be implemented');
    }

    // Method to add a triangle
    addTriangle(q, r, groundTypes) {
        throw new Error('Method addTriangle() must be implemented');
    }

    // Method to get a triangle
    getTriangle(q, r) {
        throw new Error('Method getTriangle() must be implemented');
    }

    // Method to get all triangles
    getAllTriangles() {
        throw new Error('Method getAllTriangles() must be implemented');
    }
}

export default MapSystemInterface;
