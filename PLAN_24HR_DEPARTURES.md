# Plan: 24-Hour Departure Windows Spanning Multiple GTFS Service Days

## Current State Analysis

### How It Works Now
- **Current lookahead**: 120 minutes (2 hours) from `DEFAULT_LOOK_AHEAD_IN_MINS`
- **Service day model**: GTFS service days run from 5:00 AM to 4:59 AM next day (`SERVICE_DAY_START_HOUR = 5`)
- **Single service day queries**: `getDeparturesForStop()` queries ONE service date at a time
- **Time handling**:
  - `getServiceDate()` determines which service day we're in
  - `getGtfsServiceTime()` converts clock time to GTFS service time (can be 00:00-47:59)
  - Times after midnight but before 5 AM get 24h added (e.g., 02:30 → 26:30)

### The Challenge with 24-Hour Windows

**You're absolutely right** - a 24-hour window will ALWAYS span multiple service days:

| Current Clock Time | Service Day | 24h Window Covers | Service Days Needed |
|-------------------|-------------|-------------------|---------------------|
| 10:00 AM | Today | 10 AM today → 10 AM tomorrow | Today + Tomorrow |
| 11:00 PM | Today | 11 PM today → 11 PM tomorrow | Today + Tomorrow |
| 2:00 AM | Yesterday (!) | 2 AM → 2 AM same calendar day | Yesterday + Today |

**Key insight**: When it's 2:00 AM on Tuesday (calendar), we're still in Monday's service day (because cutover is 5 AM). A 24h window from 26:00 (2 AM service time) goes to 50:00, which crosses into Tuesday's service day.

## Proposed Solution

### Option 1: Multi-Day Query Strategy (RECOMMENDED)

Query multiple service dates and merge results:

```typescript
/**
 * Get departures spanning up to 24 hours from now
 * Queries 2-3 service days and merges results
 */
export async function get24HourDepartures(opts: {
    stopId: string;
    baseTime?: Date;
    tz?: string;
    serviceDayStartHour?: number;
}): Promise<StopDepartures[]> {
    const tz = opts.tz ?? DEFAULT_TIMEZONE;
    const cut = opts.serviceDayStartHour ?? SERVICE_DAY_START_HOUR;
    const baseTime = opts.baseTime ?? new Date();

    // 1. Determine current service time and date
    const startServiceTime = getGtfsServiceTime({ baseTime, tz, serviceDayStartHour: cut });
    const currentServiceDate = getServiceDate({
        calendarDate: baseTime,
        targetTime: convertServiceTimeToClockTime(startServiceTime),
        tz,
        serviceDayStartHour: cut
    });

    // 2. Calculate end time (24h from now in service time)
    const endServiceTime = getGtfsServiceTime({
        baseTime,
        tz,
        serviceDayStartHour: cut,
        offsetMins: 24 * 60
    });

    // 3. Determine how many service days we need to query
    const [startHour] = startServiceTime.split(':').map(Number);
    const [endHour] = endServiceTime.split(':').map(Number);

    // Calculate which service days to query
    const serviceDatesToQuery: number[] = [currentServiceDate];

    // If end time is in the next calendar day's service period
    if (endHour >= 24) {
        // Need next service day
        serviceDatesToQuery.push(addDays(currentServiceDate, 1));
    }

    // If we're early in service day and window extends far
    if (startHour >= 24 && endHour >= 48) {
        // Rare case: started after midnight, extends into next service day
        serviceDatesToQuery.push(addDays(currentServiceDate, 1));
    }

    // 4. Query each service day and collect results
    const allDepartures: StopDepartures[] = [];

    for (let i = 0; i < serviceDatesToQuery.length; i++) {
        const serviceDate = serviceDatesToQuery[i];
        const isFirstDay = i === 0;
        const isLastDay = i === serviceDatesToQuery.length - 1;

        // Determine time range for this service day
        let dayStartTime: string;
        let dayEndTime: string;

        if (isFirstDay && isLastDay) {
            // Only one day needed - use full range
            dayStartTime = startServiceTime;
            dayEndTime = endServiceTime;
        } else if (isFirstDay) {
            // First of multiple days - from start to end of service day
            dayStartTime = startServiceTime;
            dayEndTime = '47:59:59'; // Max GTFS time for a service day
        } else if (isLastDay) {
            // Last of multiple days - from beginning to end time
            dayStartTime = '00:00:00';
            // Convert endServiceTime back to 0-47 range for this service day
            dayEndTime = endServiceTime; // TODO: may need adjustment
        } else {
            // Middle day - entire service day
            dayStartTime = '00:00:00';
            dayEndTime = '47:59:59';
        }

        const stoptimes = getStoptimes({
            stop_id: opts.stopId,
            date: serviceDate,
            start_time: dayStartTime,
            end_time: dayEndTime,
        }, [
            'stop_id',
            'trip_id',
            'stop_headsign',
            'departure_time',
            'departure_timestamp',
        ], [
            ['departure_time', 'ASC']
        ]) as StopDepartures[];

        allDepartures.push(...stoptimes);
    }

    // 5. Sort by absolute time (departure_timestamp) or service time
    allDepartures.sort((a, b) => {
        if (a.departure_timestamp != null && b.departure_timestamp != null) {
            return a.departure_timestamp - b.departure_timestamp;
        }
        return a.departure_time.localeCompare(b.departure_time);
    });

    // 6. Filter to exactly 24 hours from now
    // Note: May need to calculate actual wall-clock time from service time
    // and filter based on actual time difference

    return allDepartures;
}
```

**Advantages:**
- ✅ Handles all edge cases (midnight crossover, service day boundaries)
- ✅ Works with existing GTFS library API
- ✅ Returns complete dataset for 24h window
- ✅ Maintains existing terminus filtering logic

**Challenges:**
- ⚠️ Need to correctly calculate service day boundaries
- ⚠️ May return too many results (need precise 24h cutoff)
- ⚠️ Complex time math when spanning 2-3 service days

### Option 2: Timestamp-Based Filtering (ALTERNATIVE)

If GTFS data includes `departure_timestamp` (Unix epoch), use that:

```typescript
export async function get24HourDepartures(opts: GetDeparturesOptions) {
    // Query liberally (e.g., 2-3 service days)
    const allDepartures = await queryMultipleServiceDays(opts);

    // Filter to exactly 24h using timestamps
    const now = opts.baseTime ?? new Date();
    const nowTs = Math.floor(now.getTime() / 1000);
    const endTs = nowTs + (24 * 60 * 60);

    return allDepartures.filter(d => {
        if (d.departure_timestamp == null) return true; // keep if no timestamp
        return d.departure_timestamp >= nowTs && d.departure_timestamp < endTs;
    });
}
```

**Advantages:**
- ✅ Simpler logic - just filter by timestamp
- ✅ Precise 24-hour windows
- ✅ No complex service time math

**Challenges:**
- ❌ Requires `departure_timestamp` in GTFS data (may not always be present)
- ❌ Still need to query multiple service days first

## Implementation Plan

### Phase 1: Foundation Work
1. **Add helper function** to calculate service date range for N hours
   - Input: start time, duration in hours
   - Output: array of service dates to query
2. **Add utility** to convert service time + service date → Unix timestamp
3. **Create new function** `get24HourDeparturesForStop()` using Option 1 approach
4. **Write comprehensive tests** for edge cases:
   - Midnight crossovers (e.g., 23:00 → 23:00 next day)
   - Early morning (e.g., 02:00 → 02:00, spans 3 service days)
   - Service day boundary (e.g., 04:30 → 04:30)

### Phase 2: API Updates
1. **Update `getDeparturesForStation()`** to use new 24h function
2. **Remove lookahead parameter** from API (always 24h now)
3. **Update limit handling** - may want to increase `DEFAULT_STOP_COUNT_LIMIT` since more departures
4. **Add optional filtering** to let clients request less than 24h if needed

### Phase 3: UI Updates
1. **Remove lookahead config** from frontend
2. **Update display logic** to handle larger departure lists
3. **Add visual indicators** for:
   - "Tomorrow" departures
   - "Late night" (after midnight) vs "Early morning" (before 5 AM)
4. **Consider grouping** by calendar day or time periods

### Phase 4: Testing & Validation
1. **Test at critical times**:
   - 11:59 PM - 12:01 AM (midnight crossing)
   - 4:00 AM - 5:00 AM (service day cutover)
   - Mid-day (simple case)
2. **Verify terminus filtering** still works across multiple service days
3. **Load testing** - ensure performance is acceptable with larger result sets

## Edge Cases to Handle

### Service Time Math
- **26:30:00** (2:30 AM service time) + 24h = **50:30:00**
  - This exceeds single service day (max 47:59:59)
  - Need to query: current service day (26:30 - 47:59) + next service day (00:00 - 26:30)

### Calendar Day Boundaries
- Query at **2:00 AM Tuesday calendar time**:
  - Service day: Monday (because cutover is 5 AM)
  - Service time: 26:00:00
  - 24h window: 26:00 → 50:00
  - Service days needed: Monday + Tuesday

### Daylight Saving Time
- Spring forward: 2 AM → 3 AM (lose an hour)
- Fall back: 2 AM → 1 AM (gain an hour)
- **GTFS service times are NOT affected** - they're relative to service day, not wall clock
- **Timestamps ARE affected** - need to be careful with timestamp comparisons

## Configuration Changes

```typescript
// config.ts
export const DEFAULT_LOOK_AHEAD_IN_HOURS = 24; // Changed from minutes
export const DEFAULT_STOP_COUNT_LIMIT = 100; // Increased from 30
```

## Open Questions

1. **Should we support configurable windows?** (e.g., 12h, 24h, 48h options)
2. **How to display "tomorrow" departures?**
   - Show actual calendar date?
   - Show relative time ("in 18 hours")?
   - Group by service day vs calendar day?
3. **Performance concerns?**
   - Will querying 2-3 service days be fast enough?
   - Should we cache results?
   - Do we need pagination?
4. **Terminus filtering across days?**
   - Current logic should work, but needs testing

## Recommendation

**Start with Option 1** (Multi-Day Query Strategy):
- More robust - doesn't depend on timestamps being present
- Gives us full control over the logic
- Can add timestamp-based optimization later if needed

**Key implementation detail**: Use `departure_timestamp` for sorting and filtering when available, fall back to service time string comparison when not.
