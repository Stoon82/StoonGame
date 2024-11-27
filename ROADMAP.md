# 🎮 StoonGame Project Roadmap

## 🌟 Currently Implemented Features

last saved git repo version: 0.2.1

### Do:  / Next Steps:
- Implement building collision detection
- Add ground type validation for buildings and edges
- Create resource cost system for buildings and bridges
- Add visual representations for buildings
- Improve edge rendering and path connections
- Implement server synchronization for buildings and edges
- Add pathfinding considering streets, rivers, and bridges
- Enhance Stoonie movement to use street network
- Back up server, rooms for different worlds/maps
- Landing page and login system
- Stoonie Souls and Combat system
- Stoonie movement / Groundtype check / Pathfinding / Pregnancies /Needsmanagement / Combat
- Stoonie Souls
- Resource and Building systems
- Add more ground types
- Add more Stoonie traits
- Add more Stoonie skills
- Add more Stoonie abilities
- Add more Stoonie needs
- Add more Stoonie states
- Add more Stoonie actions
- Improve server management:
  - Consolidate server starts into single process
  - Add proper process management
  - Implement graceful shutdown
  - Add server status monitoring

### Recently Added:
- Building System:
  * Multiple building types (tents, huts, houses)
  * Size variations (small, medium, big)
  * Building placement UI
  * Cost specifications
- Edge System:
  * Streets and rivers along triangle edges
  * Bridge construction at intersections
  * Edge placement UI with preview
  * Basic path validation
- Resource System:
  * Resource types (wood, stone, food, gold, iron, tools)
  * Resource storage with capacity limits
  * Weight-based transportation mechanics
  * Resource stack management
- Combat System:
  * Attack and defense mechanics
  * Health and damage calculations
  * Critical hit system
  * Range-based combat
  * Attack speed and cooldowns
- Enemy System:
  * Three enemy types (Dark Stoonie, Corrupted Stoonie, Elite Dark Stoonie)
  * Enemy movement and targeting
  * Experience and resource drops
  * Wave-based spawning through portals
  * Progressive difficulty scaling

### 🌐 World Generation & Rendering
- ✅ Triangle-based grid system with axial coordinates
- ✅ Dynamic grid sizing (1-20 dimensions)                depricated, now flexible
- ✅ 60-degree arc placement at triangle corners
- ✅ Four ground types (GRASS, WATER, SAND, ROCK)       add wood / trees / stone mill
- ✅ Material caching for performance
- ✅ Camera auto-adjustment based on grid size
- ✅ Random ground type assignment
- ✅ Precise triangle vertex positioning
- ✅ Connecting arcs between triangles

### 🎨 Visual Features
- ✅ Ground type coloration:
  ✅ GRASS: Light green (0x90EE90)
- ✅WATER: Royal blue (0x4169E1)
- ✅SAND: Sandy brown (0xF4A460)
- ✅ROCK: Gray (0x808080)
- ✅ Alternating upward/downward triangle orientation
- ✅ Z-fighting prevention with slight elevation differences

### 🛠️ Technical Infrastructure
- ✅ Three.js integration for 3D rendering
- ✅ Webpack build system
- ✅ Development server setup
- ✅ Modular code architecture
- ✅ Backend server setup
- [ ] Server Process Improvements:
  - [ ] Single-command server startup
  - [ ] Automatic port management
  - [ ] Process monitoring and recovery
  - [ ] Development/Production environment configuration
- [ ] Deployment Infrastructure:
  - [ ] Automated backup system
  - [ ] Database integration for world persistence
  - [ ] User authentication system
  - [ ] Multi-world support

## 🚀 Planned Features

### 🌍 World Generation
- [ ] Biome system implementation                         ---> maybe, later
- [ ] Coherent terrain generation using noise functions   ---> don't know about that
- [ ] Height variation and elevation system               ---> yes, at some point, building on the current biome placement
- [ ] Natural feature generation (rivers, mountains, forests)   ---> yes
- [ ] Climate system affecting ground types                     ---> yes, at some point

### 🎮 Gameplay Elements
- [x] Initial hexagon setup with six triangles / one triangle and growing from there ---> user can puzzle matching corner types together
- [x] Triangle matching interface
- [x] Click-to-place triangle mechanics
- [x] Valid placement verification
- [x] Random triangle generation with matching rules
- [x] Basic Stoonie entity system with needs and states
- [x] Stoonie movement and pathfinding on triangles
- [x] Resource gathering mechanics (wood, stone)
- [x] Building system
- [x] Combat system implementation
- [ ] Day/night cycle ---> yes, but later at some point
- [ ] Player character implementation ---> player stoonie, free float camera to move and look around, direct control over Stoonies
- [ ] Movement system on triangle grid [DEPRECATED - Replaced by Stoonie movement]

### 🤖 Game Mechanics
- [x] Basic entity pathfinding on triangle grid
- [x] Simple needs management system
- [x] Basic state machine for entities
- [x] Resource management system
- [x] Combat and enemy system
- [ ] Advanced pathfinding with obstacles
- [ ] Entity pathfinding off grid
- [ ] Crafting system
- [ ] Weather effects
- [ ] Environmental interactions

### 🎯 Technical Improvements
- [x] Basic performance optimization
- [x] Ground type validation system
- [x] Triangle corner matching system
- [x] Entity management system
- [ ] Performance optimization for large grids [DEPRECATED - Merged into basic optimization]
- [ ] Level of Detail (LOD) system 
- [ ] Save/Load system
- [ ] Multiplayer support
- [ ] Mobile device support
- [ ] Touch controls

### 🎨 Visual Enhancements
- [x] Basic ground type coloration
- [x] Triangle arc connections
- [x] Entity visualization
- [ ] Improved textures for ground types
- [ ] Particle effects
- [ ] Dynamic lighting system
- [ ] Ambient animations
- [ ] UI/UX improvements

### 🧪 Testing & Quality
- [x] Basic validation testing
- [ ] Unit test suite
- [ ] Integration tests
- [ ] Performance benchmarking
- [ ] Automated testing pipeline

## 📅 Development Priorities

### Immediate Focus (Current Sprint)
1. Implement defensive buildings for Stoonies
2. Add combat animations and effects
3. Create resource production buildings
4. Implement resource transportation system

[PENDING - Original Sprint Goals]
- Implement building collision detection (pending - lower priority)
- Add ground type validation for buildings and edges (pending - lower priority)
- Create resource cost system for buildings and bridges (merged into resource system)
- Add visual representations for buildings (pending - lower priority)

### Short Term (Next 2-3 Sprints)
1. Combat System Enhancements:
   - Visual combat effects
   - Combat sounds
   - Combat animations
   - Damage indicators

2. Enemy System Improvements:
   - More enemy types
   - Advanced AI behaviors
   - Special abilities
   - Boss enemies

3. Resource System Integration:
   - Resource production buildings
   - Resource transportation
   - Resource trading
   - Resource UI

4. Defense System:
   - Defensive structures
   - Guard posts
   - Walls and gates
   - Defensive formations

[PENDING - Original Short Term Goals]
1. Edge System Enhancements: (pending - lower priority)
   - Visual improvements for streets and rivers
   - Better bridge models
   - Path validation and connection rules
   - Edge network optimization

2. Building System Completion: (partially implemented)
   - Building models and rendering
   - Resource requirements (completed)
   - Building upgrades (pending)
   - Building effects on Stoonies (pending)

3. Movement System Integration: (pending - lower priority)
   - Street-based movement bonuses
   - Bridge crossing animations
   - Path planning with edge network
   - Movement restrictions based on terrain

4. Basic Resource System: (completed and expanded)
   - Basic resources (wood, stone, etc.)
   - Resource gathering
   - Building and bridge costs
   - Resource storage buildings

### Medium Term
1. Advanced Building Features:
   - Building zones and districts
   - Building effects on surroundings
   - Building maintenance requirements
   - Special building abilities

2. Enhanced Transportation:
   - Different street types (dirt, stone, etc.)
   - Advanced bridge types
   - Water transportation system
   - Underground tunnels

3. World Generation Improvements:
   - River network generation
   - Natural street formation
   - Better terrain variety
   - Biome system integration

### Long Term Vision
1. Complex Economy:
   - Trade routes using street network
   - River-based commerce
   - Building-based production chains
   - Market system

2. Advanced Stoonie Behavior:
   - Street and building preferences
   - Social gathering places
   - Work and home locations
   - Transportation choices

3. World Events:
   - Natural disasters affecting structures
   - Street and bridge maintenance
   - Seasonal changes
   - Special events and festivals

## 🔄 Regular Updates
This roadmap will be updated as features are implemented and new priorities emerge. Feel free to suggest additions or modifications to this plan.

## 🚨 Known Issues:
- Ground type detection via linetrace returning incorrect results - needs investigation and fixing
- Server management needs consolidation
- Edge preview rendering needs optimization
- Building placement needs proper grid snapping

[DEPRECATED Features]
- Dynamic grid sizing (1-20 dimensions) - Replaced with flexible system
- Movement system on triangle grid - Replaced with Stoonie movement
- Performance optimization for large grids - Merged into basic optimization
- Basic entity pathfinding - Replaced with advanced Stoonie pathfinding

[UNSURE - Needs Discussion]
- Biome system implementation
- Coherent terrain generation using noise functions
- Mobile device support
- Touch controls
- Day/night cycle implementation method
- Player character control scheme

---
Last Updated: {{ new Date().toISOString().split('T')[0] }}
