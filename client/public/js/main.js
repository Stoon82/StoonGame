import WorldRenderer from './worldRenderer.js';
import TriangleMapSystem from '@shared/world/TriangleMapSystem.js';
import { StoonieManager } from '@shared/entities/StoonieManager.js';

console.log('Initializing game...');

// Global debug flag
window.DEBUG_MODE = false;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCanvas.width = 200;
        this.previewCanvas.height = 200;
        this.stooniesList = document.getElementById('stooniesList');

        if (!this.canvas || !this.previewCanvas) {
            console.error('Canvas elements not found!');
            return;
        }

        // Initialize managers
        this.mapSystem = new TriangleMapSystem();
        this.renderer = new WorldRenderer(this.canvas, false, this.mapSystem);
        this.previewRenderer = new WorldRenderer(this.previewCanvas, true, this.mapSystem);
        this.stoonieManager = new StoonieManager(this.mapSystem);

        // Initialize UI state
        this.currentPreviewGroundTypes = this.generateRandomGroundTypes(); // [center, right, left, top/bottom]

        this.setupEventListeners();
        this.generateNewWorld();
        this.animate();

        // Debug mode toggle with Shift key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                window.DEBUG_MODE = true;
                console.log('[Debug] Debug mode enabled');
            } else if (e.key === ' ') { // Space key
                this.currentPreviewGroundTypes = this.generateRandomGroundTypes();
                console.log('[Game] Rerolled preview ground types:', this.currentPreviewGroundTypes);
                
                // Update both preview canvases
                this.previewRenderer.clear();
                this.previewRenderer.renderTriangle(0, 0, this.currentPreviewGroundTypes);
                
                // Update the hover preview if it exists
                const mousePos = this.renderer.getLastMousePosition();
                if (mousePos) {
                    this.handleMouseMove(mousePos.x, mousePos.y);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                window.DEBUG_MODE = false;
                console.log('[Debug] Debug mode disabled');
                // Clear any existing debug markers
                this.renderer.removePreviewMesh();
            }
        });
    }

    setupEventListeners() {
        // World generation
        document.getElementById('newWorldBtn').addEventListener('click', () => this.generateNewWorld());

        // Stoonie management
        document.getElementById('addStoonieBtn').addEventListener('click', () => this.addRandomStoonie());

        // Mouse interaction
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.renderer.handleMouseMove(x, y);
            this.handleMouseMove(x, y);
        });

        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.handleCanvasClick(event.clientX - rect.left, event.clientY - rect.top);
        });

        // Remove preview when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.renderer.removePreviewMesh();
        });
    }

    generateNewWorld() {
        console.log('[Game] Generating new world...');
        this.renderer.clear();
        this.mapSystem.clear();

        // Create initial hexagon with 6 triangles
        const initialTriangles = [
            { q: 0, r: 0 },      // Bottom-Center
            { q: -1, r: 0 },     // Bottom-Left
            { q: -1, r: 1 },     // Top-Left
            { q: 0, r: 1 },      // Top-Center
            { q: 1, r: 1 },      // Top-Right
            { q: 1, r: 0 }       // Bottom-Right
        ];

        console.log('[Game] Adding initial triangles...');
        initialTriangles.forEach(pos => {
            const groundTypes = this.generateRandomGroundTypes();
            const success = this.mapSystem.addTriangle(pos.q, pos.r, groundTypes);
            console.log(`[Game] Added triangle at (${pos.q}, ${pos.r}): ${success ? '✅' : '❌'}`);
            if (success) {
                this.renderer.renderTriangle(pos.q, pos.r, groundTypes);
            }
        });

        // Log final state
        console.log('[Game] Initial world generation complete');
        this.mapSystem.logMapState();

        // Generate new preview triangle
        this.generateNewPreviewTriangle();
    }

    generateRandomGroundTypes() {
        const types = ['GRASS', 'WATER', 'SAND', 'ROCK'];
        return [
            types[Math.floor(Math.random() * types.length)], // center
            types[Math.floor(Math.random() * types.length)], // right
            types[Math.floor(Math.random() * types.length)], // left
            types[Math.floor(Math.random() * types.length)]  // top/bottom
        ];
    }

    handleMouseMove(x, y) {
        const gridPos = this.renderer.getPreviewGridPosition(x, y);
        if (!gridPos) {
            this.renderer.removePreviewMesh();
            return;
        }

        // Update cursor debug info
        const debugElement = document.getElementById('cursorDebug');
        if (debugElement) {
            const cornerPositions = this.mapSystem.calculateCornerPositions(gridPos.q, gridPos.r);
            const isUpward = (gridPos.q + gridPos.r) % 2 === 0;
            
            let debugText = `Grid Pos: (${gridPos.q}, ${gridPos.r})\n`;
            debugText += `Is Upward: ${isUpward}\n`;
            debugText += `Ground Types: [${this.currentPreviewGroundTypes.join(', ')}]\n\n`;
            
            cornerPositions.forEach((pos, i) => {
                const key = this.mapSystem.worldToKey(pos.x, pos.z);
                const groundTypeIndex = this.mapSystem.getCornerGroundTypeIndex(i, isUpward);
                debugText += `Corner ${i}:\n`;
                debugText += `  World Pos: (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)})\n`;
                debugText += `  Key: ${key}\n`;
                debugText += `  Ground Type Index: ${groundTypeIndex}\n`;
                debugText += `  Ground Type: ${this.currentPreviewGroundTypes[groundTypeIndex]}\n`;
                
                const existing = this.mapSystem.cornerPoints.get(key);
                if (existing) {
                    debugText += `  Existing Types: [${existing.groundTypes.join(', ')}]\n`;
                } else {
                    debugText += `  No existing point\n`;
                }
                debugText += '\n';
            });
            
            debugElement.textContent = debugText;
        }

        // Update preview mesh
        this.renderer.showPreviewTriangle(gridPos.q, gridPos.r, this.currentPreviewGroundTypes);
    }

    handleCanvasClick(x, y) {
        const gridPos = this.renderer.getGridPosition(x, y);
        if (!gridPos) return;

        console.log('\n[Game] Attempting to add triangle at:', gridPos);
        console.log('Current Map State BEFORE adding:');
        this.mapSystem.logMapState();

        // Try to add the triangle
        if (this.mapSystem.addTriangle(gridPos.q, gridPos.r, this.currentPreviewGroundTypes)) {
            console.log('\n[Game] Successfully added triangle. New Map State:');
            this.mapSystem.logMapState();
            this.renderer.renderTriangle(gridPos.q, gridPos.r, this.currentPreviewGroundTypes);
            this.generateNewPreviewTriangle();
        } else {
            console.log('\n[Game] Failed to add triangle at:', gridPos);
        }
    }

    generateNewPreviewTriangle() {
        this.currentPreviewGroundTypes = this.generateRandomGroundTypes();
        this.previewRenderer.clear();
        this.previewRenderer.renderTriangle(0, 0, this.currentPreviewGroundTypes);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render();
        this.previewRenderer.render();
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new Game();
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});
