import { GeoCoordinate } from '../types/global.js';
import { TEST_COORDS } from '../config.js';
import {
    getClosestStation,
    getStopsForParentStation,
    getDeparturesForStop,
} from '../lib/stop-utils.js';

/* 

Kind of opaquely (jankily?) glues together the logical pieces we need to accomplish our goal 
of fetching the departures (from two stops or 'platforms') for the closest LRT station to
the provided coordinates

1. getClosestStation: Find the closest LRT station to specified coordinates
2. getStopsForParentStation: Lookup what 'stops' are the children of that 'parent'
3. getDeparturesForStop: Collect the departures for the 'stations' platform(s) 

*/

export const getNearbyDepartures = async ({ lat, lon }: GeoCoordinate = {}) => {
    if (!lat || !lon) {
        throw new Error('lat & lon are required to find nearby departures');
    }

    let closestStation;

    if (!lat || !lon) {
        closestStation = await getClosestStation(TEST_COORDS);
    } else {
        closestStation = await getClosestStation({ lat, lon });
    }

    const stops = await getStopsForParentStation(closestStation.stop_id);

    const departures = await Promise.all(
        stops.map((stop) =>
            getDeparturesForStop({
                stopId: stop.stop_id,
            })
        )
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
