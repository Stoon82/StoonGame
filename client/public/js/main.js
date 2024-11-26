import { WorldRenderer } from './worldRenderer.js';
import { TriangleGrid } from '../../../shared/world/TriangleGrid.js';
import { Stoonie } from '../../../shared/entities/Stoonie.js';
import { StoonieManager } from '../../../shared/entities/StoonieManager.js';
import { SoulManager } from '../../../shared/entities/SoulManager.js';

class Game {
    constructor() {
        // Create game container
        this.container = document.getElementById('game-container');
        if (!this.container) {
            console.error('Game container not found, creating one...');
            this.container = document.createElement('div');
            this.container.id = 'game-container';
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.position = 'relative';
            document.body.appendChild(this.container);
        }
        
        console.log('Initializing game with container:', this.container);
        
        // Initialize renderer
        this.renderer = new WorldRenderer(this.container);
        this.grid = null;
        this.stoonieManager = new StoonieManager();
        this.soulManager = new SoulManager(3); // Start with 3 max souls
        this.lastUpdate = Date.now();
        
        this.setupUI();
        this.gameLoop();
        
        // Generate initial world
        console.log('Generating initial world...');
        this.generateWorld();
    }

    setupUI() {
        const controls = document.createElement('div');
        controls.style.position = 'fixed';
        controls.style.top = '10px';
        controls.style.left = '10px';
        controls.style.zIndex = '100';
        controls.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        controls.style.padding = '10px';
        controls.style.borderRadius = '5px';
        controls.style.color = 'white';
        controls.style.display = 'flex';
        controls.style.flexDirection = 'column';
        controls.style.gap = '10px';

        // Generate World button
        const generateButton = document.createElement('button');
        generateButton.textContent = 'Generate World';
        generateButton.addEventListener('click', () => {
            console.log('Generating world...');
            this.generateWorld();
        });
        controls.appendChild(generateButton);

        // Width control
        const widthDiv = document.createElement('div');
        widthDiv.innerHTML = 'Width: <span id="widthValue">5</span>';
        const widthSlider = document.createElement('input');
        widthSlider.type = 'range';
        widthSlider.min = '1';
        widthSlider.max = '20';
        widthSlider.value = '5';
        widthSlider.addEventListener('input', () => {
            document.getElementById('widthValue').textContent = widthSlider.value;
        });
        widthDiv.appendChild(widthSlider);
        controls.appendChild(widthDiv);

        // Height control
        const heightDiv = document.createElement('div');
        heightDiv.innerHTML = 'Height: <span id="heightValue">5</span>';
        const heightSlider = document.createElement('input');
        heightSlider.type = 'range';
        heightSlider.min = '1';
        heightSlider.max = '20';
        heightSlider.value = '5';
        heightSlider.addEventListener('input', () => {
            document.getElementById('heightValue').textContent = heightSlider.value;
        });
        heightDiv.appendChild(heightSlider);
        controls.appendChild(heightDiv);

        // Add Stoonie button
        const addStoonieButton = document.createElement('button');
        addStoonieButton.textContent = 'Add Stoonie';
        addStoonieButton.addEventListener('click', () => {
            console.log('Adding Stoonie...');
            this.addRandomStoonie();
        });
        controls.appendChild(addStoonieButton);

        // Add controls to container
        this.container.appendChild(controls);
    }

    generateWorld() {
        const width = parseInt(document.getElementById('widthValue').textContent);
        const height = parseInt(document.getElementById('heightValue').textContent);
        
        // Clear existing Stoonies when generating new world
        this.stoonieManager = new StoonieManager();
        
        this.grid = new TriangleGrid(width, height);
        this.renderer.generateWorld(width, height);
    }

    addRandomStoonie() {
        if (!this.grid) {
            console.warn('Please generate a world first!');
            return;
        }

        // Random position within grid bounds
        const q = Math.floor(Math.random() * this.grid.width);
        const r = Math.floor(Math.random() * this.grid.height);
        
        // Random gender
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        
        // Create new Stoonie with position and gender
        const stoonie = new Stoonie(
            crypto.randomUUID(),
            { q, r },
            gender
        );
        
        this.stoonieManager.addStoonie(stoonie);
        
        // Immediately update renderer
        this.renderer.updateStoonies(this.stoonieManager.getStoonies());
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // Update all Stoonies
        this.stoonieManager.update(deltaTime);
        
        // Update renderer with latest Stoonie positions
        this.renderer.updateStoonies(this.stoonieManager.getStoonies());

        // Continue the game loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game instance
let game = null;

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing game...');
    try {
        game = new Game();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
