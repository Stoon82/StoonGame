// Utility functions for map systems

export function calculateWorldPosition(q, r, size) {
    const x = (q * Math.sqrt(3) + (r & 1) * Math.sqrt(3) / 2) * size;
    const z = (r * 1.5) * size;
    return { x, z };
}

export function calculateCornerPositions(center, size) {
    const height = Math.sqrt(3) / 2 * size;

    return [
        { x: center.x, z: center.z + height }, // Top corner
        { x: center.x - size / 2, z: center.z - height / 2 }, // Bottom-left corner
        { x: center.x + size / 2, z: center.z - height / 2 }  // Bottom-right corner
    ];
}

export function getGroundTypeColor(groundType) {
    // This function would return the color associated with a ground type
    // For now, let's assume it returns a string representation of the color
    return `#${groundType.color.toString(16).padStart(6, '0')}`;
}
