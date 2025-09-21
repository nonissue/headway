// GTFS/Database related types

export interface StopQuery {
    location_type: number;
    stop_lat?: number;
    stop_lon?: number;
    [key: string]: string | number | undefined;
}

export interface Stop {
    stop_id: string;
    stop_name: string;
    stop_lat?: number;
    stop_lon?: number;
    location_type?: number;
    parent_station?: string;
}

export interface StopTime {
    stop_id: string;
    trip_id: string;
    departure_time: string;
    stop_headsign: string;
    departure_timestamp: number;
}

export interface GeoCoordinate {
    lat: number;
    lon: number;
}