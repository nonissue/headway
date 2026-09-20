import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb, closeDb } from 'gtfs';
import { getDeparturesForStation, getDeparturesForStop } from './stop-utils';
import { departureClockTime } from './scheduled-time';
import { departureMinutes } from './departure-countdown';
import { toDepartureDto } from './api-mappers';

// Use the installed GTFS library and a real SQLite database: mocking its query
// results hid the arrival-time filter and calendar/service-date boundary bugs.
let db: ReturnType<typeof openDb>;
const seconds = (time: string) =>
    time.split(':').reduce((n, part) => n * 60 + Number(part), 0);
function trip(
    id: string,
    date: number,
    departure: string,
    arrival = departure,
    stop = 'p'
) {
    db.prepare('INSERT INTO calendar_dates VALUES (?, ?, 1)').run(id, date);
    db.prepare("INSERT INTO trips VALUES (?, 'r', ?)").run(id, id);
    db.prepare(
        "INSERT INTO stop_times VALUES (?, ?, 'Clareview', ?, ?, ?, ?)"
    ).run(stop, id, arrival, departure, seconds(arrival), seconds(departure));
}
const rows = (result: Awaited<ReturnType<typeof getDeparturesForStation>>) =>
    result.platforms.flatMap((p) => p.departures);
const ids = (result: Awaited<ReturnType<typeof getDeparturesForStation>>) =>
    rows(result).map((d) => d.trip_id);

beforeEach(() => {
    vi.useFakeTimers();
    db = openDb({ sqlitePath: ':memory:' });
    db.exec(`
        CREATE TABLE stops(stop_id TEXT, stop_name TEXT, parent_station TEXT);
        CREATE TABLE routes(route_id TEXT, route_short_name TEXT, route_long_name TEXT);
        CREATE TABLE trips(trip_id TEXT, route_id TEXT, service_id TEXT);
        CREATE TABLE stop_times(stop_id TEXT, trip_id TEXT, stop_headsign TEXT, arrival_time TEXT, departure_time TEXT, arrival_timestamp INTEGER, departure_timestamp INTEGER);
        CREATE TABLE calendar(service_id TEXT, start_date INTEGER, end_date INTEGER, monday INTEGER, tuesday INTEGER, wednesday INTEGER, thursday INTEGER, friday INTEGER, saturday INTEGER, sunday INTEGER);
        CREATE TABLE calendar_dates(service_id TEXT, date INTEGER, exception_type INTEGER);
        INSERT INTO stops VALUES ('s', 'Test Station', NULL), ('p', 'Platform', 's');
        INSERT INTO routes VALUES ('r', 'Metro', 'Metro Line');
    `);
});
afterEach(() => {
    closeDb(db);
    vi.useRealTimers();
});

describe('GTFS departure windows', () => {
    it('merges overnight and morning service within the same elapsed-time window', async () => {
        vi.setSystemTime(new Date('2026-09-20T07:30:00Z')); // 01:30 MDT
        trip('overnight', 20260919, '25:40:00');
        trip('morning', 20260920, '05:15:00');
        trip('outside', 20260920, '05:31:00');
        const result = await getDeparturesForStation('s');
        expect(ids(result)).toEqual(['overnight', 'morning']);
        expect(result.nextServiceAt).toBeUndefined();
    });
    it('ignores untimed stops without losing timed departures', async () => {
        vi.setSystemTime(new Date('2026-09-20T14:00:00Z'));
        trip('timed', 20260920, '08:05:00');
        trip('untimed', 20260920, '08:10:00');
        db.exec(
            "UPDATE stop_times SET arrival_time=NULL, departure_time=NULL, arrival_timestamp=NULL, departure_timestamp=NULL WHERE trip_id='untimed'"
        );
        expect(ids(await getDeparturesForStation('s'))).toEqual(['timed']);
    });
    it('keeps a train dwelling at the platform until its departure time', async () => {
        vi.setSystemTime(new Date('2026-09-20T14:00:00Z'));
        trip('dwelling', 20260920, '08:05:00', '07:55:00');
        trip('tomorrow', 20260921, '08:00:00');
        const result = await getDeparturesForStation('s');
        expect(ids(result)).toEqual(['dwelling']);
        expect(result.nextServiceAt).toBeUndefined();
    });
    it('retains a three-minute recent departure across 05:00 and expires it', async () => {
        trip('recent', 20260919, '28:59:00');
        trip('next', 20260920, '05:10:00');
        vi.setSystemTime(new Date('2026-09-20T11:02:00Z'));
        expect(ids(await getDeparturesForStation('s'))).toEqual([
            'recent',
            'next',
        ]);
        vi.setSystemTime(new Date('2026-09-20T11:02:00.001Z'));
        expect(ids(await getDeparturesForStation('s'))).toEqual(['next']);
    });
    it('handles trips beyond 48 hours using the feed rather than a fixed overlap', async () => {
        vi.setSystemTime(new Date('2026-09-21T09:00:00Z'));
        trip('long-service-day', 20260919, '51:15:00');
        expect(ids(await getDeparturesForStation('s'))).toEqual([
            'long-service-day',
        ]);
    });
    it('applies the result limit after merging service dates in time order', async () => {
        vi.setSystemTime(new Date('2026-09-20T10:50:00Z'));
        trip('later-old-service', 20260919, '29:10:00');
        trip('earlier-new-service', 20260920, '05:00:00');
        const result = await getDeparturesForStop({ stopId: 'p', limit: 1 });
        expect(result.map((d) => d.trip_id)).toEqual(['earlier-new-service']);
    });
    it('honours calendar removals and date-specific additions', async () => {
        vi.setSystemTime(new Date('2026-09-20T14:00:00Z'));
        trip('removed', 20260920, '08:05:00');
        db.prepare(
            'INSERT INTO calendar VALUES (?, ?, ?, 1, 1, 1, 1, 1, 1, 1)'
        ).run('removed', 20260901, 20260930);
        db.prepare(
            "UPDATE calendar_dates SET exception_type=2 WHERE service_id='removed'"
        ).run();
        trip('special', 20260920, '08:10:00');
        expect(ids(await getDeparturesForStation('s'))).toEqual(['special']);
    });
    it('keeps separate occurrences of the same trip on overlapping service dates', async () => {
        vi.setSystemTime(new Date('2026-09-20T06:00:00Z'));
        trip('daily', 20260919, '24:30:00');
        db.prepare(
            "INSERT INTO calendar_dates VALUES ('daily', 20260920, 1)"
        ).run();
        const result = await getDeparturesForStop({
            stopId: 'p',
            lookaheadMins: 26 * 60,
        });
        expect(result.map((d) => d.scheduled_at)).toEqual([
            '2026-09-20T06:30:00.000Z',
            '2026-09-21T06:30:00.000Z',
        ]);
    });
});

describe('daylight-saving transitions', () => {
    it('does not skip a 03:30 departure at 03:15 on spring-forward night', async () => {
        vi.setSystemTime(new Date('2026-03-08T09:15:00Z'));
        trip('overnight', 20260307, '26:30:00');
        trip('morning', 20260308, '08:00:00');
        const result = await getDeparturesForStation('s');
        expect(ids(result)).toEqual(['overnight']);
        expect(result.nextServiceAt).toBeUndefined();
        expect(departureClockTime(rows(result)[0])).toBe('03:30:00');
        expect(
            departureMinutes(toDepartureDto(rows(result)[0]), Date.now())
        ).toBe(15);
    });
    it.each([
        ['2026-11-01T07:15:00Z', ['first-0130', 'second-0130'], [15, 75]],
        ['2026-11-01T08:15:00Z', ['second-0130'], [15]],
    ])(
        'distinguishes both autumn 01:30 departures at %s',
        async (now, expected, minutes) => {
            vi.setSystemTime(new Date(now));
            trip('first-0130', 20261031, '25:30:00');
            trip('second-0130', 20261031, '26:30:00');
            const result = await getDeparturesForStation('s');
            expect(ids(result)).toEqual(expected);
            expect(rows(result).map((d) => departureClockTime(d))).toEqual(
                expected.map(() => '01:30:00')
            );
            expect(
                rows(result).map((d) =>
                    departureMinutes(toDepartureDto(d), Date.now())
                )
            ).toEqual(minutes);
        }
    );
});

describe('next-service fallback', () => {
    it.each([
        ['2026-09-20T05:30:00Z', 20260920, '2026-09-20T11:55:00.000Z'],
        ['2026-09-20T07:30:00Z', 20260920, '2026-09-20T11:55:00.000Z'],
        ['2027-01-01T06:30:00Z', 20270101, '2027-01-01T12:55:00.000Z'],
    ])(
        'shows the next four hours of service at %s',
        async (now, date, first) => {
            vi.setSystemTime(new Date(now));
            trip('first', date, '05:55:00');
            trip('last', date, '09:55:00');
            trip('outside', date, '10:00:00');
            const result = await getDeparturesForStation('s');
            expect(result.nextServiceAt).toBe(first);
            expect(ids(result)).toEqual(['first', 'last']);
        }
    );
    it('does not skip later service today to show tomorrow', async () => {
        vi.setSystemTime(new Date('2026-09-20T11:00:00Z'));
        trip('today', 20260920, '10:00:00');
        trip('tomorrow', 20260921, '05:55:00');
        const result = await getDeparturesForStation('s');
        expect(ids(result)).toEqual(['today']);
        expect(result.nextServiceAt).toBe('2026-09-20T16:00:00.000Z');
    });
    it('checks all platforms before falling back', async () => {
        vi.setSystemTime(new Date('2026-09-20T05:30:00Z'));
        db.exec("INSERT INTO stops VALUES ('p2', 'Platform 2', 's')");
        trip('tonight', 20260919, '23:40:00', '23:40:00', 'p2');
        trip('tomorrow', 20260920, '05:55:00');
        const result = await getDeparturesForStation('s');
        expect(ids(result)).toEqual(['tonight']);
        expect(result.nextServiceAt).toBeUndefined();
    });
    it('remains empty when no service is published through the next service day', async () => {
        vi.setSystemTime(new Date('2026-09-20T05:30:00Z'));
        trip('too-far-away', 20260922, '05:55:00');
        const result = await getDeparturesForStation('s');
        expect(ids(result)).toEqual([]);
        expect(result.nextServiceAt).toBeUndefined();
    });
});
