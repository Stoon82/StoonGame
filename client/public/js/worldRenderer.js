import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TriangleGrid } from '../../../shared/world/TriangleGrid';
import { GridTriangleRenderer } from './gridTriangleRenderer';

export class WorldRenderer {
    constructor(container) {
        console.log('Initializing WorldRenderer');
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue background
        container.appendChild(this.renderer.domElement);
        
        // Set up camera and controls
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Create lights
        this.setupLights();
        
        // Create ground
        this.setupGround();
        
        // Initialize grid and renderers
        this.grid = new TriangleGrid(10, 10);
        this.triangleMeshes = new Map();
        this.stoonieObjects = new Map();
        this.gridTriangleRenderer = new GridTriangleRenderer();
        
        // Bind animation
        this.animate = this.animate.bind(this);
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);
        
        // Hemisphere light
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);
    }
    
    setupGround() {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        this.scene.add(ground);
    }
    
    generateWorld(width = 10, height = 10) {
        console.log(`Generating world with dimensions ${width}x${height}...`);
        // Clear existing meshes
        this.triangleMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.triangleMeshes.clear();
        
        // Create new grid with specified dimensions
        this.grid = new TriangleGrid(width, height);
        
        // Create meshes for each triangle with random ground types
        const groundTypes = ['GRASS', 'WATER', 'SAND', 'ROCK'];
        
        for (let q = 0; q < width; q++) {
            for (let r = 0; r < height; r++) {
                const isUpward = (q + r) % 2 === 0;
                
                // Randomly assign ground types for testing
                const triangleGroundTypes = [
                    groundTypes[Math.floor(Math.random() * groundTypes.length)],  // Center
                    groundTypes[Math.floor(Math.random() * groundTypes.length)],  // Left arc
                    groundTypes[Math.floor(Math.random() * groundTypes.length)],  // Right arc
                    groundTypes[Math.floor(Math.random() * groundTypes.length)]   // Top/Bottom arc
                ];
                
                const mesh = this.gridTriangleRenderer.createTriangleMesh(
                    q, r, this.grid.size, isUpward, triangleGroundTypes
                );
                
                this.scene.add(mesh);
                this.triangleMeshes.set(this.grid.coordToKey(q, r), mesh);
            }
        }

        // Adjust camera to view the entire grid
        const gridExtent = Math.max(width, height);
        const cameraDistance = gridExtent * 1.5;
        this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
        this.camera.lookAt(width/2, 0, height/2);
        this.controls.target.set(width/2, 0, height/2);
        
        console.log('World generation complete');
    }
    
    updateStoonies(stoonies) {
        // Remove old Stoonie objects
        for (const [id, object] of this.stoonieObjects) {
            if (!stoonies.find(s => s.id === id)) {
                this.scene.remove(object);
                this.stoonieObjects.delete(id);
            }
        }

        // Update or create new Stoonie objects
        stoonies.forEach(stoonie => {
            let stoonieObject = this.stoonieObjects.get(stoonie.id);
            
            if (!stoonieObject) {
                // Create new Stoonie representation
                const geometry = new THREE.SphereGeometry(0.2, 32, 32);
                const material = new THREE.MeshStandardMaterial({
                    color: stoonie.gender === 'male' ? 0x3366cc : 0xcc3366
                });
                stoonieObject = new THREE.Mesh(geometry, material);
                this.scene.add(stoonieObject);
                this.stoonieObjects.set(stoonie.id, stoonieObject);
            }

            // Update position using grid coordinates
            const worldPos = this.grid.getWorldPosition(stoonie.position.q, stoonie.position.r);
            stoonieObject.position.set(worldPos.x, 0.2, worldPos.z); // Slightly above ground

            // Update appearance based on state
            const material = stoonieObject.material;
            material.color.setHex(stoonie.gender === 'male' ? 0x3366cc : 0xcc3366);
            
            // Scale based on age (baby to adult)
            const scale = Math.min(1, 0.3 + (stoonie.age / 20) * 0.7);
            stoonieObject.scale.set(scale, scale, scale);
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
