import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import WorldManager from './services/WorldManager.js';
import PlayerManager from './services/PlayerManager.js';
import { GROUND_TYPES } from '../shared/world/groundTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Configure security headers
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' http://localhost:8080 ws://localhost:3000; img-src 'self' data: http://localhost:8080 http://localhost:3000; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:8080; style-src 'self' 'unsafe-inline' http://localhost:8080");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        credentials: true
    },
    path: '/socket.io/',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
});

// Initialize default world
const DEFAULT_WORLD_ID = 'default';
let defaultWorld = null;

async function initializeDefaultWorld() {
    try {
        console.log('[Server] Initializing default world...');
        defaultWorld = await WorldManager.loadWorld(DEFAULT_WORLD_ID);

        if (!defaultWorld) {
            console.log('[Server] Default world not found, creating new one...');
            
            const size = 1;
            const h = size * Math.sqrt(3);
            const ver_offset = h * 1/6;

            // Create initial triangle data (upward triangle at q=0,r=0)
            const centerPoint = {
                worldPos: { x: 0, y: 0, z: 0 },
                gridPos: { q: 0, r: 0 },
                groundType: GROUND_TYPES.GRASS.id
            };

            // Calculate corner points based on center (0,0,0)
            // For an upward triangle:
            // - Bottom left: (-size, 0, -h/3 - ver_offset)
            // - Bottom right: (size, 0, -h/3 - ver_offset)
            // - Top: (0, 0, 2*h/3 - ver_offset)
            const cornerPoints = {};

            // Bottom left corner
            cornerPoints[`${-size},${-h/3 - ver_offset}`] = {
                worldPos: { x: -size, y: 0, z: -h/3 - ver_offset },
                gridPos: { q: -1, r: 0 },
                groundType: GROUND_TYPES.GRASS.id
            };

            // Bottom right corner
            cornerPoints[`${size},${-h/3 - ver_offset}`] = {
                worldPos: { x: size, y: 0, z: -h/3 - ver_offset },
                gridPos: { q: 1, r: 0 },
                groundType: GROUND_TYPES.GRASS.id
            };

            // Top corner
            cornerPoints[`0,${2*h/3 - ver_offset}`] = {
                worldPos: { x: 0, y: 0, z: 2*h/3 - ver_offset },
                gridPos: { q: 0, r: 1 },
                groundType: GROUND_TYPES.GRASS.id
            };

            defaultWorld = {
                config: {
                    seed: Date.now(),
                    maxPlayers: 100,
                    name: 'Default World',
                    description: 'The default world where all players start'
                },
                mapData: {
                    centerPoints: {
                        "0,0": centerPoint
                    },
                    cornerPoints: cornerPoints,
                    buildings: {},
                    resources: {}
                },
                players: new Set(),
                lastUpdate: Date.now(),
                version: '1.0.0'
            };

            console.log('[Server] Created default world with data:', {
                centerPoints: defaultWorld.mapData.centerPoints,
                cornerPoints: defaultWorld.mapData.cornerPoints
            });

            const success = await WorldManager.saveWorld(DEFAULT_WORLD_ID, defaultWorld);
            if (!success) {
                throw new Error('Failed to save default world');
            }
        }

        console.log('[Server] Default world initialized successfully:', {
            centerPoints: Object.keys(defaultWorld.mapData.centerPoints).length,
            cornerPoints: Object.keys(defaultWorld.mapData.cornerPoints).length
        });
        return true;
    } catch (error) {
        console.error('[Server] Failed to initialize default world:', error);
        return false;
    }
}

// Start server after initializing default world
async function startServer() {
    try {
        const success = await initializeDefaultWorld();
        if (!success) {
            throw new Error('Failed to initialize default world');
        }

        server.listen(3000, () => {
            console.log('[Server] Running on port 3000');
        });
    } catch (error) {
        console.error('[Server] Failed to start server:', error);
        process.exit(1);
    }
}

// Socket connection handling
io.on('connection', async (socket) => {
    console.log('[Server] Client connected:', socket.id);
    let currentWorld = null;
    let playerId = null;

    // Auto-join default world on connection
    await joinWorld(DEFAULT_WORLD_ID);

    // Helper function to join a world
    async function joinWorld(worldId) {
        try {
            // Leave current world if any
            if (currentWorld) {
                socket.leave(currentWorld);
                if (defaultWorld.players.has(playerId)) {
                    defaultWorld.players.delete(playerId);
                }
            }

            // Join new world
            currentWorld = worldId;
            socket.join(currentWorld);

            // Send initial world data to client
            console.log('[Server] Sending world data to client:', {
                worldId: currentWorld,
                centerPoints: Object.keys(defaultWorld.mapData.centerPoints).length,
                cornerPoints: Object.keys(defaultWorld.mapData.cornerPoints).length
            });

            socket.emit('worldData', {
                worldId: currentWorld,
                mapData: defaultWorld.mapData,
                config: defaultWorld.config
            });

            // Create or update player
            playerId = socket.id;
            defaultWorld.players.add(playerId);

            // Notify other players
            socket.to(currentWorld).emit('playerJoined', { playerId });

            console.log(`[Server] Client ${socket.id} joined world: ${currentWorld}`);
            return true;
        } catch (error) {
            console.error('[Server] Error joining world:', error);
            socket.emit('error', { message: 'Failed to join world' });
            return false;
        }
    }

    // Handle room joining
    socket.on('joinRoom', async ({ mapId }) => {
        await joinWorld(mapId);
    });

    // Handle player registration
    socket.on('registerPlayer', async ({ username }) => {
        try {
            playerId = await PlayerManager.createPlayer(username);
            socket.emit('playerRegistered', { playerId });
        } catch (error) {
            console.error('[Server] Error registering player:', error);
            socket.emit('error', { message: 'Failed to register player' });
        }
    });

    // Handle world creation
    socket.on('createWorld', async (config) => {
        try {
            const worldId = await WorldManager.createWorld(config);
            socket.emit('worldCreated', { worldId });
        } catch (error) {
            console.error('[Server] Error creating world:', error);
            socket.emit('error', { message: 'Failed to create world' });
        }
    });

    // Handle world listing
    socket.on('listWorlds', async (filters) => {
        try {
            const worlds = await WorldManager.listWorlds(filters);
            socket.emit('worldsList', worlds);
        } catch (error) {
            console.error('[Server] Error listing worlds:', error);
            socket.emit('error', { message: 'Failed to list worlds' });
        }
    });

    // Handle server status requests
    socket.on('getServerStatus', async (_, callback) => {
        try {
            const status = {
                serverInfo: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    activeWorlds: await WorldManager.getActiveWorldCount(),
                    activePlayers: await WorldManager.getTotalPlayerCount()
                },
                currentWorld: currentWorld ? {
                    id: currentWorld,
                    players: await WorldManager.getPlayerCount(currentWorld),
                    maxPlayers: await WorldManager.getMaxPlayers(currentWorld),
                    lastUpdate: await WorldManager.getLastUpdateTime(currentWorld)
                } : null,
                player: playerId ? {
                    id: playerId,
                    world: currentWorld,
                    stoonSouls: await PlayerManager.getStoonSouls(playerId)
                } : null
            };
            callback(status);
        } catch (error) {
            console.error('[Server] Error getting server status:', error);
            callback(null);
        }
    });

    // Handle world updates
    socket.on('updateWorld', async (update) => {
        try {
            if (!currentWorld || !playerId) return;

            const success = await WorldManager.updateWorld(currentWorld, update);
            if (success) {
                socket.to(currentWorld).emit('worldUpdate', {
                    ...update,
                    playerId
                });
            }
        } catch (error) {
            console.error('[Server] Error updating world:', error);
            socket.emit('error', { message: 'Failed to update world' });
        }
    });

    // Handle map updates
    socket.on('updateMap', (update) => {
        console.log('[Server] Received map update:', update);
        
        if (!update || !update.data || !update.type) {
            console.error('[Server] Invalid map update format:', update);
            return;
        }

        // Validate update data based on type
        if (update.type === 'centerPoint') {
            if (!update.data.worldPos || typeof update.data.worldPos.x !== 'number' || typeof update.data.worldPos.z !== 'number' ||
                !update.data.gridPos || typeof update.data.gridPos.q !== 'number' || typeof update.data.gridPos.r !== 'number') {
                console.error('[Server] Invalid center point data:', update.data);
                return;
            }
        } else if (update.type === 'cornerPoint') {
            if (!update.data.worldPos || typeof update.data.worldPos.x !== 'number' || typeof update.data.worldPos.z !== 'number' ||
                !update.data.gridPos || typeof update.data.gridPos.q !== 'number' || typeof update.data.gridPos.r !== 'number') {
                console.error('[Server] Invalid corner point data:', update.data);
                return;
            }
        } else {
            console.error('[Server] Unknown update type:', update.type);
            return;
        }

        // Add the update to the world data
        if (defaultWorld && defaultWorld.mapData) {
            if (update.type === 'centerPoint') {
                const key = `${update.data.gridPos.q},${update.data.gridPos.r}`;
                defaultWorld.mapData.centerPoints[key] = {
                    worldPos: {
                        x: Number(update.data.worldPos.x),
                        z: Number(update.data.worldPos.z)
                    },
                    gridPos: {
                        q: Number(update.data.gridPos.q),
                        r: Number(update.data.gridPos.r)
                    },
                    groundType: update.data.groundType
                };
            } else if (update.type === 'cornerPoint') {
                const key = `${update.data.worldPos.x},${update.data.worldPos.z}`;
                defaultWorld.mapData.cornerPoints[key] = {
                    worldPos: {
                        x: Number(update.data.worldPos.x),
                        z: Number(update.data.worldPos.z)
                    },
                    gridPos: {
                        q: Number(update.data.gridPos.q),
                        r: Number(update.data.gridPos.r)
                    },
                    groundType: update.data.groundType
                };
            }

            // Save the updated world
            WorldManager.saveWorld(DEFAULT_WORLD_ID, defaultWorld)
                .then(success => {
                    if (success) {
                        // Broadcast the update to all clients in the room
                        io.to(DEFAULT_WORLD_ID).emit('mapUpdate', update);
                    } else {
                        console.error('[Server] Failed to save world after update');
                    }
                })
                .catch(error => {
                    console.error('[Server] Error saving world after update:', error);
                });
        }
    });

    // Handle world state request
    socket.on('getWorldState', async () => {
        try {
            if (!currentWorld) {
                console.warn('[Server] World state requested but no world is selected');
                return;
            }

            const worldData = await WorldManager.loadWorld(currentWorld);
            if (!worldData) {
                console.error(`[Server] World ${currentWorld} not found`);
                return;
            }

            socket.emit('mapState', worldData.mapData);
            console.log(`[Server] Sent world state for ${currentWorld}`);
        } catch (error) {
            console.error('[Server] Error sending world state:', error);
            socket.emit('error', { message: 'Failed to get world state' });
        }
    });

    // Handle player updates
    socket.on('updatePlayer', async (update) => {
        try {
            if (!playerId) return;

            const success = await PlayerManager.updatePlayer(playerId, update);
            if (success && currentWorld) {
                socket.to(currentWorld).emit('playerUpdate', {
                    playerId,
                    update
                });
            }
        } catch (error) {
            console.error('[Server] Error updating player:', error);
            socket.emit('error', { message: 'Failed to update player' });
        }
    });

    // Handle debug status requests
    socket.on('getServerStatus', async (_, callback) => {
        try {
            if (!playerId) {
                callback(null);
                return;
            }

            const status = {
                currentWorld: currentWorld ? {
                    id: currentWorld,
                    players: (await WorldManager.getWorldInfo(currentWorld))?.players?.length || 0,
                    maxPlayers: (await WorldManager.getWorldInfo(currentWorld))?.maxPlayers || 0,
                    lastUpdate: (await WorldManager.getWorldInfo(currentWorld))?.lastUpdate
                } : null,
                player: await PlayerManager.loadPlayer(playerId),
                serverInfo: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    activeWorlds: await WorldManager.getActiveWorldCount(),
                    activePlayers: await PlayerManager.getActivePlayerCount()
                }
            };

            callback(status);
        } catch (error) {
            console.error('[Server] Error getting debug status:', error);
            callback(null);
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log('[Server] Client disconnected:', socket.id);
        if (currentWorld && playerId) {
            WorldManager.removePlayer(currentWorld, playerId);
            socket.to(currentWorld).emit('playerLeft', { playerId });
        }
        if (playerId) {
            PlayerManager.removePlayer(playerId);
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Server] Error:', err.stack);
    res.status(500).send('Something broke!');
});

startServer();
