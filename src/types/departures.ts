export interface Departure {
    stop_id: string;
    trip_id: string;
    stop_headsign: string;
    departure_time: string;
    departure_timestamp: number;
}

export interface ProcessedDeparture extends Departure {
    displayTime: string;
}

export interface Station {
    stop_id: string;
    stop_name: string;
    stop_lat?: number;
    stop_lon?: number;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    timestamp?: string;
}

export interface DeparturesResponse {
    closestStation: Station;
    departures: Departure[][];
}

export interface StationDeparturesResponse {
    stationId: string;
    departures: Departure[][];
    timestamp: string;
}

export interface LocationCoordinates {
    lat: number;
    lon: number;
}
