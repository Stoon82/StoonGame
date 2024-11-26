import * as THREE from 'three';

class DebugRenderer {
    constructor(scene) {
        this.scene = scene;
        this.debugObjects = new THREE.Group();
        this.scene.add(this.debugObjects);

        // Materials for different states
        this.materials = {
            matching: new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.7
            }), // Green for matching arcs
            mismatching: new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.7
            }), // Red for mismatching arcs
        };

        // Geometry for arc indicators
        this.indicatorGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 12, Math.PI); // Half-circle indicator
    }

    clear() {
        while(this.debugObjects.children.length > 0) {
            const object = this.debugObjects.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
            this.debugObjects.remove(object);
        }
    }

    // Create an arc indicator at a specific world position
    createArcIndicator(position, rotation, matches) {
        const indicator = new THREE.Mesh(
            this.indicatorGeometry,
            this.materials[matches ? 'matching' : 'mismatching']
        );
        indicator.position.set(position.x, 0.1, position.z);
        indicator.rotation.set(0, rotation, 0);
        this.debugObjects.add(indicator);
        return indicator;
    }

    // Show corner matching test with arc indicators
    showCornerTest(triangle1, corner1, triangle2, corner2, matches) {
        this.clear();

        // Get arc positions and rotations for both triangles
        const arc1 = this.getArcPosition(triangle1, corner1);
        const arc2 = this.getArcPosition(triangle2, corner2);

        // Create arc indicators
        if (arc1) this.createArcIndicator(arc1.position, arc1.rotation, matches);
        if (arc2) this.createArcIndicator(arc2.position, arc2.rotation, matches);
    }

    // Get arc position and rotation for a triangle corner
    getArcPosition(triangle, cornerIndex) {
        const size = 1; // Base size of triangles
        const h = size * Math.sqrt(3) / 2;
        const isUpward = (triangle.q + triangle.r) % 2 === 0;
        
        // Base position
        const baseX = triangle.q * (size * 0.75);
        const baseZ = triangle.r * h;
        
        // Arc positions and rotations based on orientation and corner index
        let arcPosition = { x: 0, z: 0 };
        let rotation = 0;

        if (isUpward) {
            switch(cornerIndex) {
                case 0: // Top
                    arcPosition = { 
                        x: baseX, 
                        z: baseZ + h/2 
                    };
                    rotation = Math.PI;
                    break;
                case 1: // Bottom-Left
                    arcPosition = { 
                        x: baseX - size/4, 
                        z: baseZ - h/4 
                    };
                    rotation = Math.PI * 4/3;
                    break;
                case 2: // Bottom-Right
                    arcPosition = { 
                        x: baseX + size/4, 
                        z: baseZ - h/4 
                    };
                    rotation = Math.PI * 5/3;
                    break;
            }
        } else {
            switch(cornerIndex) {
                case 0: // Bottom
                    arcPosition = { 
                        x: baseX, 
                        z: baseZ - h/2 
                    };
                    rotation = 0;
                    break;
                case 1: // Top-Left
                    arcPosition = { 
                        x: baseX - size/4, 
                        z: baseZ + h/4 
                    };
                    rotation = Math.PI * 2/3;
                    break;
                case 2: // Top-Right
                    arcPosition = { 
                        x: baseX + size/4, 
                        z: baseZ + h/4 
                    };
                    rotation = Math.PI * 1/3;
                    break;
            }
        }

        return {
            position: arcPosition,
            rotation: rotation
        };
    }
}

export default DebugRenderer;
