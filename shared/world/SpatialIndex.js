class OctreeNode {
    constructor(center, size) {
        this.center = center;
        this.size = size;
        this.points = new Map(); // key: worldKey, value: point data
        this.children = null;
        this.MAX_POINTS = 8;
        this.MIN_SIZE = 0.1;
    }

    // Check if a point lies within this node's bounds
    contains(point) {
        return point.x >= this.center.x - this.size / 2 &&
               point.x <= this.center.x + this.size / 2 &&
               point.y >= this.center.y - this.size / 2 &&
               point.y <= this.center.y + this.size / 2;
    }

    // Split node into 4 quadrants (we only need 4 since we're dealing with 2D positions)
    split() {
        const halfSize = this.size / 2;
        const quarterSize = this.size / 4;
        
        this.children = [
            // Southwest
            new OctreeNode(
                { x: this.center.x - quarterSize, y: this.center.y - quarterSize },
                halfSize
            ),
            // Southeast
            new OctreeNode(
                { x: this.center.x + quarterSize, y: this.center.y - quarterSize },
                halfSize
            ),
            // Northwest
            new OctreeNode(
                { x: this.center.x - quarterSize, y: this.center.y + quarterSize },
                halfSize
            ),
            // Northeast
            new OctreeNode(
                { x: this.center.x + quarterSize, y: this.center.y + quarterSize },
                halfSize
            )
        ];

        // Redistribute existing points to children
        for (const [key, point] of this.points) {
            this.insertToChildren(key, point);
        }
        
        this.points.clear();
    }

    // Insert a point into the appropriate child node
    insertToChildren(key, point) {
        for (const child of this.children) {
            if (child.contains(point.worldPos)) {
                child.insert(key, point);
                return;
            }
        }
    }

    // Insert a point into this node
    insert(key, point) {
        // If we have children, delegate to appropriate child
        if (this.children) {
            this.insertToChildren(key, point);
            return;
        }

        // If we're at capacity and can split further, do so
        if (this.points.size >= this.MAX_POINTS && this.size > this.MIN_SIZE) {
            this.split();
            this.insertToChildren(key, point);
            return;
        }

        // Otherwise, store in this node
        this.points.set(key, point);
    }

    // Find points within a given radius of a position
    findNearby(position, radius) {
        const results = new Map();

        // If we have no children, check points in this node
        if (!this.children) {
            for (const [key, point] of this.points) {
                const dx = point.worldPos.x - position.x;
                const dy = point.worldPos.y - position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    results.set(key, point);
                }
            }
            return results;
        }

        // Otherwise, recursively check children that intersect with search radius
        for (const child of this.children) {
            if (this.intersectsCircle(child.center, child.size, position, radius)) {
                const childResults = child.findNearby(position, radius);
                for (const [key, point] of childResults) {
                    results.set(key, point);
                }
            }
        }

        return results;
    }

    // Check if a square intersects with a circle
    intersectsCircle(squareCenter, squareSize, circleCenter, radius) {
        const dx = Math.abs(circleCenter.x - squareCenter.x);
        const dy = Math.abs(circleCenter.y - squareCenter.y);

        if (dx > (squareSize / 2 + radius)) return false;
        if (dy > (squareSize / 2 + radius)) return false;

        if (dx <= squareSize / 2) return true;
        if (dy <= squareSize / 2) return true;

        const cornerDistanceSq = Math.pow(dx - squareSize / 2, 2) + 
                                Math.pow(dy - squareSize / 2, 2);

        return cornerDistanceSq <= radius * radius;
    }
}

class SpatialIndex {
    constructor(worldSize = 1000) {
        this.root = new OctreeNode({ x: 0, y: 0 }, worldSize);
    }

    // Insert a point into the index
    insert(key, point) {
        if (!point.worldPos || typeof point.worldPos.x !== 'number' || typeof point.worldPos.y !== 'number') {
            console.error('[SpatialIndex] Invalid point data:', point);
            return false;
        }

        // Check for existing points at this position
        const nearby = this.findNearby(point.worldPos, 0.001); // Small radius for exact matches
        if (nearby.size > 0) {
            console.log('[SpatialIndex] Point already exists at position:', point.worldPos);
            return false;
        }

        this.root.insert(key, point);
        return true;
    }

    // Find points within radius of a position
    findNearby(position, radius) {
        return this.root.findNearby(position, radius);
    }

    // Get all points in the index (for debugging)
    getAllPoints() {
        const points = new Map();
        
        function collectPoints(node) {
            if (!node.children) {
                for (const [key, point] of node.points) {
                    points.set(key, point);
                }
                return;
            }
            
            for (const child of node.children) {
                collectPoints(child);
            }
        }
        
        collectPoints(this.root);
        return points;
    }
}

export default SpatialIndex;
