class TriangleMatchGame {
    constructor(worldRenderer) {
        this.worldRenderer = worldRenderer;
        this.gridRenderer = worldRenderer.gridRenderer;
        this.currentPreviewTriangle = null;
        this.placedTriangles = new Map(); // Map<String, {q, r, groundTypes}>
        this.setupInitialHexagon();
    }

    setupInitialHexagon() {
        // Center triangle (upward)
        this.placedTriangles.set('0,0', {
            q: 0,
            r: 0,
            groundTypes: this.generateRandomGroundTypes()
        });

        // Surrounding triangles (alternating up/down)
        const surroundingPositions = [
            {q: 1, r: 0},   // right
            {q: 0.5, r: 1},  // bottom right
            {q: -0.5, r: 1}, // bottom left
            {q: -1, r: 0},   // left
            {q: -0.5, r: -1}, // top left
            {q: 0.5, r: -1}   // top right
        ];

        surroundingPositions.forEach(pos => {
            this.placedTriangles.set(`${pos.q},${pos.r}`, {
                q: pos.q,
                r: pos.r,
                groundTypes: this.generateRandomGroundTypes()
            });
        });

        this.renderWorld();
        this.generateNewPreviewTriangle();
    }

    generateRandomGroundTypes() {
        const types = ['GRASS', 'WATER', 'SAND', 'ROCK'];
        return [
            types[Math.floor(Math.random() * types.length)], // center
            types[Math.floor(Math.random() * types.length)], // left arc
            types[Math.floor(Math.random() * types.length)], // right arc
            types[Math.floor(Math.random() * types.length)]  // top/bottom arc
        ];
    }

    generateNewPreviewTriangle() {
        this.currentPreviewTriangle = {
            groundTypes: this.generateRandomGroundTypes()
        };
        // TODO: Render preview triangle in UI
    }

    getNeighbors(q, r) {
        const positions = [
            {q: q+1, r: r},    // right
            {q: q+0.5, r: r+1}, // bottom right
            {q: q-0.5, r: r+1}, // bottom left
            {q: q-1, r: r},     // left
            {q: q-0.5, r: r-1}, // top left
            {q: q+0.5, r: r-1}  // top right
        ];

        return positions.map(pos => ({
            pos,
            triangle: this.placedTriangles.get(`${pos.q},${pos.r}`)
        })).filter(n => n.triangle);
    }

    canPlaceTriangle(q, r) {
        if (this.placedTriangles.has(`${q},${r}`)) {
            return false;
        }

        const neighbors = this.getNeighbors(q, r);
        if (neighbors.length === 0) {
            return false; // Must be adjacent to at least one existing triangle
        }

        // TODO: Check if the preview triangle's arcs match with neighboring triangles
        return true;
    }

    tryPlaceTriangle(q, r) {
        if (!this.canPlaceTriangle(q, r)) {
            return false;
        }

        this.placedTriangles.set(`${q},${r}`, {
            q,
            r,
            groundTypes: this.currentPreviewTriangle.groundTypes
        });

        this.renderWorld();
        this.generateNewPreviewTriangle();
        return true;
    }

    renderWorld() {
        // Clear existing world
        this.worldRenderer.clear();

        // Render all placed triangles
        for (const [_, triangle] of this.placedTriangles) {
            this.worldRenderer.renderTriangle(
                triangle.q,
                triangle.r,
                triangle.groundTypes
            );
        }
    }
}

export default TriangleMatchGame;
