import { WorldRenderer } from './worldRenderer.js';
import { WorldGenerator } from '../../../shared/world/WorldGenerator.js';

// Remove loading message
const loadingElement = document.getElementById('loading');
if (loadingElement) {
    loadingElement.remove();
}

// Initialize with a single triangle
let width = 1;
let height = 1;
let seed = 12345;

// Create world generator and generate initial world
const generator = new WorldGenerator(seed);
let world = generator.generateWorld(width, height);

// Initialize renderer
const renderer = new WorldRenderer(document.body);
renderer.renderWorld(world);

// Add UI controls
const controlsDiv = document.createElement('div');
controlsDiv.style.position = 'fixed';
controlsDiv.style.top = '10px';
controlsDiv.style.left = '10px';
controlsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
controlsDiv.style.padding = '10px';
controlsDiv.style.borderRadius = '5px';
controlsDiv.style.color = 'white';
controlsDiv.style.display = 'flex';
controlsDiv.style.flexDirection = 'column';
controlsDiv.style.gap = '10px';

// Width control
const widthDiv = document.createElement('div');
widthDiv.innerHTML = 'Width: <span id="widthValue">1</span>';
const widthSlider = document.createElement('input');
widthSlider.type = 'range';
widthSlider.min = '1';
widthSlider.max = '10';
widthSlider.value = '1';
widthSlider.oninput = () => {
    width = parseInt(widthSlider.value);
    document.getElementById('widthValue').textContent = width;
};
widthDiv.appendChild(widthSlider);
controlsDiv.appendChild(widthDiv);

// Height control
const heightDiv = document.createElement('div');
heightDiv.innerHTML = 'Height: <span id="heightValue">1</span>';
const heightSlider = document.createElement('input');
heightSlider.type = 'range';
heightSlider.min = '1';
heightSlider.max = '10';
heightSlider.value = '1';
heightSlider.oninput = () => {
    height = parseInt(heightSlider.value);
    document.getElementById('heightValue').textContent = height;
};
heightDiv.appendChild(heightSlider);
controlsDiv.appendChild(heightDiv);

// Seed input
const seedDiv = document.createElement('div');
seedDiv.innerHTML = 'Seed:';
const seedInput = document.createElement('input');
seedInput.type = 'number';
seedInput.value = seed;
seedInput.style.width = '100px';
seedInput.style.marginLeft = '5px';
seedInput.oninput = () => {
    seed = parseInt(seedInput.value) || 0;
};
seedDiv.appendChild(seedInput);
controlsDiv.appendChild(seedDiv);

// Generate button
const generateButton = document.createElement('button');
generateButton.textContent = 'Generate World';
generateButton.onclick = () => {
    const newGenerator = new WorldGenerator(seed);
    world = newGenerator.generateWorld(width, height);
    renderer.renderWorld(world);
};
controlsDiv.appendChild(generateButton);

document.body.appendChild(controlsDiv);
