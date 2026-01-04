# Project Overview

## Purpose

This Angular application provides a user-friendly interface for viewing NHL fantasy league statistics parsed from Fantrax. It displays player and goalie statistics across different seasons and game types (regular season vs playoffs).

## Architecture

### Frontend Stack
- **Framework**: Angular 21 (standalone components)
- **UI Library**: Angular Material
- **State Management**: RxJS + Services
- **Internationalization**: ngx-translate
- **Testing**: Jasmine/Karma (unit), Playwright (E2E)

### Backend Dependency
- Requires [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) running
- API endpoint configurable via environment

## Key Features

1. **Player Statistics Display**
   - Combined season results by player
   - Regular season and playoff stats separated
   - Filterable and sortable tables

2. **Goalie Statistics Display**
   - Separate view for goalie-specific stats
   - Same filtering and sorting capabilities

3. **Control Panel**
   - Season switcher (multiple seasons)
   - Report type switcher (regular/playoffs)
   - Stats mode toggle (combined/separate views)
   - Minimum games filter slider

4. **Data Management**
   - Caching service to reduce API calls
   - Filter service for table data
   - Stats service for data transformation

## User Flow

1. User opens app at http://localhost:4200
2. App loads default view (player stats, latest season)
3. User can:
   - Switch between players and goalies tabs
   - Select different seasons
   - Toggle between regular season and playoffs
   - Adjust minimum games filter
   - View detailed player cards
   - Sort and filter table data

## Design Patterns

### Component Architecture
- **Standalone Components**: All components use Angular's standalone API
- **Smart/Dumb Pattern**:
  - Smart: player-stats, goalie-stats (data fetching)
  - Dumb: stats-table, player-card, control-panel components (presentation)

### Service Layer
- **ApiService**: HTTP communication with backend
- **StatsService**: Data transformation and business logic
- **FilterService**: Table filtering logic
- **CacheService**: In-memory caching

### Routing
- Simple routing with two main routes:
  - `/players` - Player statistics view
  - `/goalies` - Goalie statistics view

## Data Flow

```
Backend API → ApiService → StatsService → Component → Template
                              ↓
                         CacheService
                              ↓
                         FilterService → Table Display
```

## Build & Deployment

- Development: `npm start` (port 4200)
- Production: `npm run build` (outputs to dist/)
- Testing: `npm test` (unit tests)
- E2E: Playwright tests in e2e/

## Browser Support

Modern browsers supporting ES2022+ (Chrome, Firefox, Safari, Edge)
