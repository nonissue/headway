import type { LocationCoordinates, Station } from '../types/departures';

export const FAVOURITES_KEY = 'headway:favourite-stations';

export function readFavouriteStations(): string[] {
    try {
        const value: unknown = JSON.parse(
            localStorage.getItem(FAVOURITES_KEY) || '[]'
        );
        return Array.isArray(value)
            ? [
                  ...new Set(
                      value.filter((id): id is string => typeof id === 'string')
                  ),
              ]
            : [];
    } catch {
        return [];
    }
}

// Straight-line distance, deliberately not a walking-route estimate.
export function stationDistance(
    station: Station,
    location?: LocationCoordinates
): number | undefined {
    if (
        !location ||
        !Number.isFinite(station.stop_lat) ||
        !Number.isFinite(station.stop_lon)
    )
        return undefined;
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const lat = radians(station.stop_lat! - location.lat);
    const lon = radians(station.stop_lon! - location.lon);
    const a =
        Math.sin(lat / 2) ** 2 +
        Math.cos(radians(location.lat)) *
            Math.cos(radians(station.stop_lat!)) *
            Math.sin(lon / 2) ** 2;
    return (
        6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
    );
}

export function formatStationDistance(metres: number): string {
    return metres < 1000
        ? `${Math.round(metres / 10) * 10} m`
        : `${(metres / 1000).toFixed(1)} km`;
}

export function stationName(station: Station): string {
    return station.stop_name
        .replace(/\s+Station$/i, '')
        .replace(/\s+Stop$/i, '');
}
