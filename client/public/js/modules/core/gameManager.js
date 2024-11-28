import WorldRenderer from '../../worldRenderer.js';
import TriangleMapSystem from '@shared/world/TriangleMapSystem.js';
import { StoonieManager } from '@shared/entities/StoonieManager.js';
import BuildingSystem from '../../buildingSystem.js';
import EdgeSystem from '@shared/world/edgeSystem.js';
import EdgeUI from '../../edgeUI.js';
import { debugManager } from '../debug/debugManager.js';
import { io } from 'socket.io-client';

class GameManager {
    constructor() {
        this.initializeCanvas();
        this.initializeSystems();
        this.setupDebugMode();
        this.setupSocketConnection();
        this.setupEventListeners();
        this.startRenderLoop();
        this.currentGroundType = null;
    }

    initializeCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        if (!this.canvas || !this.previewCanvas) {
            throw new Error('Canvas elements not found!');
        }
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    initializeSystems() {
        this.mapSystem = new TriangleMapSystem();
        this.stoonieManager = new StoonieManager(this.mapSystem);
        this.renderer = new WorldRenderer(this.canvas, false, this.mapSystem);
        this.previewRenderer = new WorldRenderer(this.previewCanvas, true, this.mapSystem);
        this.buildingSystem = new BuildingSystem(this.mapSystem, this.renderer);
        this.edgeSystem = new EdgeSystem();
        this.edgeUI = new EdgeUI(this.edgeSystem, this.mapSystem);
        this.lastUpdateTime = performance.now() / 1000;

        // Initialize debug overlay
        this.debugOverlay = document.getElementById('debugOverlay');
        if (!this.debugOverlay) {
            this.debugOverlay = document.createElement('div');
            this.debugOverlay.id = 'debugOverlay';
            document.body.appendChild(this.debugOverlay);
        }
    }

    setupDebugMode() {
        this.debugMode = false;
        
        // Initialize debug panel if not already done
        if (!document.getElementById('debugPanel')) {
            const debugPanel = document.createElement('div');
            debugPanel.id = 'debugPanel';
            debugPanel.innerHTML = `
                <div id="serverStatus">Server Status: Disconnected</div>
                <div id="latency">Latency: --ms</div>
                <div id="fps">FPS: --</div>
                <div id="worldStats">World Stats: --</div>
                <div id="playerStats">Player Stats: --</div>
                <div id="debugInfo"></div>
            `;
            document.body.appendChild(debugPanel);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.debugMode = true;
                debugManager.show();
                if (this.debugOverlay) {
                    this.debugOverlay.classList.add('visible');
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.debugMode = false;
                debugManager.hide();
                if (this.debugOverlay) {
                    this.debugOverlay.classList.remove('visible');
                }
            }
        });
    }

    setupSocketConnection() {
        this.socket = io('http://localhost:3000', {
            path: '/socket.io/',
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('[Client] Connected to server');
            debugManager.updateServerStatus('Connected');
        });

        this.socket.on('disconnect', () => {
            console.log('[Client] Disconnected from server');
            debugManager.updateServerStatus('Disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('[Client] Socket error:', error);
            debugManager.updateServerStatus('Error: ' + error.message);
        });

        this.socket.on('worldData', (data) => {
            this.handleWorldData(data);
        });
    }

    handleWorldData(data) {
        if (!data || !data.mapData) return;

        this.mapSystem.clear();
        debugManager.updateWorldStats(data.mapData);

        if (data.mapData.centerPoints) {
            Object.entries(data.mapData.centerPoints).forEach(([key, point]) => {
                this.mapSystem.addCenterPoint({
                    data: {
                        worldPos: point.worldPos,
                        gridPos: point.gridPos,
                        groundType: point.groundType
                    }
                });
            });
        }

        if (data.mapData.cornerPoints) {
            Object.entries(data.mapData.cornerPoints).forEach(([key, point]) => {
                this.mapSystem.addCornerPoint({
                    data: {
                        worldPos: point.worldPos,
                        gridPos: point.gridPos,
                        groundType: point.groundType
                    }
                });
            });
        }

        if (this.renderer) {
            this.renderer.render();
        }
    }

    startRenderLoop() {
        let lastTime = performance.now();
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            this.update(deltaTime);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    update(deltaTime) {
        this.stoonieManager.update(deltaTime);

        if (this.debugMode) {
            debugManager.updateFPS(1000 / deltaTime);
            this.updateDebugOverlay();
        }

        if (this.renderer) {
            this.renderer.updateStooniePositions(this.stoonieManager.stoonies, deltaTime);
            this.renderer.render();
        }
    }

    updateDebugOverlay() {
        if (!this.debugOverlay || !this.debugMode) return;

        const stats = {
            fps: Math.round(1 / this.lastFrameTime),
            stoonies: this.stoonieManager.stoonies.length,
            centerPoints: Object.keys(this.mapSystem.centerPoints || {}).length,
            cornerPoints: Object.keys(this.mapSystem.cornerPoints || {}).length,
            buildings: Object.keys(this.buildingSystem.buildings || {}).length
        };

        debugManager.log(`FPS: ${stats.fps}`);
        debugManager.log(`Stoonies: ${stats.stoonies}`);
        debugManager.log(`Center Points: ${stats.centerPoints}`);
        debugManager.log(`Corner Points: ${stats.cornerPoints}`);
        debugManager.log(`Buildings: ${stats.buildings}`);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) {
            this.renderer.updateSize();
            this.renderer.render();
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.renderer.handleMouseMove(x, y);
        });
    }

    setGroundType(groundType) {
        this.currentGroundType = groundType;
        if (this.renderer) {
            this.renderer.setGroundType(groundType);
        }
    }

    joinRoom(mapId) {
        this.socket.emit('joinRoom', { mapId });
        console.log(`[Client] Joining room: ${mapId}`);
    }
}

export default GameManager;