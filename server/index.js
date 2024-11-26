const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the client/public directory
app.use(express.static(path.join(__dirname, '../client/public')));

// Basic route for the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle player movement
    socket.on('playerMove', (data) => {
        // Broadcast player movement to other players
        socket.broadcast.emit('playerMoved', data);
    });

    // Handle world state updates
    socket.on('worldUpdate', (data) => {
        // Process and broadcast world updates
        io.emit('worldStateUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
