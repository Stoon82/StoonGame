import { ResourceType, ResourceStack } from './ResourceTypes';
import { ResourceStorage } from './ResourceStorage';

export interface TransportRoute {
    from: ResourceStorage;
    to: ResourceStorage;
    resources: ResourceStack[];
    progress: number;  // 0 to 1
    speed: number;     // units per second
    distance: number;  // game units
}

export class ResourceTransport {
    private activeRoutes: TransportRoute[] = [];

    // Start a new transport route
    public startTransport(
        from: ResourceStorage,
        to: ResourceStorage,
        resources: ResourceStack[],
        distance: number,
        speed: number
    ): boolean {
        // Check if source has enough resources
        if (!from.hasResources(resources)) {
            return false;
        }

        // Check if destination has enough space
        if (!resources.every(res => to.hasSpaceFor(res.type, res.amount))) {
            return false;
        }

        // Remove resources from source
        resources.forEach(res => {
            from.removeResource(res.type, res.amount);
        });

        // Create new transport route
        const route: TransportRoute = {
            from,
            to,
            resources,
            progress: 0,
            speed,
            distance
        };

        this.activeRoutes.push(route);
        return true;
    }

    // Update all active transports (call this in game loop)
    public update(deltaTime: number): void {
        const completedRoutes: TransportRoute[] = [];

        // Update progress of each route
        this.activeRoutes.forEach(route => {
            const progressPerSecond = route.speed / route.distance;
            route.progress += progressPerSecond * deltaTime;

            // Check if transport is complete
            if (route.progress >= 1) {
                this.completeTransport(route);
                completedRoutes.push(route);
            }
        });

        // Remove completed routes
        this.activeRoutes = this.activeRoutes.filter(
            route => !completedRoutes.includes(route)
        );
    }

    // Complete a transport route
    private completeTransport(route: TransportRoute): void {
        // Add resources to destination
        route.resources.forEach(res => {
            route.to.addResource(res.type, res.amount);
        });
    }

    // Get all active transport routes
    public getActiveRoutes(): TransportRoute[] {
        return [...this.activeRoutes];
    }

    // Cancel a transport route
    public cancelTransport(route: TransportRoute): void {
        // Return resources to source
        route.resources.forEach(res => {
            route.from.addResource(res.type, res.amount);
        });

        // Remove route
        const index = this.activeRoutes.indexOf(route);
        if (index !== -1) {
            this.activeRoutes.splice(index, 1);
        }
    }
}
