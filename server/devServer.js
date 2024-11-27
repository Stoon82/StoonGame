import express from 'express';
import path from 'path';
const app = express();

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '../client/public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve shared directory
app.use('/shared', express.static(path.join(__dirname, '../shared'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Handle all routes for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Development server running on http://localhost:${PORT}`);
});
