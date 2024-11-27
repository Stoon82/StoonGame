class DebugUI {
    constructor() {
        this.debugPanel = document.getElementById('debugPanel');
        this.serverStatusElement = document.getElementById('serverStatus');
        this.latencyElement = document.getElementById('latency');
        this.fpsElement = document.getElementById('fps');
        this.worldStatsElement = document.getElementById('worldStats');
        this.playerStatsElement = document.getElementById('playerStats');

        if (!this.debugPanel) {
            console.error('[DebugUI] Debug panel element not found!');
            return;
        }

        // Initialize debug panel state
        this.visible = false;
        this.debugPanel.style.display = 'none';
    }

    updateServerStatus(status) {
        if (this.serverStatusElement) {
            this.serverStatusElement.textContent = `Server Status: ${status}`;
        }
    }

    updateLatency(latency) {
        if (this.latencyElement) {
            this.latencyElement.textContent = `Latency: ${latency}ms`;
        }
    }

    updateFPS(fps) {
        if (this.fpsElement) {
            this.fpsElement.textContent = `FPS: ${Math.round(fps)}`;
        }
    }

    updateWorldStats(stats) {
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
        if (this.playerStatsElement && stats) {
            this.playerStatsElement.innerHTML = `
                👤 Player Stats:<br>
                - Stoon Souls: ${stats.stoonSouls || 0}<br>
                - Buildings: ${stats.buildings?.length || 0}<br>
                - Resources: ${stats.resources?.length || 0}
            `;
        }
    }

    toggle() {
        this.visible = !this.visible;
        this.debugPanel.style.display = this.visible ? 'block' : 'none';
    }

    show() {
        this.visible = true;
        this.debugPanel.style.display = 'block';
    }

    hide() {
        this.visible = false;
        this.debugPanel.style.display = 'none';
    }
}

export default DebugUI;
