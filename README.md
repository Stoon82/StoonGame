# StoonGame

A 3D game with a web-based version using Three.js and a planned high-end version using Unreal Engine 5.

## Project Structure

```
StoonGame/
├── client/              # Frontend Three.js application
│   ├── src/
│   │   ├── agents/     # NPC AI and behavior systems
│   │   ├── world/      # Map and world management
│   │   ├── rendering/  # Three.js rendering setup
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── server/             # Node.js backend
│   ├── routes/         # API routes
│   ├── models/         # Data models
│   ├── controllers/    # Business logic
│   └── services/       # Shared services
└── shared/             # Shared code between frontend and backend
    ├── constants/      # Shared constants
    └── types/          # Type definitions
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

## Features

- 3D world rendering with Three.js
- Advanced map system
- Intelligent NPC agents
- Prepared for future UE5 integration

## Development

- Frontend: Three.js for 3D rendering
- Backend: Node.js with Express
- Real-time communication: Socket.IO
- Future Integration: Unreal Engine 5
