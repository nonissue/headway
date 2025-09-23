import { GeoCoordinate } from '../types/global.js';
import { TEST_COORDS } from '../config.js';
import {
    getClosestStation,
    getStopsForParentStation,
    getDeparturesForStop,
} from '../lib/stop-utils.js';

export const getNearbyDepartures = async ({ lat, lon }: GeoCoordinate = {}) => {
    if (!lat || !lon) {
        throw new Error('lat & lon are required to find nearby departures');
    }

    let closestStation;

    if (!lat || !lon) {
        // console.warn(
        //     'get-nearby-departures: using TEST_COORDS (for some reason)'
        // );

        closestStation = await getClosestStation(TEST_COORDS);
    } else {
        // console.warn(
        //     `get-nearby-departures: using user (?) location: {lat: ${lat}, lon: ${lon}}`
        // );

        closestStation = await getClosestStation({ lat, lon });
    }

    const stops = await getStopsForParentStation(closestStation.stop_id);

    const departures = await Promise.all(
        stops.map((stop) => getDeparturesForStop({ stopId: stop.stop_id }))
    );

    const [departuresA, departuresB] = [
        departures[0] ?? [],
        departures[1] ?? [],
    ];

    const result = {
        closestStation: closestStation,
        departures: [[...departuresA], [...departuresB]],
    };

    return result;
};
