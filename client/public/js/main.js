import WorldRenderer from './worldRenderer.js';
import TriangleGrid from '../../../shared/world/TriangleGrid.js';

console.log('Initializing game...');

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewCanvas.width = 200;
        this.previewCanvas.height = 200;

        if (!this.canvas || !this.previewCanvas) {
            console.error('Canvas elements not found!');
            return;
        }

        // Initialize renderers
        this.renderer = new WorldRenderer(this.canvas);
        this.previewRenderer = new WorldRenderer(this.previewCanvas, true);
        this.grid = new TriangleGrid();
        
        // Set up controls
        this.setupControls();
        
        // Generate initial world
        this.generateNewWorld();
        
        // Start animation loop
        this.animate();
    }

    setupControls() {
        const newWorldBtn = document.getElementById('newWorldBtn');
        if (newWorldBtn) {
            newWorldBtn.addEventListener('click', () => this.generateNewWorld());
        }

        // Setup click handler for placing triangles
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.handleCanvasClick(x, y);
        });

        // Setup mousemove handler for preview
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.handleMouseMove(x, y);
        });

        // Remove preview when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.renderer.removePreviewMesh();
        });
    }

    generateNewWorld() {
        console.log('Generating new world...');
        this.renderer.clear();
        this.grid.clear();
        
        // Create initial hexagon with 6 triangles
        const initialTriangles = [
            { q: 0, r: 0 },      // Bottom-Center
            { q: -1, r: 0 },     // Bottom-Left
            { q: -1, r: 1 },     // Top-Left
            { q: 0, r: 1 },      // Top-Center
            { q: 1, r: 1 },      // Top-Right
            { q: 1, r: 0 }       // Bottom-Right
        ];

        initialTriangles.forEach(pos => {
            const groundTypes = this.generateRandomGroundTypes();
            this.renderer.renderTriangle(pos.q, pos.r, groundTypes);
            this.grid.addTriangle(pos.q, pos.r, { groundTypes });
        });

        // Generate new preview triangle
        this.generateNewPreviewTriangle();
    }

    generateRandomGroundTypes() {
        const types = ['GRASS', 'WATER', 'SAND', 'ROCK'];
        return [
            types[Math.floor(Math.random() * types.length)], // Center
            types[Math.floor(Math.random() * types.length)], // Left arc
            types[Math.floor(Math.random() * types.length)], // Right arc
            types[Math.floor(Math.random() * types.length)]  // Top/Bottom arc
        ];
    }

    generateNewPreviewTriangle() {
        const groundTypes = this.generateRandomGroundTypes();
        
        // Clear previous preview
        this.previewRenderer.clear();
        
        // Render preview triangle at center of preview canvas
        this.previewRenderer.renderTriangle(0, 0, groundTypes);
        
        // Store current preview ground types
        this.currentPreviewGroundTypes = groundTypes;
    }

    isPositionInRange(q, r) {
        const gridRange = 1; // Only check immediate neighbors
        const nearbyTriangles = this.grid.getTrianglesInRange(q, r, gridRange);
        return nearbyTriangles.length > 0;
    }

    handleCanvasClick(x, y) {
        const gridPos = this.renderer.getGridPosition(x, y);
        if (!gridPos) return;

        // Check if the position already has a triangle
        if (this.grid.hasTriangle(gridPos.q, gridPos.r)) {
            console.log(`Position ${gridPos.q},${gridPos.r} already occupied`);
            return;
        }

        // Check if we're close enough to an existing triangle
        if (!this.isPositionInRange(gridPos.q, gridPos.r)) {
            console.log(`Position ${gridPos.q},${gridPos.r} not in range of existing triangles`);
            return;
        }

        console.log(`Placing triangle at ${gridPos.q},${gridPos.r}`);

        // Place the triangle
        this.renderer.renderTriangle(gridPos.q, gridPos.r, this.currentPreviewGroundTypes);
        this.grid.addTriangle(gridPos.q, gridPos.r, { groundTypes: this.currentPreviewGroundTypes });

        // Generate new preview triangle
        this.generateNewPreviewTriangle();
    }

    handleMouseMove(x, y) {
        const gridPos = this.renderer.getGridPosition(x, y);
        if (!gridPos) {
            this.renderer.removePreviewMesh();
            return;
        }

        // Check if position is valid for placement
        if (this.grid.hasTriangle(gridPos.q, gridPos.r)) {
            this.renderer.removePreviewMesh();
            return;
        }

        // Show preview if we're close enough to an existing triangle
        if (this.isPositionInRange(gridPos.q, gridPos.r)) {
            this.renderer.createPreviewMesh(gridPos.q, gridPos.r, this.currentPreviewGroundTypes);
        } else {
            this.renderer.removePreviewMesh();
        }
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
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
