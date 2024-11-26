import WorldRenderer from './worldRenderer.js';
import TriangleMapSystem from '@shared/world/TriangleMapSystem.js';
import { StoonieManager } from '@shared/entities/StoonieManager.js';
import { getRandomGroundType } from '@shared/world/groundTypes.js';

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
        this.currentCursorGroundType = getRandomGroundType();

        this.setupEventListeners();
        this.generateNewWorld();
        this.animate();

        // Debug mode toggle with Shift key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                window.DEBUG_MODE = true;
                document.getElementById('debugOverlay').classList.add('visible');
                console.log('[Debug] Debug mode enabled');
            } else if (e.key === ' ') { // Space key
                this.currentCursorGroundType = getRandomGroundType();
                console.log('[Game] Rerolled cursor ground type:', this.currentCursorGroundType);
                
                // Update both preview canvases
                this.previewRenderer.clear();
                this.previewRenderer.renderTriangle(0, 0, [this.currentCursorGroundType, this.currentCursorGroundType, this.currentCursorGroundType, this.currentCursorGroundType]);
                
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
                document.getElementById('debugOverlay').classList.remove('visible');
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
            { q: 0, r: 0 } ]; /*,      // Bottom-Center
            { q: -1, r: 0 },     // Bottom-Left
            { q: -1, r: 1 },     // Top-Left
            { q: 0, r: 1 },      // Top-Center
            { q: 1, r: 1 },      // Top-Right
            { q: 1, r: 0 }       // Bottom-Right
        ]; */

        console.log('[Game] Adding initial triangles...');
        initialTriangles.forEach(pos => {
            const groundType = getRandomGroundType();
            const success = this.mapSystem.addTriangle(pos.q, pos.r, groundType);
            console.log(`[Game] Added triangle at (${pos.q}, ${pos.r}): ${success ? '✅' : '❌'}`);
            if (success) {
                const groundTypes = this.mapSystem.getTriangleGroundTypes(pos.q, pos.r);
                this.renderer.renderTriangle(pos.q, pos.r, groundTypes);
            }
        });

        // Log final state
        console.log('[Game] Initial world generation complete');
        this.mapSystem.logMapState();
        this.mapSystem.updateDebugOverlay();  // Update debug overlay after world generation

        // Generate new preview triangle
        this.previewRenderer.clear();
        this.previewRenderer.renderTriangle(0, 0, [this.currentCursorGroundType, this.currentCursorGroundType, this.currentCursorGroundType, this.currentCursorGroundType]);
    }

    generateRandomGroundType() {
        return getRandomGroundType();
    }

    handleMouseMove(x, y) {
        const gridPos = this.renderer.getGridPosition(x, y);
        if (!gridPos) return;

        // Get preview ground types, ensuring no undefined values
        let previewGroundTypes = this.mapSystem.getTriangleGroundTypes(gridPos.q, gridPos.r) || 
            [null, null, null, null];
        
        // Replace any null/undefined values with current cursor ground type
        previewGroundTypes = previewGroundTypes.map(type => type || this.currentCursorGroundType);

        // Update preview mesh
        this.renderer.showPreviewTriangle(gridPos.q, gridPos.r, previewGroundTypes);

        // Update debug info
        if (window.DEBUG_MODE) {
            const debugElement = document.getElementById('cursorDebug');
            if (debugElement) {
                const cornerPositions = this.mapSystem.calculateCornerPositions(gridPos.q, gridPos.r);
                const isUpward = (gridPos.q + gridPos.r) % 2 === 0;
                
                let debugText = `Grid Pos: (${gridPos.q}, ${gridPos.r})\n`;
                debugText += `Is Upward: ${isUpward}\n`;
                debugText += `Ground Types: [${previewGroundTypes.join(', ')}]\n\n`;
                
                cornerPositions.forEach((pos, i) => {
                    const key = this.mapSystem.worldToKey(pos.x, pos.z);
                    debugText += `Corner ${i}:\n`;
                    debugText += `  World Pos: (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)})\n`;
                    debugText += `  Key: ${key}\n`;
                    
                    const existing = this.mapSystem.cornerPoints.get(key);
                    if (existing) {
                        debugText += `  Ground Type: ${existing.groundType}\n`;
                    } else {
                        debugText += `  No existing point\n`;
                    }
                    debugText += '\n';
                });
                
                debugElement.textContent = debugText;
            }
        }
    }

    getPreviewGroundTypes(q, r) {
        return this.mapSystem.getTriangleGroundTypes(q, r) || 
            [this.currentCursorGroundType, this.currentCursorGroundType, this.currentCursorGroundType, this.currentCursorGroundType];
    }

    handleCanvasClick(x, y) {
        const gridPos = this.renderer.getGridPosition(x, y);
        if (!gridPos) return;

        console.log('\n[Game] Attempting to add triangle at:', gridPos);

        // Generate a random ground type for this placement attempt
        const newGroundType = getRandomGroundType();
        console.log('[Game] Generated new ground type:', newGroundType);

        // Try to add the triangle with the new ground type
        const success = this.mapSystem.addTriangle(gridPos.q, gridPos.r, newGroundType);
        if (success) {
            console.log('\n[Game] Successfully added triangle');
            // Get the actual ground types from the map system
            const groundTypes = this.mapSystem.getTriangleGroundTypes(gridPos.q, gridPos.r);
            this.renderer.renderTriangle(gridPos.q, gridPos.r, groundTypes);
            this.mapSystem.updateDebugOverlay();
        } else {
            console.log('\n[Game] Failed to add triangle at:', gridPos);
        }
    }

    animate() {
        // Update Stoonies
        this.stoonieManager.update();
        this.updateStoonieStats();

        // Update renderer
        this.renderer.render();
        this.previewRenderer.render();

        requestAnimationFrame(() => this.animate());
    }

    updateStoonieStats() {
        if (!this.stooniesList) return;

        // Clear current list
        this.stooniesList.innerHTML = '';

        // Add stats for each Stoonie
        for (const stoonie of this.stoonieManager.stoonies.values()) {
            const stoonieDiv = document.createElement('div');
            stoonieDiv.className = `stoonie-stats ${stoonie.gender}`;
            
            // Basic info
            const ageInDays = stoonie.age.toFixed(1);
            const basicInfo = document.createElement('div');
            basicInfo.innerHTML = `
                <strong>Stoonie #${stoonie.id.slice(0, 4)}</strong> (${stoonie.gender})
                <br>Age: ${ageInDays} days
                <br>State: ${stoonie.state}
            `;
            stoonieDiv.appendChild(basicInfo);

            // Needs bars
            const needsDiv = document.createElement('div');
            needsDiv.style.marginTop = '5px';
            
            for (const [need, value] of Object.entries(stoonie.needs)) {
                const needBar = document.createElement('div');
                needBar.innerHTML = `
                    <small>${need}: ${Math.round(value)}%</small>
                    <div class="needs-bar">
                        <div class="needs-bar-fill" style="width: ${value}%; 
                            background: ${value < 20 ? '#ff4444' : '#4CAF50'}">
                        </div>
                    </div>
                `;
                needsDiv.appendChild(needBar);
            }
            stoonieDiv.appendChild(needsDiv);

            // Add pregnancy info if applicable
            if (stoonie.gender === 'female' && stoonie.pregnant) {
                const pregnancyInfo = document.createElement('div');
                pregnancyInfo.style.marginTop = '5px';
                pregnancyInfo.innerHTML = `
                    <small>Pregnancy: ${Math.round(stoonie.pregnancyProgress * 100)}%</small>
                    <div class="needs-bar">
                        <div class="needs-bar-fill" style="width: ${stoonie.pregnancyProgress * 100}%; 
                            background: #9c27b0">
                        </div>
                    </div>
                `;
                stoonieDiv.appendChild(pregnancyInfo);
            }

            this.stooniesList.appendChild(stoonieDiv);
        }
    }

    addRandomStoonie() {
        const stoonie = this.stoonieManager.createStoonie();
        if (stoonie) {
            console.log('[Game] Created new Stoonie:', stoonie);
            this.renderer.renderStoonie(stoonie);
        }
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
