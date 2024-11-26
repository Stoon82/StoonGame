import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WorldRenderer {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        // Add orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Set up camera
        this.camera.position.z = 5;
        this.camera.position.y = 3;
        this.camera.lookAt(0, 0, 0);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Add directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    renderWorld(grid) {
        // Clear existing triangles
        this.scene.children = this.scene.children.filter(child => 
            child instanceof THREE.Light || child instanceof THREE.GridHelper
        );

        // Create triangles
        grid.triangles.forEach((triangle, key) => {
            // Create triangle face
            const vertices = triangle.vertices;
            const geometry = new THREE.BufferGeometry();
            
            // Convert vertices to Three.js format
            const points = [];
            vertices.forEach(v => {
                points.push(v.x, 0, -v.y);
            });
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

            // Create material for triangle
            const material = new THREE.MeshPhongMaterial({ 
                color: triangle.isUpward ? 0xa0a0a0 : 0x808080,
                flatShading: true,
                side: THREE.DoubleSide
            });

            const triangleMesh = new THREE.Mesh(geometry, material);
            this.scene.add(triangleMesh);

            // Add circle arcs at vertices
            triangle.arcCenters.forEach((arc, index) => {
                let startAngle, endAngle;
                
                if (triangle.isUpward) {
                    switch(index) {
                        case 0: // Bottom left
                            startAngle = 2*Math.PI/6;     // 45°
                            endAngle = 0*Math.PI/6;       // 105°
                            break;
                        case 1: // Bottom right
                            startAngle = 4*Math.PI/6;     // 90°
                            endAngle = 6*Math.PI/6;     // 150°
                            break;
                        case 2: // Top
                            startAngle = 8*Math.PI/6;    // -30°
                            endAngle = 10*Math.PI/6;       // 30°
                            break;
                    }
                } else {
                    switch(index) {
                        case 0: // Top left
                            startAngle = -2*Math.PI/6;  // -150°
                            endAngle = 0*Math.PI/6;      // -90°
                            break;
                        case 1: // Top right
                            startAngle = 6*Math.PI/6;    // -90°
                            endAngle = 8*Math.PI/6;      // -30°
                            break;
                        case 2: // Bottom
                            startAngle = 2*Math.PI/6;   // 150°
                            endAngle = 4*Math.PI/6;     // 210°
                            break;
                    }
                }

                const arcGeometry = new THREE.CircleGeometry(
                    arc.radius,
                    32,
                    startAngle,
                    endAngle - startAngle
                );
                
                const arcMaterial = new THREE.MeshBasicMaterial({ 
                    color: triangle.data.arcColors[index],
                    side: THREE.DoubleSide
                });
                
                const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial);
                
                // Position arc at vertex with fixed rotation
                arcMesh.position.set(arc.x, 0.01, -arc.y);
                arcMesh.rotation.x = -Math.PI/2;
                
                this.scene.add(arcMesh);
            });
        });

        // Add a grid helper for reference
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
