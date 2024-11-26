import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GridTriangleRenderer from './gridTriangleRenderer.js';

class WorldRenderer {
    constructor(canvas, isPreview = false, mapSystem = null) {
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
        this.size = 1;
        this.lastMousePosition = null;
        this.mapSystem = mapSystem;
        
        // Initialize debug markers group
        this.debugMarkers = new THREE.Group();
        this.scene.add(this.debugMarkers);
        this.debugMarkersTimeout = null;
        
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
            this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event.clientX, event.clientY), false);
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

    getPreviewGridPosition(x, y) {
        return this.getGridPosition(x, y);
    }

    // Create semi-transparent preview mesh with optional red border for invalid placement
    createPreviewMesh(q, r, groundTypes, isInvalid = false, validationResults = null) {
        console.log('[WorldRenderer] Creating preview mesh with debug mode:', window.DEBUG_MODE);
        
        // Remove existing preview mesh but keep debug markers
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh = null;
        }

        // Create semi-transparent preview mesh
        const mesh = this.gridRenderer.createTriangleMesh(q, r, 1, this.isUpwardTriangle(q, r), groundTypes);
        
        mesh.traverse(child => {
            if (child instanceof THREE.Mesh) {
                const material = child.material.clone();
                material.transparent = true;
                material.opacity = 0.5;

                if (isInvalid) {
                    material.emissive = new THREE.Color(0xff0000);
                    material.emissiveIntensity = 0.8;
                    material.emissiveMap = null;
                }

                child.material = material;
            }
        });

        this.previewMesh = mesh;
        this.scene.add(mesh);

        // Add or update debug markers if debug mode is enabled
        if (window.DEBUG_MODE) {
            console.log('[WorldRenderer] Debug mode active, adding markers');
            
            // Clear existing markers
            this.clearDebugMarkers();

            // Add test marker at preview mesh position
            const centerMarker = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 2, 0.5),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            // Use mesh position for center marker
            if (mesh.position) {
                centerMarker.position.copy(mesh.position);
                centerMarker.position.y = 1; // Set height to 1
                this.debugMarkers.add(centerMarker);
                console.log(`[WorldRenderer] Added center marker at`, centerMarker.position);
            }
            
            if (validationResults && validationResults.corners) {
                console.log('[WorldRenderer] Adding corner markers:', validationResults.corners);
                
                validationResults.corners.forEach((corner, index) => {
                    // Create marker box (using box instead of sphere for better visibility)
                    const markerGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
                    const markerMaterial = new THREE.MeshBasicMaterial({
                        color: corner.valid ? 0x00ff00 : 0xff0000,
                        transparent: false // Make fully opaque
                    });
                    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                    marker.position.set(corner.x, 1, corner.z);
                    this.debugMarkers.add(marker);
                    console.log(`[WorldRenderer] Added corner marker ${index} at (${corner.x}, 1, ${corner.z})`);

                    // Create text label
                    if (corner.existing) {
                        const text = `Corner ${index}\nCurrent: ${corner.existing.join(',')}\nNew: ${corner.groundType}`;
                        const sprite = this.createTextSprite(text, corner.valid ? '#00ff00' : '#ff0000');
                        sprite.position.set(corner.x, 2.5, corner.z);
                        this.debugMarkers.add(sprite);
                    }
                });
            }

            // Clear any existing timeout
            if (this.debugMarkersTimeout) {
                clearTimeout(this.debugMarkersTimeout);
            }

            // Set timeout to clear markers after 10 seconds
            this.debugMarkersTimeout = setTimeout(() => {
                console.log('[WorldRenderer] Clearing debug markers after timeout');
                this.clearDebugMarkers();
            }, 10000);
        }
    }

    clearDebugMarkers() {
        console.log('[WorldRenderer] Clearing debug markers, count:', this.debugMarkers.children.length);
        while(this.debugMarkers.children.length > 0) {
            const child = this.debugMarkers.children[0];
            if (child.material) {
                child.material.dispose();
            }
            if (child.geometry) {
                child.geometry.dispose();
            }
            this.debugMarkers.remove(child);
        }
    }

    removePreviewMesh() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }

    // Helper method to create text sprites for debug info
    createTextSprite(message, color = '#ffffff') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set up canvas
        const fontSize = 24;
        context.font = `${fontSize}px Arial`;
        
        // Calculate text dimensions
        const lines = message.split('\n');
        const lineHeight = fontSize * 1.2;
        const width = Math.max(...lines.map(line => context.measureText(line).width)) + 20;
        const height = lineHeight * lines.length + 20;
        
        // Resize canvas
        canvas.width = width;
        canvas.height = height;
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, width, height);
        
        // Draw text
        context.font = `${fontSize}px Arial`;
        context.fillStyle = color;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        lines.forEach((line, i) => {
            context.fillText(line, 10, 10 + i * lineHeight);
        });
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        const scale = 0.01;
        sprite.scale.set(width * scale, height * scale, 1);
        
        return sprite;
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

    getLastMousePosition() {
        return this.lastMousePosition;
    }

    handleMouseMove(x, y) {
        this.lastMousePosition = { x, y };
    }

    showPreviewTriangle(q, r, groundTypes) {
        // Check if position is valid for placement
        const validationResults = this.mapSystem.canAddTriangle(q, r, groundTypes);
        
        this.createPreviewMesh(
            q, 
            r, 
            groundTypes, 
            !validationResults.valid,
            validationResults
        );
    }
}

export default WorldRenderer;
