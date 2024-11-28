import WorldRenderer from './worldRenderer.js';
import TriangleMapSystem from '@shared/world/TriangleMapSystem.js';
import { StoonieManager } from '@shared/entities/StoonieManager.js';
import { getRandomGroundType } from '@shared/world/groundTypes.js';
import { GROUND_TYPES } from '@shared/config/groundTypes.js';
import { io } from 'socket.io-client';
import EdgeSystem from '@shared/world/edgeSystem.js';
import EdgeUI from './edgeUI.js';
import { debugManager } from './modules/debug/debugManager.js';
import GameManager from './modules/core/gameManager.js';

console.log('Initializing game...');

// Global debug flag
window.DEBUG_MODE = false;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        if (!this.canvas || !this.previewCanvas) {
            console.error('Canvas elements not found!');
            return;
        }

        // Initialize systems first
        this.mapSystem = new TriangleMapSystem();
        this.stoonieManager = new StoonieManager(this.mapSystem);
        this.renderer = new WorldRenderer(this.canvas, false, this.mapSystem);
        this.previewRenderer = new WorldRenderer(this.previewCanvas, true, this.mapSystem);

        // Set initial canvas sizes
        this.resizeCanvas();
        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize debug UI
        this.debugMode = false;
        
        // Handle debug mode toggle with shift key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.debugMode = true;
                debugManager.show();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.debugMode = false;
                debugManager.hide();
            }
        });

        // Initialize socket connection
        this.gameManager = new GameManager();
        this.currentCursorGroundType = getRandomGroundType();
        this.initUI();
        this.setupGameControls();
        this.setupSocketHandlers();
        this.startRenderLoop();

        // Initialize edge system
        this.edgeSystem = new EdgeSystem();
        this.edgeUI = new EdgeUI(this.edgeSystem, this.mapSystem);

        // Initialize UI state
        this.lastUpdateTime = performance.now() / 1000;

        this.setupEventListeners();
        this.generateNewWorld();
    }

    setupSocketHandlers() {
        this.gameManager.socket.on('connect', () => {
            console.log('[Client] Connected to server');
            debugManager.updateServerStatus('Connected');
        });

        this.gameManager.socket.on('disconnect', () => {
            console.log('[Client] Disconnected from server');
            debugManager.updateServerStatus('Disconnected');
        });

        this.gameManager.socket.on('error', (error) => {
            console.error('[Client] Socket error:', error);
            debugManager.updateServerStatus('Error: ' + error.message);
        });

        // Handle initial world data
        this.gameManager.socket.on('worldData', (data) => {
            console.log('[Client] Received world data:', data);
            if (data && data.mapData) {
                // Clear existing map data first
                this.mapSystem.clear();
                
                // Update world stats in debug UI
                debugManager.updateWorldStats(data.mapData);

                // Update center points
                if (data.mapData.centerPoints) {
                    Object.entries(data.mapData.centerPoints).forEach(([key, point]) => {
                        console.log('[Client] Adding center point:', point);
                        this.mapSystem.addCenterPoint({
                            data: {
                                worldPos: point.worldPos,
                                gridPos: point.gridPos,
                                groundType: point.groundType
                            }
                        });
                    });
                }
                
                // Update corner points
                if (data.mapData.cornerPoints) {
                    Object.entries(data.mapData.cornerPoints).forEach(([key, point]) => {
                        console.log('[Client] Adding corner point:', point);
                        this.mapSystem.addCornerPoint({
                            data: {
                                worldPos: point.worldPos,
                                gridPos: point.gridPos,
                                groundType: point.groundType
                            }
                        });
                    });
                }

                // Force a render after loading all points
                if (this.renderer) {
                    console.log('[Client] Rendering updated map');
                    this.renderer.render();
                }
            }
        });
    }

    startRenderLoop() {
        let lastTime = performance.now();
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
            lastTime = currentTime;

            // Update game state
            this.stoonieManager.update(deltaTime);
            this.updateStoonieStats();

            // Update FPS in debug UI if debug mode is active
            if (this.debugMode) {
                debugManager.updateFPS(1000 / deltaTime);
            }

            // Update Stoonie positions and render
            if (this.renderer) {
                this.renderer.updateStooniePositions(this.stoonieManager.stoonies, deltaTime);
                this.renderer.render();
            }

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    resizeCanvas() {
        // Set canvas size to match window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) {
            this.renderer.updateSize();
            this.renderer.render();
        }
    }

    joinRoom(mapId) {
        this.gameManager.socket.emit('joinRoom', { mapId });
        console.log(`[Client] Joining room: ${mapId}`);
    }

    setupEventListeners() {
        // World generation
        document.getElementById('newWorldBtn').addEventListener('click', () => this.gameManager.socket.emit('generateNewWorld'));

        // Stoonie management
        document.getElementById('addStoonieBtn').addEventListener('click', () => this.gameManager.socket.emit('addStoonie'));

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
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.handleCanvasClick(x, y);
        });

        // Remove preview when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.renderer.removePreviewMesh();
        });
    }

    initUI() {
        // Initialize UI elements
        const groundTypeSelect = document.getElementById('groundTypeSelect');
        if (groundTypeSelect) {
            Object.entries(GROUND_TYPES).forEach(([key, value]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value.name;
                groundTypeSelect.appendChild(option);
            });
        }
    }

    setupGameControls() {
        // World generation
        const newWorldBtn = document.getElementById('newWorldBtn');
        if (newWorldBtn) {
            newWorldBtn.addEventListener('click', () => {
                this.gameManager.socket.emit('generateNewWorld');
            });
        }

        // Stoonie management
        const addStoonieBtn = document.getElementById('addStoonieBtn');
        if (addStoonieBtn) {
            addStoonieBtn.addEventListener('click', () => {
                this.gameManager.socket.emit('addStoonie');
            });
        }

        // Ground type selection
        const groundTypeSelect = document.getElementById('groundTypeSelect');
        if (groundTypeSelect) {
            groundTypeSelect.addEventListener('change', (event) => {
                this.currentCursorGroundType = event.target.value;
                this.gameManager.setGroundType(event.target.value);
            });
        }
    }

    handleCanvasClick(x, y) {
        const worldPos = this.screenToWorld(x, y);
        if (!worldPos) return;

        // Handle edge system clicks
        if (this.edgeUI.handleClick(worldPos)) {
            // Edge action was handled
            return;
        }

        console.log('\n[Game] Attempting to add triangle at:', worldPos);

        // Generate a random ground type for this placement attempt
        const newGroundType = getRandomGroundType();
        console.log('[Game] Generated new ground type:', newGroundType);

        // Try to add the triangle with the new ground type
        const success = this.mapSystem.addTriangle(worldPos.q, worldPos.r, newGroundType);
        if (success) {
            console.log('\n[Game] Successfully added triangle');
            // Get the actual ground types from the map system
            const groundTypes = this.mapSystem.getTriangleGroundTypes(worldPos.q, worldPos.r);
            this.renderer.renderTriangle(worldPos.q, worldPos.r, groundTypes);
            this.mapSystem.updateDebugOverlay();
            
            // Send triangle data to server
            this.gameManager.socket.emit('updateMap', {
                type: 'triangle',
                data: {
                    q: worldPos.q,
                    r: worldPos.r,
                    groundType: newGroundType
                },
                timestamp: Date.now()
            });
        } else {
            console.log('\n[Game] Failed to add triangle at:', worldPos);
        }
    }

    screenToWorld(x, y) {
        // TO DO: implement screenToWorld logic
        // For now, just return the grid position
        return this.renderer.getGridPosition(x, y);
    }

    generateNewWorld() {
        console.log('[Game] Generating new world...');
        this.mapSystem.clear();

        const initialTriangles = [
            { q: 0, r: 0 } ];

        console.log('[Game] Adding initial triangles...');
        initialTriangles.forEach(pos => {
            const groundType = getRandomGroundType();
            const centerPoint = {
                worldPos: { x: 0, y: 0, z: 0 },
                gridPos: { q: pos.q, r: pos.r },
                groundType: groundType
            };

            // Default corner points for the first triangle
            const cornerPoints = [
                {
                    worldPos: { x: -1, y: 0, z: 0 },
                    gridPos: { q: pos.q-1, r: pos.r },
                    groundType: groundType
                },
                {
                    worldPos: { x: 1, y: 0, z: 0 },
                    gridPos: { q: pos.q+1, r: pos.r },
                    groundType: groundType
                },
                {
                    worldPos: { x: 0, y: 0, z: 1 },
                    gridPos: { q: pos.q, r: pos.r+1 },
                    groundType: groundType
                }
            ];

            // Send center point and corner points to server
            this.gameManager.socket.emit('updateMap', {
                type: 'centerPoint',
                data: centerPoint,
                timestamp: Date.now()
            });

            cornerPoints.forEach(point => {
                this.gameManager.socket.emit('updateMap', {
                    type: 'cornerPoint',
                    data: point,
                    timestamp: Date.now()
                });
            });

            const success = this.mapSystem.addTriangle(pos.q, pos.r, groundType);
            console.log(`[Game] Added triangle at (${pos.q}, ${pos.r}): ${success ? '✅' : '❌'}`);
            if (success) {
                const groundTypes = [groundType, groundType, groundType, groundType];
                this.renderer.renderTriangle(pos.q, pos.r, groundTypes);
            }
        });

        // Log final state
        console.log('[Game] Initial world generation complete');
        this.mapSystem.logMapState();
        this.mapSystem.updateDebugOverlay();  

        // Generate new preview triangle
        if (this.previewRenderer) {
            this.previewRenderer.clear();
            const previewGroundTypes = [
                this.currentCursorGroundType,
                this.currentCursorGroundType,
                this.currentCursorGroundType,
                this.currentCursorGroundType
            ];
            this.previewRenderer.renderTriangle(0, 0, previewGroundTypes);
        }
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

    animate() {
        const currentTime = performance.now() / 1000;
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Update Stoonies
        this.stoonieManager.update(deltaTime);
        this.updateStoonieStats();

        // Update renderer
        this.renderer.updateStooniePositions(this.stoonieManager.stoonies, deltaTime);
        this.renderer.render();
        if (this.previewRenderer) {
            this.previewRenderer.render();
        }

        // Render edges
        const edges = this.edgeSystem.getAllEdges();
        edges.forEach(edge => {
            const color = edge.type === 'street' ? '#8B4513' : '#4169E1';
            this.renderer.drawLine(edge.startPoint, edge.endPoint, color);
        });

        // Render bridges
        const bridges = this.edgeSystem.getAllBridges();
        bridges.forEach(bridge => {
            this.renderer.drawCircle(bridge.position, 5, '#FFD700');
        });

        // Render edge preview
        const preview = this.edgeUI.getPreviewData();
        if (preview) {
            const previewColor = preview.type === 'street' ? 'rgba(139, 69, 19, 0.5)' : 'rgba(65, 105, 225, 0.5)';
            const mousePos = this.renderer.getLastMousePosition();
            if (mousePos) {
                this.renderer.drawLine(preview.start, mousePos, previewColor);
            }
        }

        requestAnimationFrame(() => this.animate());
    }

    getGroundTypeColor(groundType) {
        if (!groundType) return '#ff0000';  
        
        const groundTypeColors = {
            [GROUND_TYPES.GRASS.id]: '#90EE90',  
            [GROUND_TYPES.WATER.id]: '#4169E1',  
            [GROUND_TYPES.SAND.id]: '#F4A460',   
            [GROUND_TYPES.ROCK.id]: '#808080',   
            [GROUND_TYPES.WOODS.id]: '#006400',
            'unknown': '#ff0000'
        };
        
        return groundTypeColors[groundType.toLowerCase()] || groundTypeColors.unknown;
    }

    getGroundTypeStatus(groundType, speedModifier) {
        if (!groundType) {
            return {
                text: 'NO GROUND DETECTED',
                color: '#ff0000',
                speedText: 'UNSAFE',
                warning: true
            };
        }

        const speedText = speedModifier === 0 ? 'Cannot move' : 
                         speedModifier < 1.0 ? 'Slow' :
                         speedModifier > 1.0 ? 'Fast' : 'Normal';

        return {
            text: groundType.toUpperCase(),
            color: this.getGroundTypeColor(groundType),
            speedText: speedText,
            warning: groundType === 'water' || groundType === 'unknown'
        };
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

            // Get ground type info and speed modifier
            const groundType = stoonie.currentGroundType;
            const speedModifier = stoonie.groundSpeedModifiers[groundType?.toLowerCase()] || 0;
            const groundStatus = this.getGroundTypeStatus(groundType, speedModifier);

            // Create ground type display with warning indicator if needed
            const groundDisplay = groundStatus.warning ? 
                `<div class="ground-warning">
                    <span style="color: ${groundStatus.color}">${groundStatus.text}</span>
                    <span class="warning-icon">⚠️</span>
                </div>` :
                `<span style="color: ${groundStatus.color}">${groundStatus.text}</span>`;

            basicInfo.innerHTML = `
                <strong>Stoonie #${stoonie.id.slice(0, 4)}</strong> (${stoonie.gender})
                <br>Age: ${ageInDays} days
                <br>State: ${stoonie.state}
                <br>Ground: ${groundDisplay}
                <br>Movement: ${groundStatus.speedText} (${(stoonie.speed || stoonie.baseSpeed).toFixed(1)})
            `;
            stoonieDiv.appendChild(basicInfo);

            // Add CSS for warning display
            const style = document.createElement('style');
            style.textContent = `
                .ground-warning {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .warning-icon {
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);

            // Movement info
            if (stoonie.moveProgress < 1) {
                const movementInfo = document.createElement('div');
                movementInfo.style.marginTop = '5px';
                movementInfo.innerHTML = `
                    <small>Movement Progress</small>
                    <div class="needs-bar">
                        <div class="needs-bar-fill" style="width: ${stoonie.moveProgress * 100}%; 
                            background: ${groundStatus.warning ? '#ff4444' : '#2196F3'}">
                        </div>
                    </div>
                `;
                stoonieDiv.appendChild(movementInfo);
            }

            // Needs bars with warning colors
            const needsDiv = document.createElement('div');
            needsDiv.style.marginTop = '5px';
            
            for (const [need, value] of Object.entries(stoonie.needs)) {
                const needBar = document.createElement('div');
                const needColor = value < 20 ? '#ff4444' :  
                                value < 40 ? '#ff8c00' :  
                                '#4CAF50';               
                needBar.innerHTML = `
                    <small>${need}: ${Math.round(value)}%</small>
                    <div class="needs-bar">
                        <div class="needs-bar-fill" style="width: ${value}%; 
                            background: ${needColor}">
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
        // Find a valid ground position
        const validGroundTypes = ['grass', 'sand', 'woods'];
        let validPosition = null;

        // Search through the map for a valid position
        for (const [key, point] of this.mapSystem.centerPoints) {
            if (validGroundTypes.includes(point.groundType?.toLowerCase())) {
                validPosition = point.worldPos;
                break;
            }
        }

        if (!validPosition) {
            console.warn('No valid position found for new Stoonie');
            return;
        }

        // Create a new Stoonie at the valid position
        const stoonie = this.stoonieManager.createStoonie({
            worldX: validPosition.x,
            worldZ: validPosition.z,
            gender: Math.random() > 0.5 ? 'male' : 'female'
        });

        if (stoonie) {
            console.log('Created new Stoonie:', stoonie);
            // Dispatch event for renderer
            window.dispatchEvent(new CustomEvent('stoonieCreated', { 
                detail: stoonie 
            }));
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
