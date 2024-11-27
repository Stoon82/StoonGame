export class EdgeElement {
    constructor(type, startPoint, endPoint) {
        this.id = crypto.randomUUID();
        this.type = type; // 'street' or 'river'
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.hasBridge = false;
    }
}

export class EdgeSystem {
    constructor() {
        this.edges = new Map(); // key: "x1,y1-x2,y2", value: EdgeElement
        this.bridges = new Map(); // key: "x,y" (corner point), value: { id, connects: ['edge1Id', 'edge2Id'] }
    }

    getEdgeKey(start, end) {
        // Ensure consistent key regardless of point order
        const [x1, y1] = start;
        const [x2, y2] = end;
        return x1 < x2 || (x1 === x2 && y1 < y2) 
            ? `${x1},${y1}-${x2},${y2}`
            : `${x2},${y2}-${x1},${y1}`;
    }

    getCornerKey(point) {
        return `${point[0]},${point[1]}`;
    }

    canPlaceEdgeElement(type, start, end) {
        const edgeKey = this.getEdgeKey(start, end);
        // Check if edge is already occupied
        if (this.edges.has(edgeKey)) {
            return false;
        }
        return true;
    }

    addEdgeElement(type, start, end) {
        if (!this.canPlaceEdgeElement(type, start, end)) {
            return null;
        }

        const edge = new EdgeElement(type, start, end);
        const edgeKey = this.getEdgeKey(start, end);
        this.edges.set(edgeKey, edge);
        return edge;
    }

    removeEdgeElement(start, end) {
        const edgeKey = this.getEdgeKey(start, end);
        return this.edges.delete(edgeKey);
    }

    getEdgeAtPoints(start, end) {
        const edgeKey = this.getEdgeKey(start, end);
        return this.edges.get(edgeKey);
    }

    canBuildBridge(point) {
        // Find all edges that connect to this point
        const connectingEdges = Array.from(this.edges.values()).filter(edge => 
            (edge.startPoint[0] === point[0] && edge.startPoint[1] === point[1]) ||
            (edge.endPoint[0] === point[0] && edge.endPoint[1] === point[1])
        );

        // Need at least one river and one street to build a bridge
        const hasRiver = connectingEdges.some(edge => edge.type === 'river');
        const hasStreet = connectingEdges.some(edge => edge.type === 'street');

        return hasRiver && hasStreet;
    }

    buildBridge(point) {
        if (!this.canBuildBridge(point)) {
            return null;
        }

        // Find connecting edges
        const connectingEdges = Array.from(this.edges.values()).filter(edge => 
            (edge.startPoint[0] === point[0] && edge.startPoint[1] === point[1]) ||
            (edge.endPoint[0] === point[0] && edge.endPoint[1] === point[1])
        );

        const bridge = {
            id: crypto.randomUUID(),
            position: point,
            connects: connectingEdges.map(edge => edge.id)
        };

        const cornerKey = this.getCornerKey(point);
        this.bridges.set(cornerKey, bridge);
        return bridge;
    }

    removeBridge(point) {
        const cornerKey = this.getCornerKey(point);
        return this.bridges.delete(cornerKey);
    }

    getBridgeAtPoint(point) {
        const cornerKey = this.getCornerKey(point);
        return this.bridges.get(cornerKey);
    }

    // Path validation methods
    canTraverse(start, end, isStreet = true) {
        const edge = this.getEdgeAtPoints(start, end);
        if (!edge) return false;

        if (isStreet) {
            // Streets can traverse if it's a street or if there's a bridge at either point
            return edge.type === 'street' || 
                   this.getBridgeAtPoint(start) || 
                   this.getBridgeAtPoint(end);
        } else {
            // Rivers can only traverse river edges
            return edge.type === 'river';
        }
    }

    getAllEdges() {
        return Array.from(this.edges.values());
    }

    getAllBridges() {
        return Array.from(this.bridges.values());
    }

    // For debugging and visualization
    getEdgeInfo(start, end) {
        const edge = this.getEdgeAtPoints(start, end);
        if (!edge) return null;

        return {
            type: edge.type,
            hasBridge: this.getBridgeAtPoint(start) || this.getBridgeAtPoint(end),
            id: edge.id
        };
    }
}

export default EdgeSystem;
