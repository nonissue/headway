export interface Departure {
    stop_id: string;
    trip_id: string;
    stop_headsign: string | null;
    departure_time: string;
    departure_timestamp?: number;
    scheduled_at?: string;
    line?: string;
}

export interface ProcessedDeparture extends Departure {
    displayTime: string;
    displayHeadsign: string;
}

export interface DepartureGroup {
    heading: string;
    destinations: string[];
    departures: ProcessedDeparture[];
}

export interface Station {
    stop_id: string;
    stop_name: string;
    stop_lat?: number;
    stop_lon?: number;
    lines?: string[];
}

export interface PlatformDepartures {
    stop: Station;
    departures: Departure[];
}

export interface DeparturesResponse {
    station: Station;
    platforms: PlatformDepartures[];
    timestamp: string;
}

export interface StationDeparturesResponse {
    station: Station;
    platforms: PlatformDepartures[];
    timestamp: string;
}

export interface StationsResponse {
    stations: Station[];
    timestamp: string;
}

export interface StopDeparturesResponse {
    stopId: string;
    departures: Departure[];
    timestamp: string;
}

export interface ApiErrorResponse {
    error: string;
    timestamp: string;
}

export interface LocationCoordinates {
    lat: number;
    lon: number;
}
