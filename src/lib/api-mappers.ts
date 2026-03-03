import type { Stop } from 'gtfs';
import type {
    Departure,
    PlatformDepartures,
    Station,
} from '../types/departures.js';
import type {
    PlatformDepartures as InternalPlatformDepartures,
    StopDepartures as InternalStopDepartures,
} from './stop-utils.js';

export function toStationDto(
    stop: Pick<Stop, 'stop_id' | 'stop_name' | 'stop_lat' | 'stop_lon'>
): Station {
    return {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name ?? stop.stop_id,
        stop_lat: stop.stop_lat,
        stop_lon: stop.stop_lon,
    };
}

export function toDepartureDto(departure: InternalStopDepartures): Departure {
    return {
        stop_id: departure.stop_id,
        trip_id: departure.trip_id,
        stop_headsign: departure.stop_headsign ?? null,
        departure_time: departure.departure_time,
        departure_timestamp: departure.departure_timestamp,
    };
}

export function toPlatformDto(
    platform: InternalPlatformDepartures
): PlatformDepartures {
    return {
        stop: toStationDto(platform.stop),
        departures: platform.departures.map(toDepartureDto),
    };
}

export function createTimestamp(): string {
    return new Date().toISOString();
}
