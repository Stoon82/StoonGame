import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GridTriangleRenderer from './gridTriangleRenderer.js';

class WorldRenderer {
    constructor(canvas, isPreview = false) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.gridRenderer = new GridTriangleRenderer();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isPreview = isPreview;
        this.previewMesh = null;
        this.stoonieMeshes = new Map(); // Store Stoonie meshes by ID
        
        this.setupScene();
        if (!isPreview) {
            this.setupControls();
        } else {
            // For preview, set up a static camera position
            this.camera.position.set(0, 3, 3);
            this.camera.lookAt(0, 0, 0);
        }
        this.setupEventListeners();
    }

    setupScene() {
        if (this.isPreview) {
            this.renderer.setSize(200, 200); // Fixed size for preview
        } else {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        this.camera.position.z = 5;
        this.camera.position.y = 5;
        this.camera.lookAt(0, 0, 0);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Add ground plane for raycasting
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            visible: false,
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.scene.add(this.ground);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2;
    }

    setupEventListeners() {
        if (!this.isPreview) {
            window.addEventListener('resize', () => this.onWindowResize(), false);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    clear() {
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
        this.stoonieMeshes.clear();
        this.setupScene();
    }

    renderTriangle(q, r, groundTypes) {
        const mesh = this.gridRenderer.createTriangleMesh(q, r, 1, this.isUpwardTriangle(q, r), groundTypes);
        this.scene.add(mesh);
    }

    isUpwardTriangle(q, r) {
        // Determine if a triangle at these coordinates should point upward
        return ((q + r) % 2 === 0);
    }

    render() {
        if (!this.isPreview) {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }

    getGridPosition(screenX, screenY) {
        // Convert screen coordinates to normalized device coordinates (-1 to +1)
        this.mouse.x = (screenX / this.renderer.domElement.width) * 2 - 1;
        this.mouse.y = -(screenY / this.renderer.domElement.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.ground);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            // Convert world coordinates to grid coordinates
            const size = 1; // Triangle size
            const h = size * Math.sqrt(3);
            const q = Math.round(point.x / size);
            const r = Math.round(-point.z / h);  // Invert the z coordinate for grid position
            return { q, r };
        }
        return null;
    }

    createPreviewMesh(q, r, groundTypes) {
        // Remove existing preview if any
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
        }

        // Create semi-transparent preview mesh
        const mesh = this.gridRenderer.createTriangleMesh(q, r, 1, this.isUpwardTriangle(q, r), groundTypes);
        mesh.traverse(child => {
            if (child instanceof THREE.Mesh) {
                const material = child.material.clone();
                material.transparent = true;
                material.opacity = 0.5;
                child.material = material;
            }
        });

        this.previewMesh = mesh;
        this.scene.add(mesh);
    }

    removePreviewMesh() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }

    renderStoonie(stoonie) {
        // Create a Stoonie mesh - a sphere for now
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: stoonie.gender === 'male' ? 0x4444ff : 0xff4444,
            emissive: stoonie.gender === 'male' ? 0x222266 : 0x662222,
            shininess: 30
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the Stoonie using world coordinates
        mesh.position.set(stoonie.worldX, 0.5, stoonie.worldZ);
        
        // Store the mesh
        this.stoonieMeshes.set(stoonie.id, mesh);
        this.scene.add(mesh);
        
        return mesh;
    }

    updateStoonie(stoonie) {
        const mesh = this.stoonieMeshes.get(stoonie.id);
        if (mesh) {
            mesh.position.set(stoonie.worldX, 0.5, stoonie.worldZ);
        }
    }

    removeStoonie(stoonieId) {
        const mesh = this.stoonieMeshes.get(stoonieId);
        if (mesh) {
            this.scene.remove(mesh);
            this.stoonieMeshes.delete(stoonieId);
        }
    }

    gridToWorld(q, r) {
        const size = 1; // Triangle size
        const h = size * Math.sqrt(3);
        const x = q * size;
        const z = r * h;
        return { x, z };
    }
}

export default WorldRenderer;
