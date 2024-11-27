export default class EdgeUI {
    constructor(game) {
        this.game = game;
        this.mode = null; // 'street', 'river', or 'bridge'
        this.startPoint = null;
        this.initUI();
    }

    initUI() {
        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.id = 'edge-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        `;

        // Create tool buttons
        const tools = [
            { id: 'street', icon: '🛣️', label: 'Build Street' },
            { id: 'river', icon: '🌊', label: 'Add River' },
            { id: 'bridge', icon: '🌉', label: 'Build Bridge' }
        ];

        tools.forEach(tool => {
            const button = document.createElement('button');
            button.className = 'edge-tool';
            button.style.cssText = `
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 5px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.2s;
                white-space: nowrap;
            `;
            button.innerHTML = `
                <span style="font-size: 1.2em;">${tool.icon}</span>
                <span>${tool.label}</span>
            `;
            button.onclick = () => this.setMode(tool.id);
            button.onmouseover = () => {
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            };
            button.onmouseout = () => {
                button.style.background = this.mode === tool.id 
                    ? 'rgba(76, 175, 80, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)';
            };
            toolbar.appendChild(button);
        });

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .edge-tool.selected {
                background: rgba(76, 175, 80, 0.3) !important;
            }
            #edge-toolbar {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            .edge-tool:hover {
                transform: translateX(2px);
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toolbar);
    }

    setMode(mode) {
        if (this.mode === mode) {
            this.mode = null;
            this.startPoint = null;
        } else {
            this.mode = mode;
            this.startPoint = null;
        }

        // Update UI
        document.querySelectorAll('.edge-tool').forEach(button => {
            button.classList.remove('selected');
            if (button.textContent.toLowerCase().includes(mode)) {
                button.classList.add('selected');
            }
        });

        // Update cursor
        document.body.style.cursor = this.mode ? 'crosshair' : 'default';
    }

    handleClick(gridPos) {
        if (!this.mode || !gridPos) return false;

        if (this.mode === 'bridge') {
            // Attempt to build bridge at clicked point
            const bridge = this.game.edgeSystem.buildBridge([gridPos.q, gridPos.r]);
            if (bridge) {
                console.log('Bridge built:', bridge);
                return true;
            }
        } else {
            // Handle street/river placement
            if (!this.startPoint) {
                this.startPoint = [gridPos.q, gridPos.r];
                return true;
            } else {
                const edge = this.game.edgeSystem.addEdgeElement(
                    this.mode, 
                    this.startPoint, 
                    [gridPos.q, gridPos.r]
                );
                if (edge) {
                    console.log(`${this.mode} added:`, edge);
                    this.startPoint = null;
                    return true;
                }
            }
        }

        return false;
    }

    // For preview rendering
    getPreviewData() {
        if (!this.mode || !this.startPoint) return null;

        const mousePos = this.game.renderer.getLastMousePosition();
        if (!mousePos) return null;

        const gridPos = this.game.renderer.getGridPosition(mousePos.x, mousePos.y);
        if (!gridPos) return null;

        return {
            type: this.mode,
            start: this.startPoint,
            end: [gridPos.q, gridPos.r]
        };
    }
}
