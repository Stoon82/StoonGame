// Debug Manager Module
class DebugManager {
    constructor() {
        this.init();
    }

    init() {
        this.isDebugMode = false;
        this.debugPanel = document.getElementById('debugPanel');
        this.serverStatusElement = document.getElementById('serverStatus');
        this.latencyElement = document.getElementById('latency');
        this.fpsElement = document.getElementById('fps');
        this.worldStatsElement = document.getElementById('worldStats');
        this.playerStatsElement = document.getElementById('playerStats');
        this.debugElement = document.getElementById('debugInfo');

        if (!this.debugPanel) {
            console.error('[DebugManager] Debug panel element not found!');
            return;
        }

        // Initialize debug panel state
        this.visible = false;
        this.debugPanel.style.display = 'none';
        this.lastFrameTime = performance.now();
    }

    show() {
        if (!this.debugPanel) this.init();
        this.visible = true;
        this.isDebugMode = true;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'block';
        }
        window.DEBUG_MODE = true;
    }

    hide() {
        if (!this.debugPanel) this.init();
        this.visible = false;
        this.isDebugMode = false;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none';
        }
        window.DEBUG_MODE = false;
    }

    updateServerStatus(status) {
        if (!this.serverStatusElement) this.init();
        if (this.serverStatusElement) {
            this.serverStatusElement.textContent = `Server Status: ${status}`;
        }
    }

    updateLatency(latency) {
        if (!this.latencyElement) this.init();
        if (this.latencyElement) {
            this.latencyElement.textContent = `Latency: ${latency}ms`;
        }
    }

    updateFPS(fps) {
        if (!this.fpsElement) this.init();
        if (this.fpsElement) {
            this.fpsElement.textContent = `FPS: ${Math.round(fps)}`;
        }
    }

    updateWorldStats(stats) {
        if (!this.worldStatsElement) this.init();
        if (this.worldStatsElement && stats) {
            this.worldStatsElement.innerHTML = `
                🌍 World Stats:<br>
                - Center Points: ${Object.keys(stats.centerPoints || {}).length}<br>
                - Corner Points: ${Object.keys(stats.cornerPoints || {}).length}<br>
                - Buildings: ${Object.keys(stats.buildings || {}).length}<br>
                - Resources: ${Object.keys(stats.resources || {}).length}
            `;
        }
    }

    updatePlayerStats(stats) {
        if (!this.playerStatsElement) this.init();
        if (this.playerStatsElement && stats) {
            this.playerStatsElement.innerHTML = `
                👤 Player Stats:<br>
                ${Object.entries(stats).map(([key, value]) => `- ${key}: ${value}`).join('<br>')}
            `;
        }
    }

    log(message, type = 'info') {
        if (!this.isDebugMode) return;
        if (!this.debugElement) this.init();

        const timestamp = new Date().toISOString();
        console.log(`[DEBUG ${type.toUpperCase()}] ${timestamp}: ${message}`);
        
        if (this.debugElement) {
            const logEntry = document.createElement('div');
            logEntry.textContent = `${type.toUpperCase()}: ${message}`;
            this.debugElement.appendChild(logEntry);
            
            // Keep only last 100 messages
            while (this.debugElement.children.length > 100) {
                this.debugElement.removeChild(this.debugElement.firstChild);
            }
        }
    }
}

// Create and export singleton instance
export const debugManager = new DebugManager();
