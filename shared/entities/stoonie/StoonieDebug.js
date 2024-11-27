import * as THREE from 'three';

export class StoonieDebug {
    constructor() {
        this.debugLines = [];
        this.debugLinesTimeout = null;
    }

    // Show ground check visualization
    showGroundCheck(x, z, groundType, scene) {
        if (!window.DEBUG_MODE || !scene) return;

        // Clean up old lines first
        while (this.debugLines && this.debugLines.length > 5) {
            const oldLine = this.debugLines.shift();
            if (oldLine && oldLine.parent) {
                oldLine.parent.remove(oldLine);
                oldLine.geometry.dispose();
                oldLine.material.dispose();
            }
        }

        // Create new debug line
        const material = new THREE.LineBasicMaterial({ 
            color: this.getGroundTypeColor(groundType) 
        });
        const points = [];
        points.push(new THREE.Vector3(x, 0.1, z));
        points.push(new THREE.Vector3(x, 0.5, z));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        this.debugLines.push(line);

        // Set timeout to remove the line
        if (this.debugLinesTimeout) {
            clearTimeout(this.debugLinesTimeout);
        }
        this.debugLinesTimeout = setTimeout(() => {
            while (this.debugLines.length > 0) {
                const line = this.debugLines.shift();
                if (line && line.parent) {
                    line.parent.remove(line);
                    line.geometry.dispose();
                    line.material.dispose();
                }
            }
        }, 2000);
    }

    getGroundTypeColor(groundType) {
        switch (groundType?.toLowerCase()) {
            case 'grass': return 0x00ff00;
            case 'sand': return 0xffff00;
            case 'water': return 0x0000ff;
            case 'rock': return 0x808080;
            default: return 0xff0000;
        }
    }

    dispose() {
        // Clean up all debug lines
        while (this.debugLines.length > 0) {
            const line = this.debugLines.shift();
            if (line && line.parent) {
                line.parent.remove(line);
                line.geometry.dispose();
                line.material.dispose();
            }
        }
        if (this.debugLinesTimeout) {
            clearTimeout(this.debugLinesTimeout);
        }
    }
}
