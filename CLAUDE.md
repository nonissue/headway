# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "headway" (formerly next-departures), a web application that shows upcoming departure times for Edmonton LRT stations based on GTFS schedule data. The app finds the user's geographically closest LRT station and displays departure times.

**Live URLs:**
- Primary: https://headway.andy.ws
- Fly.io: https://next-departures.fly.dev

## Development Commands

### Core Development

- `npm run dev` - Start both server and client in development mode (uses concurrently)
- `npm run dev:server` - Start only the Express/Hono server with tsx watch
- `npm run dev:client` - Start only the Vite dev server

### Building

- `npm run build` - Build client-side code with Vite
- `npm run build:server` - Build server-side code with TypeScript
- `npm run build:all` - Build both client and server
- `npm run preview` - Build and serve the production version locally

### Testing

- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage report

### Database Management

- `npm run db:update` - Full database update (import + slim)
- `npm run db:import` - Import GTFS data into SQLite database
- `npm run db:slim` - Create optimized LRT-only database from full GTFS data
- `sqlite3 db/gtfs.db < scripts/build_lrt_only_filtered.sql` - Create filtered database excluding operational stops

## Architecture

### Tech Stack

- **Frontend**: React 19 with Vite, TailwindCSS v4, TypeScript
- **Backend**: Hono framework running on Node.js
- **Database**: SQLite with better-sqlite3, GTFS data via node-gtfs
- **Deployment**: Fly.io with custom domain (headway.andy.ws)
- **Analytics**: Umami (free cloud plan, privacy-friendly)

### Key Components

- **Client**: Single-page React app (`src/main.tsx`) that requests user location and fetches departures
- **Server**: Hono server (`src/server.ts`) that serves static files and API routes
- **API**: REST endpoint at `/api/departures/nearby` that finds closest station and departure times
- **Database**: Two SQLite databases - full GTFS data and optimized LRT-only version

### File Structure

- `src/main.tsx` - Main React application entry point
- `src/server.ts` - Hono server with API routes and static file serving
- `src/api/departures.ts` - API route handlers for departure data
- `src/lib/get-nearby-departures.ts` - Core business logic for finding nearby departures
- `src/lib/stop-utils.ts` - Database utilities for station/stop operations
- `src/lib/time-utils.ts` - Time conversion and formatting utilities
- `data/gtfs_lrt_only.db` - Optimized SQLite database (production)
- `db/gtfs.db` - Full GTFS database (development)

### Configuration Files

- `import-config.json` - GTFS import configuration
- `app-config.json` - Application configuration
- `vite.config.ts` - Client build configuration with PWA support
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*` → `src/*`)

### Development Notes

- Uses TypeScript with ESM modules
- Path alias `@/*` maps to `src/*`
- Database contains Edmonton Transit GTFS data
- Geolocation with fallback to test coordinates
- PWA-enabled with Vite PWA plugin
- Sentry integration for error tracking
- No ESLint configuration currently in the project

## Database Architecture & Recent Fixes

### Current Status (Working ✅)

The app was broken due to Edmonton Transit changing stop IDs but has been completely fixed:

- **Issue**: Corona Station stop IDs changed from 1891/1926 (parent Q2805) to 19261/19262 (parent Q7007)
- **Root Cause**: City's JSON endpoint became stale while GTFS data was updated
- **Solution**: Robust route-based filtering that survived the ID changes

### Database Structure

- **Full Database**: `db/gtfs.db` (580MB) - Complete Edmonton Transit GTFS data
- **Slim Database**: `data/gtfs_lrt_only.db` (3.8MB) - Filtered LRT-only data
- **Reduction**: 99.3% size reduction, ~35k stop_times, 93 stops (31 stations + 62 platforms)

### LRT Routes Included

1. **Capital Line** (021R) - Blue line
2. **Metro Line** (022R) - Red line
3. **Valley Line** (023R) - Green line

### Database Filtering (IMPORTANT)

The slim database excludes operational/maintenance stops that are not passenger-accessible:

**Excluded Operational Stops:**

- Health Sciences Tail Track (QHTT, 20191)
- Andrews Garage Platform (79171, 79172)
- Transit Garage stops (A0303, A0343)
- Any stops with names containing: "Tail", "Track", "Garage", "Yard", "Depot", "Shop", "Maintenance"

**Scripts:**

- `scripts/build_lrt_only.sql` - Original slimming script
- `scripts/build_lrt_only_filtered.sql` - **USE THIS** - Enhanced version with operational stop filtering

### Test Coordinates Available

See `src/config.ts` for test coordinates including:

- `TEST_COORDS` - Corona Station area
- `TEST_COORDS_SOUTHGATE_STATION` - Southgate area
- `TEST_COORDS_HEALTH_SCIENCES_1` - Health Sciences area
- Plus coordinates for McKernan Belgravia, Century Park, etc.

### PWA Configuration

Enhanced with cache-busting for development:

- `skipWaiting: true` - Forces immediate service worker updates
- `clientsClaim: true` - New SW takes control immediately
- API endpoints use `NetworkFirst` caching strategy
- No-cache headers on API responses to prevent stale data

## Deployment & Analytics

### Custom Domain Setup

The app is deployed to Fly.io and accessible via two URLs:

- **Primary domain**: `headway.andy.ws` (custom domain)
- **Fly.io domain**: `next-departures.fly.dev` (original)

**DNS Configuration:**
- CNAME record: `headway.andy.ws` → `qxezk2y.next-departures.fly.dev`
- ACME challenge: `_acme-challenge.headway` → `headway.andy.ws.qxezk2y.flydns.net.`

**SSL Certificate:**
- Managed by Fly.io
- Issued by Let's Encrypt
- Auto-renewal enabled
- Check status: `fly certs show headway.andy.ws`

Both domains serve the same app with valid HTTPS certificates.

### Analytics (Umami)

Privacy-friendly analytics via [Umami Cloud](https://umami.is) (free plan).

**Implementation:**
- Tracking script added to `index.html` in `<head>` section
- Script loads from `cloud.umami.is` with `defer` attribute
- Client-side only, no server configuration needed
- Website ID: `aac8d5e9-5e2d-4107-8844-f484b9e45eb2`

**Note on iOS tracking**: iOS content blockers and Safari's tracking protection may prevent analytics from loading. This is expected behavior and respects user privacy preferences.

## Recent Bug Fixes (September 2025)

### 1. ✅ Terminus Platform Display Issue

**Problem**: Terminus stations (Century Park, Clareview, Mill Woods) were showing two platforms when they should only show one with actual departures.

**Root Cause**: Platform stops were showing terminating trips (arrivals) alongside actual departures.

**Solution**: Enhanced `getDeparturesForStop()` in `src/lib/stop-utils.ts:157-171` to filter out trips where the headsign matches the station name (indicating terminating service).

**Example**:

- Century Park platform 49822 had trips with headsign "Century Park" (terminating trains)
- Now only platform 49821 shows with departures to "Clareview" and "NAIT"

**Applies to all terminus stations:**

- Century Park (southern terminus)
- Clareview (northern terminus)
- Mill Woods (Valley Line terminus)

### 2. ✅ React Performance Optimization

**Problems**: Function recreation on every render, expensive time conversions, missing memoization.

**Solutions implemented in `src/main.tsx`:**

- Added `useCallback` for `fetchDepartures` and `getUserLocationAndFetch` to prevent function recreation
- Added `useMemo` for `processedDepartures` with pre-computed time conversions using `displayTime` property
- Fixed useEffect dependencies to include memoized functions
- Eliminated inline `convertServiceTimeToClockTime()` calls in render loop

**Result**: Significantly improved rendering performance by reducing unnecessary re-renders and expensive computations.

### 3. ✅ Location Permission Persistence

**Problem**: Location permission state didn't persist between page loads, causing poor UX.

**Solutions implemented:**

- Added `navigator.permissions.query()` to check geolocation permission state
- Implemented permission change listeners to react to permission updates
- Enhanced geolocation options with timeout (10s) and cache duration (5min)
- Improved error handling with specific fallback to test coordinates
- Better status messages based on permission state

**Solutions implemented:**

- Added `navigator.permissions.query()` to check geolocation permission state
- Enhanced geolocation options with timeout (10s) and fresh location requests (`maximumAge: 0`)
- Improved error handling with specific fallback to test coordinates
- Better status messages based on permission state
- **Fresh location on app focus**: Added `visibilitychange` and `focus` event listeners to refresh location when PWA is launched or becomes visible
- **Always fresh location on refresh**: Set `maximumAge: 0` to ensure manual refresh gets current GPS coordinates

**Result**: App now always provides current location-based departures, whether user moves, returns to app, or manually refreshes. No more stale location data.

## Testing

### Test Coverage

- `time-utils.test.ts` - Comprehensive tests for time conversion and GTFS service date logic
- `stop-utils.test.ts` - Full test suite for station/stop operations including terminus filtering

### Running Tests

- `npm test` - Run all tests with Vitest
- `npm run test:coverage` - Run tests with coverage report
- `npm test -- stop-utils` - Run specific test file

### Key Test Features

- **Terminus filtering tests**: Validates that terminating trips are properly filtered out at terminus stations
- **Mock GTFS data**: Uses proper TypeScript types with mocked `getStops()` and `getStoptimes()` functions
- **Edge case coverage**: Tests null/undefined headsigns, missing parent stations, sorting, and limits
- **79.13% coverage** on stop-utils.ts core business logic

## Additional Improvements (September 2025)

### 4. ✅ Comprehensive Test Suite for stop-utils.ts

**Achievement**: Created full test coverage for the critical stop utilities, especially the terminus filtering logic.

**Tests implemented:**

- `getClosestStation()`: Location-based station finding with coordinate handling
- `getStopsForParentStation()`: Platform retrieval for stations
- `getDeparturesForStop()`: **Comprehensive terminus filtering tests** validating that terminating trips are properly excluded
- **Edge cases**: Null/undefined headsigns, missing parent stations, sorting, limits
- **Proper TypeScript mocking**: Full GTFS data type compliance

**Result**: 79.13% coverage with robust validation of the terminus station bug fixes.

### 5. ✅ Documentation and Deployment Updates

**Achievement**: Updated project documentation with new database scripts and optimized deployment instructions.

**Updates made:**

- **package.json**: Added `db:slim-filtered` script for operational stop filtering
- **README.md**:
    - Documented the enhanced filtering script that excludes maintenance stops
    - Updated deployment instructions emphasizing local builds for faster Fly.io deploys
    - Added clear guidance on database script options
- **CLAUDE.md**: Comprehensive documentation of all bug fixes and improvements for future Claude Code instances

**Result**: Clear documentation trail for the enhanced filtering and optimized deployment workflow.

### 6. ✅ iOS Mobile UX Improvements

**Achievement**: Fixed iOS-specific UX issues with the station picker combobox to improve mobile experience.

**Problems addressed:**

- **Auto-focus keyboard popup**: Station picker search input was auto-focusing on open, causing keyboard to appear immediately on iOS
- **iOS zoom on input focus**: When manually tapping the search input, iOS Safari would zoom the viewport due to small font size

**Solutions implemented in `src/components/StationPicker.tsx`:**

- Added `tabIndex={-1}` to CommandInput to prevent auto-focus behavior
- Added `autoFocus={false}` as additional prevention
- Added `text-base` class to ensure 16px font-size minimum (prevents iOS zoom)
- Added `viewport-fit=cover` to index.html for better safe area handling

**Code changes:**

```typescript
<CommandInput
    placeholder="Search stations..."
    className="text-popover-foreground placeholder-muted-foreground [&>svg]:text-muted-foreground h-10 border-none bg-transparent text-base"
    autoFocus={false}
    tabIndex={-1}
/>
```

**Result**: Smooth mobile experience on iOS - no unwanted keyboard popup on open, no viewport zoom when manually searching.

### 7. ✅ PWA Theme and Overscroll Improvements

**Achievement**: Fixed PWA-specific issues with theme colors and overscroll behavior on iOS.

**Problems addressed:**

- **Status bar theme mismatch**: PWA status bar color was based on iOS system appearance, not app's theme toggle
- **PWA overscroll bounce**: Rubber band scrolling effect in PWA mode despite CSS prevention attempts
- **Theme color meta tag conflicts**: Multiple theme-color meta tags causing inconsistent behavior

**Solutions implemented:**

**Dynamic theme-color updates in `src/components/theme-provider.tsx`:**

```typescript
// Update all theme-color meta tags dynamically
const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
const themeColor = actualTheme === 'dark' ? '#242424' : '#ffffff';
themeColorMetas.forEach((meta) => {
    meta.setAttribute('content', themeColor);
});
```

**PWA-specific CSS in `src/globals.css`:**

```css
@media (display-mode: standalone) {
    html,
    body {
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
    }
}
```

**Main element overscroll prevention in `src/main.tsx`:**

```typescript
// Updated className with comprehensive overscroll prevention
className =
    'text-foreground font-display sm:overflow-none relative flex min-h-dvh w-full flex-col items-center justify-start overflow-y-auto overscroll-none px-4 sm:min-h-screen sm:overscroll-none';
```

**Theme colors configured:**

- Light mode: `#ffffff` (white)
- Dark mode: `#242424` (dark gray)
- Manifest: `#242424` (optimized for dark mode)

**Result**: PWA status bar now properly reflects app theme toggle regardless of iOS system appearance. Overscroll bouncing eliminated in PWA mode.

**Note**: Some JavaScript overscroll prevention code remains in theme-provider.tsx but may need cleanup as CSS solution proved sufficient.

### 8. ✅ Main Component Refactoring and Code Organization

**Achievement**: Completely refactored main.tsx into smaller, reusable components for better maintainability and reasoning.

**Problems addressed:**

- **Overly complex loading skeleton**: 65+ lines of complex skeleton code making the component hard to read
- **Monolithic main component**: Single 263-line file handling all UI concerns
- **Poor separation of concerns**: Location logic, UI components, and business logic mixed together
- **Difficult maintenance**: Changes required editing a large, complex file

**Solutions implemented:**

**Created new components:**

- **`src/components/Header.tsx`**: Extracted header section with station picker and theme toggle
- **`src/components/DeparturesTable.tsx`**: Extracted departures table with platform layout and animations
- **`src/components/Footer.tsx`**: Extracted footer with creator badge, timestamp, and refresh button
- **`src/hooks/useLocationManager.ts`**: Extracted all location-related logic into a custom hook

**Simplified loading state:**

```typescript
// Before: 65+ lines of complex skeleton
// After: Simple loading message
{loading || isTransitioning ? (
    <div className="relative p-8 text-center">
        <div className="text-muted-foreground text-sm">
            {status || 'Loading departures...'}
        </div>
    </div>
) : (
    // Component content
)}
```

**Main component structure:**

```typescript
// Simplified main.tsx structure
return (
    <main className="...">
        <div className="...">
            <Header
                selectedStation={selectedStation}
                onStationSelect={fetchDeparturesForStation}
                userLocation={userLocation}
            />
            {loading || isTransitioning ? (
                <SimpleLoadingState />
            ) : (
                <>
                    <DeparturesTable
                        processedDepartures={processedDepartures}
                        departuresKey={departuresKey}
                        isTransitioning={isTransitioning}
                    />
                    <Footer
                        lastUpdated={lastUpdated}
                        onRefresh={getUserLocationAndFetch}
                    />
                </>
            )}
        </div>
    </main>
);
```

**Location management hook:**

```typescript
// Extracted complex location logic into reusable hook
const { getUserLocationAndFetch } = useLocationManager({
    onLocationSuccess: fetchDepartures,
    onStatusChange: setStatus,
});
```

**Results:**

- **69% reduction** in main.tsx size: 263 lines → 82 lines
- **Removed complex skeleton**: 65+ lines → 4 lines
- **Better separation of concerns**: Each component has single responsibility
- **Improved maintainability**: Changes can be made to individual components
- **Enhanced reusability**: Components can be used independently
- **Cleaner code**: Much easier to reason about and understand
- **No functionality loss**: All existing features and animations preserved

**Component breakdown:**

- `main.tsx`: Core app logic and state management (82 lines)
- `Header.tsx`: Station picker and theme controls (37 lines)
- `DeparturesTable.tsx`: Departures display and animations (84 lines)
- `Footer.tsx`: About section and controls (46 lines)
- `useLocationManager.ts`: Location handling logic (76 lines)

**File structure improvements:**

```
src/
├── components/
│   ├── Header.tsx          (new)
│   ├── DeparturesTable.tsx (new)
│   └── Footer.tsx          (new)
├── hooks/
│   └── useLocationManager.ts (new)
└── main.tsx                (simplified)
```

### 9. ✅ Type Safety and API Architecture Improvements

**Achievement**: Eliminated all `any` types and implemented comprehensive API request management with advanced error handling.

**Problems addressed:**

- **TypeScript `any` types**: Multiple instances of `any` defeating type safety
- **Duplicate interface definitions**: Same types defined in multiple files
- **Basic error handling**: Simple catch blocks with minimal user feedback
- **No request management**: No deduplication, retries, or timeout handling
- **API design issues**: Missing endpoints and inconsistent response structures

**Solutions implemented:**

**Shared type definitions created:**

- **`src/types/departures.ts`**: Core application types (Station, Departure, API responses)
- **`src/types/gtfs.ts`**: GTFS-specific types with proper SqlWhere compatibility

**Advanced API request management:**

```typescript
// useApiRequest hook with comprehensive features
const { fetchDepartures, fetchStationDepartures } = useApiRequest();

// Features:
- Request deduplication (prevents duplicate concurrent requests)
- Configurable timeouts and retries with exponential backoff
- AbortController integration for proper cancellation
- Type-safe API methods with proper response typing
```

**Centralized error handling:**

```typescript
// useErrorHandler hook for user-friendly error management
const { error, clearError, hasError, handleApiError } = useErrorHandler();

// Features:
- Structured error types with timestamps and codes
- User-dismissible error display in UI
- API-specific error handlers for network/HTTP errors
- Integration ready for Sentry error tracking
```

**Enhanced API endpoints:**

- **`GET /api/stations`**: List all stations with optional distance sorting
- **`GET /api/stations/:id/departures`**: Station-specific departures
- **`GET /api/departures/nearby`**: Location-based departures (existing)

**Type safety improvements:**

```typescript
// Before: Unsafe any types
const query: any = { location_type: 1 };
catch (error: any) { throw new Error(error); }

// After: Proper TypeScript types
const query: StopQuery = { location_type: 1 };
catch (error: unknown) {
  throw new Error(error instanceof Error ? error.message : String(error));
}
```

**Results:**

- **100% elimination** of `any` types from codebase
- **Request deduplication** prevents unnecessary API calls
- **Automatic retry logic** handles temporary network issues
- **User-friendly error display** with dismiss functionality
- **Complete type safety** throughout data fetching pipeline
- **Enhanced API architecture** with better endpoint organization
- **Improved developer experience** with better IntelliSense and error detection

**File structure after improvements:**

```
src/
├── types/
│   ├── departures.ts       (new - shared app types)
│   └── gtfs.ts            (new - GTFS database types)
├── hooks/
│   ├── useApiRequest.ts   (new - advanced API management)
│   ├── useErrorHandler.ts (new - centralized error handling)
│   └── useLocationManager.ts
├── api/
│   └── stations.ts        (enhanced - added list endpoint)
└── components/            (updated to use shared types)
```

**Breaking change fixes:**

- **StationPicker functionality restored**: Added missing `/api/stations` endpoint that was required for station list display
- **Type consistency**: All components now use shared type definitions instead of duplicating interfaces
