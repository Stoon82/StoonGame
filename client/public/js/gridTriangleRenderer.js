import * as THREE from 'three';

export class GridTriangleRenderer {
    constructor() {
        // Ground type colors
        this.groundTypeColors = {
            GRASS: 0x90EE90,    // Light green
            WATER: 0x4169E1,    // Royal blue
            SAND: 0xF4A460,     // Sandy brown
            ROCK: 0x808080      // Gray
        };

        // Cache for materials to avoid recreating them
        this.materialCache = new Map();
    }

    // Get or create material for a given color
    getMaterial(color) {
        if (!this.materialCache.has(color)) {
            const material = new THREE.MeshStandardMaterial({
                color: color,
                side: THREE.DoubleSide,
                roughness: 0.7,
                metalness: 0.2
            });
            this.materialCache.set(color, material);
        }
        return this.materialCache.get(color);
    }

    // Calculate triangle vertices based on position and orientation
    calculateTriangleGeometry(q, r, size, isUpward) {
        const h = size * Math.sqrt(3); // Height of equilateral triangle
        const baseX = q * size *1;  // Adjust X spacing for triangle grid
        const baseY = r * h;
        const ver_offset=h*1/6;
        let vertices;
        if (isUpward) {
            vertices = [
                { x: baseX - size, y: baseY - h/3 - ver_offset },     // Bottom left
                { x: baseX + size, y: baseY - h/3 - ver_offset },     // Bottom right
                { x: baseX, y: baseY + 2*h/3 - ver_offset }           // Top
            ];
        } else {
            vertices = [
                { x: baseX - size, y: baseY + h/3 + ver_offset },     // Top left
                { x: baseX + size, y: baseY + h/3 + ver_offset },     // Top right
                { x: baseX, y: baseY - 2*h/3 +ver_offset }           // Bottom
            ];
        }

        // Calculate arc parameters for each vertex
        const arcRadius = size;  // Arc radius equals triangle side length
        const arcStartAngles = isUpward ? [
            0*Math.PI / 6,     // Bottom left: 30 degrees
            4*Math.PI / 6,    // Bottom right: -90 degrees
            8* Math.PI / 6  // Top: 150 degrees
        ] : [
            10* Math.PI / 6,  // Top left: -150 degrees
           6*Math.PI / 6,      // Top right: -30 degrees
            2*Math.PI / 6        // Bottom: 90 degrees
        ];

        // Each arc covers 60 degrees (π/3 radians)
        const arcLength = Math.PI / 3;

        // Calculate arc center offsets from vertices
        // These offsets ensure the arcs are properly positioned to connect triangles
        const myoffset=2
        const arcOffsets = isUpward ? [
            { x: 0, y: 3*h/3-r*myoffset*h },       // Bottom left
            { x: 0, y: 3*h/3-r*myoffset*h },      // Bottom right
            { x: 0, y: -3*h/3-r*myoffset*h}             // Top
        ] : [
            { x: 0, y: -3*h/3-r*myoffset*h },        // Top left
            { x: 0, y:-3* h/3-r*myoffset*h },       // Top right
            { x: 0, y: 3*h/3 -r*myoffset*h}              // Bottom
        ];

        return { vertices, arcRadius, arcStartAngles, arcLength, arcOffsets };
    }

    // Create a triangle mesh with arcs
    createTriangleMesh(q, r, size, isUpward, groundTypes) {
        if (groundTypes.length !== 4) {
            throw new Error('Must provide exactly 4 ground types: [center, left, right, top/bottom]');
        }

        const geometry = this.calculateTriangleGeometry(q, r, size, isUpward);
        const group = new THREE.Group();

        // Create main triangle
        const triangleShape = new THREE.Shape();
        triangleShape.moveTo(geometry.vertices[0].x, geometry.vertices[0].y);
        triangleShape.lineTo(geometry.vertices[1].x, geometry.vertices[1].y);
        triangleShape.lineTo(geometry.vertices[2].x, geometry.vertices[2].y);
        triangleShape.lineTo(geometry.vertices[0].x, geometry.vertices[0].y);

        const triangleGeometry = new THREE.ShapeGeometry(triangleShape);
        const triangleMaterial = this.getMaterial(this.groundTypeColors[groundTypes[0]]);
        const triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);
        triangleMesh.rotation.x = -Math.PI / 2;
        triangleMesh.position.y = 0;
        group.add(triangleMesh);

        // Create arc segments at vertices
        geometry.vertices.forEach((vertex, index) => {
            const arcGeometry = new THREE.CircleGeometry(
                geometry.arcRadius,
                32,  // segments
                geometry.arcStartAngles[index],  // start angle
                geometry.arcLength  // arc length (60 degrees)
            );
            
            const arcMaterial = this.getMaterial(this.groundTypeColors[groundTypes[index + 1]]);
            const arc = new THREE.Mesh(arcGeometry, arcMaterial);
            
            // Position arc with offset to ensure proper connection
            const offset = geometry.arcOffsets[index];
            arc.position.set(
                vertex.x + offset.x,
                0.001,
                vertex.y + offset.y
            );
            arc.rotation.x = -Math.PI / 2;
            group.add(arc);
        });

        return group;
    }

    // Helper method to dispose of materials and geometries
    dispose() {
        this.materialCache.forEach(material => {
            material.dispose();
        });
        this.materialCache.clear();
    }
}
