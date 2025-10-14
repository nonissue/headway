import { GeoCoordinate } from '../types/global.js';
import {
    getClosestStation,
    getDeparturesForStation,
} from '../lib/stop-utils.js';

/*
Glue together the pieces required to fetch all platform departures for the
closest LRT station to the provided coordinates:

1. getClosestStation: find the nearest station to the specified coordinates
2. getDeparturesForStation: expand the station into platforms + departures
*/

export const getNearbyDepartures = async ({ lat, lon }: GeoCoordinate = {}) => {
    if (lat == null || lon == null) {
        throw new Error('lat & lon are required to find nearby departures');
    }

    const closestStation = await getClosestStation({ lat, lon });

    const { platforms } = await getDeparturesForStation(closestStation);

    return {
        station: closestStation,
        platforms,
    };
};
