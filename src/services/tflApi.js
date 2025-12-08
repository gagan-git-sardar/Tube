// TFL Official Line Colors
export const TFL_COLORS = {
  bakerloo: '#B36305',
  central: '#E32017',
  circle: '#FFD300',
  district: '#00782A',
  'hammersmith-city': '#F3A9BB',
  jubilee: '#A0A5A9',
  metropolitan: '#9B0056',
  northern: '#000000',
  piccadilly: '#003688',
  victoria: '#0098D4',
  'waterloo-city': '#95CDBA',
  dlr: '#00A4A7',
  elizabeth: '#6950A1',
  overground: '#EE7C0E',
  tram: '#84B817'
};

// Line display names
export const LINE_NAMES = {
  bakerloo: 'Bakerloo',
  central: 'Central',
  circle: 'Circle',
  district: 'District',
  'hammersmith-city': 'Hammersmith & City',
  jubilee: 'Jubilee',
  metropolitan: 'Metropolitan',
  northern: 'Northern',
  piccadilly: 'Piccadilly',
  victoria: 'Victoria',
  'waterloo-city': 'Waterloo & City',
  dlr: 'DLR',
  elizabeth: 'Elizabeth',
  overground: 'Overground',
  tram: 'Tram'
};

// Tube lines to visualize (main underground lines)
export const TUBE_LINES = [
  'bakerloo',
  'central',
  'circle',
  'district',
  'hammersmith-city',
  'jubilee',
  'metropolitan',
  'northern',
  'piccadilly',
  'victoria',
  'waterloo-city'
];

// Base TFL API URL
const TFL_API_BASE = 'https://api.tfl.gov.uk';

// Fetch all stations for a specific line
export async function getLineStations(lineId) {
  try {
    const response = await fetch(
      `${TFL_API_BASE}/Line/${lineId}/StopPoints`
    );
    if (!response.ok) throw new Error(`Failed to fetch stations for ${lineId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching stations for ${lineId}:`, error);
    return [];
  }
}

// Fetch route sequence for a line (gives station order and coordinates)
export async function getLineRoute(lineId) {
  try {
    const response = await fetch(
      `${TFL_API_BASE}/Line/${lineId}/Route/Sequence/all`
    );
    if (!response.ok) throw new Error(`Failed to fetch route for ${lineId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching route for ${lineId}:`, error);
    return null;
  }
}

// Fetch crowding data for stations (to determine busyness)
export async function getLineCrowding(lineId) {
  try {
    const response = await fetch(
      `${TFL_API_BASE}/Line/${lineId}/Arrivals`
    );
    if (!response.ok) throw new Error(`Failed to fetch crowding for ${lineId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching crowding for ${lineId}:`, error);
    return [];
  }
}

// Fetch all tube line data
export async function getAllTubeData() {
  const allData = {
    stations: new Map(),
    routes: [],
    segments: [], // NEW: Individual segments with frequency
    arrivals: []
  };

  // Track segment frequencies (station pair -> frequency count)
  const segmentFrequencyMap = new Map();

  // Fetch data for all lines in parallel
  const lineDataPromises = TUBE_LINES.map(async (lineId) => {
    const [routeData, arrivalsData] = await Promise.all([
      getLineRoute(lineId),
      getLineCrowding(lineId)
    ]);

    return { lineId, routeData, arrivalsData };
  });

  const results = await Promise.all(lineDataPromises);

  results.forEach(({ lineId, routeData, arrivalsData }) => {
    // Process route data
    if (routeData && routeData.stopPointSequences) {
      routeData.stopPointSequences.forEach(sequence => {
        const routeCoords = [];
        const stationIds = [];

        sequence.stopPoint.forEach(stop => {
          // Add station to map (accumulate frequency)
          const stationKey = stop.id || stop.stationId;
          stationIds.push(stationKey);

          if (allData.stations.has(stationKey)) {
            const existing = allData.stations.get(stationKey);
            existing.frequency += 1;
            existing.lines.add(lineId);
          } else {
            allData.stations.set(stationKey, {
              id: stationKey,
              name: stop.name,
              lat: stop.lat,
              lon: stop.lon,
              frequency: 1,
              lines: new Set([lineId])
            });
          }

          routeCoords.push([stop.lat, stop.lon]);
        });

        // Create segments between consecutive stations
        // We'll update frequencies after all stations are processed
        for (let i = 0; i < routeCoords.length - 1; i++) {
          const fromStation = stationIds[i];
          const toStation = stationIds[i + 1];
          // Create a unique key for this segment (order-independent)
          const segmentKey = [fromStation, toStation].sort().join('|');

          // Store segment info - frequency will be calculated later based on station frequencies
          if (segmentFrequencyMap.has(segmentKey)) {
            // Segment exists, add this line's contribution
            const existing = segmentFrequencyMap.get(segmentKey);
            existing.lineCount += 1;
            existing.arrivalCount += (arrivalsData.length || 1);
          } else {
            segmentFrequencyMap.set(segmentKey, {
              key: segmentKey,
              lineId,
              color: TFL_COLORS[lineId],
              from: routeCoords[i],
              to: routeCoords[i + 1],
              fromStation,
              toStation,
              lineCount: 1,
              arrivalCount: arrivalsData.length || 1,
              frequency: 1 // Will be updated later
            });
          }
        }

        if (routeCoords.length > 1) {
          allData.routes.push({
            lineId,
            color: TFL_COLORS[lineId],
            coordinates: routeCoords,
            frequency: arrivalsData.length || 1
          });
        }
      });
    }

    // Process arrivals for tube animations
    if (arrivalsData && arrivalsData.length > 0) {
      arrivalsData.forEach(arrival => {
        allData.arrivals.push({
          lineId,
          stationId: arrival.naptanId,
          stationName: arrival.stationName,
          vehicleId: arrival.vehicleId,
          direction: arrival.direction,
          towards: arrival.towards,
          expectedArrival: arrival.expectedArrival,
          timeToStation: arrival.timeToStation
        });
      });
    }
  });

  // Convert stations map to array and calculate size based on frequency
  const stationsArray = Array.from(allData.stations.values()).map(station => ({
    ...station,
    lines: Array.from(station.lines),
    // Calculate circle radius based on frequency (min 5, max 15)
    radius: Math.min(15, Math.max(5, 3 + station.frequency * 2))
  }));

  // Calculate segment frequencies based on connected station frequencies
  // A segment's frequency = average of its two stations' frequencies + lines using it + arrivals
  const segmentsArray = Array.from(segmentFrequencyMap.values()).map(segment => {
    const fromStationData = allData.stations.get(segment.fromStation);
    const toStationData = allData.stations.get(segment.toStation);

    const fromFreq = fromStationData ? fromStationData.frequency : 1;
    const toFreq = toStationData ? toStationData.frequency : 1;

    // Combine station frequency with number of lines and arrivals
    const stationAvgFreq = (fromFreq + toFreq) / 2;
    const combinedFreq = stationAvgFreq * segment.lineCount + segment.arrivalCount;

    return {
      ...segment,
      frequency: combinedFreq
    };
  });

  console.log('Segments created:', segmentsArray.length,
    'Frequency range:',
    Math.min(...segmentsArray.map(s => s.frequency)),
    '-',
    Math.max(...segmentsArray.map(s => s.frequency))
  );

  return {
    stations: stationsArray,
    routes: allData.routes,
    segments: segmentsArray,
    arrivals: allData.arrivals
  };
}

// Get simulated tube positions based on route
export function simulateTubePositions(routes, maxCount = 100) {
  const tubes = [];

  if (!routes || routes.length === 0) {
    console.warn('No routes available for tube simulation');
    return tubes;
  }

  // Filter routes with valid coordinates
  const validRoutes = routes.filter(route =>
    route.coordinates && route.coordinates.length >= 2
  );

  if (validRoutes.length === 0) {
    console.warn('No valid routes with coordinates');
    return tubes;
  }

  // Calculate max frequency for normalization
  const maxFrequency = Math.max(...validRoutes.map(r => r.frequency || 1));

  validRoutes.forEach((route, routeIndex) => {
    // Add tubes based on normalized frequency (1-5 tubes per route)
    const normalizedFreq = (route.frequency || 1) / maxFrequency;
    const tubesPerRoute = Math.max(1, Math.round(1 + normalizedFreq * 4));

    for (let i = 0; i < tubesPerRoute && tubes.length < maxCount; i++) {
      // Distribute tubes evenly along the route with some randomness
      const baseProgress = (i + 0.5) / tubesPerRoute;
      const progress = Math.max(0.05, Math.min(0.95, baseProgress + (Math.random() - 0.5) * 0.2));

      const coordIndex = Math.floor(progress * (route.coordinates.length - 1));
      const nextIndex = Math.min(coordIndex + 1, route.coordinates.length - 1);

      const start = route.coordinates[coordIndex];
      const end = route.coordinates[nextIndex];

      if (!start || !end) continue;

      const segmentProgress = progress * (route.coordinates.length - 1) - coordIndex;

      const lat = start[0] + (end[0] - start[0]) * segmentProgress;
      const lon = start[1] + (end[1] - start[1]) * segmentProgress;

      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

      tubes.push({
        id: `tube-${route.lineId}-${routeIndex}-${i}`,
        lineId: route.lineId,
        color: route.color,
        position: [lat, lon],
        route: [...route.coordinates], // Clone the array
        progress: progress,
        speed: 0.003 + Math.random() * 0.004, // Faster for visibility
        direction: i % 2 === 0 ? 1 : -1 // Alternate directions
      });
    }
  });

  console.log(`Created ${tubes.length} tube simulations from ${validRoutes.length} routes`);
  return tubes;
}
