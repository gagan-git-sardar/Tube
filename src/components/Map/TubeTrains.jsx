import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTubeData } from '../../context/TubeContext';
import { fetchArrivals } from '../../services/tflApi';

// Train Color Helper
const getLineColor = (id) => {
    const colors = {
        bakerloo: '#B36305',
        central: '#E32017',
        circle: '#FFD300',
        district: '#00782A',
        hammersmith_city: '#F3A9BB',
        jubilee: '#A0A5A9',
        metropolitan: '#9B0056',
        northern: '#000000',
        piccadilly: '#003688',
        victoria: '#0098D4',
        waterloo_city: '#95CDBA',
        dlr: '#00AFAD',
        elizabeth: '#6950a1',
        london_overground: '#ef7b10'
    };
    return colors[id.replace('-', '_')] || '#666';
};

const TubeTrains = () => {
    const map = useMap();
    const { lineSequences, loading, activeLines } = useTubeData();

    // Refs for state that shouldn't trigger expensive re-renders
    const trainsRef = useRef({}); // Store current train objects: { [id]: { marker, trail, data, ... } }
    const rafRef = useRef(null);
    const mountedRef = useRef(true);

    // Initial Data Fetch & Periodic Updates
    useEffect(() => {
        mountedRef.current = true;

        if (loading || Object.keys(lineSequences).length === 0) return;

        const fetchData = async () => {
            if (!mountedRef.current) return;

            const activeLines = Object.keys(lineSequences);

            for (const lineId of activeLines) {
                try {
                    const arrivals = await fetchArrivals(lineId);
                    const sequence = lineSequences[lineId];
                    const color = getLineColor(lineId);

                    const seenTrainIds = new Set();

                    // Process arrivals
                    arrivals.forEach(arr => {
                        const trainId = arr.vehicleId ? `${lineId}-${arr.vehicleId}` : `fallback-${lineId}-${arr.naptanId}-${arr.timeToStation}`;
                        // Note: Fallback ID relying on timeToStation is unstable and causes duplication/leaks.
                        // If vehicleId is missing, we should try to be unique but stable.
                        // Better fallback: `${lineId}-${arr.naptanId}-${arr.destinationName}`?
                        // For now, let's prefix with lineId to ensure uniqueness across lines.

                        // Skip if really no stable ID can be formed (or just accept some glitching)
                        if (!arr.vehicleId && !arr.naptanId) return;

                        const targetIdx = sequence.stations.findIndex(s => s.id === arr.naptanId);

                        if (targetIdx !== -1) {
                            seenTrainIds.add(trainId);

                            const prevStation = targetIdx > 0 ? sequence.stations[targetIdx - 1] : sequence.stations[targetIdx];
                            const targetStation = sequence.stations[targetIdx];

                            // Update or Create train in Ref
                            if (!trainsRef.current[trainId]) {
                                // Create Marker
                                const el = document.createElement('div');
                                el.className = 'train-marker';
                                el.style.backgroundColor = color;
                                el.style.width = '12px';
                                el.style.height = '12px';
                                el.style.borderRadius = '50%';
                                el.style.border = '2px solid white';
                                el.style.boxShadow = `0 0 6px ${color}`;

                                const marker = L.marker([prevStation.lat, prevStation.lon], {
                                    icon: L.divIcon({
                                        className: 'train-icon-custom',
                                        html: el,
                                        iconSize: [16, 16],
                                        iconAnchor: [8, 8]
                                    }),
                                    zIndexOffset: 1000
                                }).addTo(map);

                                // Create Trail (Polyline)
                                const trail = L.polyline([], {
                                    color: color,
                                    weight: 4,
                                    opacity: 0.6,
                                    lineCap: 'round'
                                }).addTo(map);

                                trainsRef.current[trainId] = {
                                    id: trainId, // Store ID for lookup
                                    marker,
                                    trail,
                                    lineId,
                                    startLat: prevStation.lat,
                                    startLon: prevStation.lon,
                                    endLat: targetStation.lat,
                                    endLon: targetStation.lon,
                                    timeToStation: arr.timeToStation,
                                    timestamp: Date.now(),
                                    duration: arr.timeToStation
                                };
                            } else {
                                // Update existing train target
                                const t = trainsRef.current[trainId];
                                // Only update if target changed significantly
                                if (t.endLat !== targetStation.lat) {
                                    t.startLat = t.marker.getLatLng().lat;
                                    t.startLon = t.marker.getLatLng().lng;
                                    t.endLat = targetStation.lat;
                                    t.endLon = targetStation.lon;
                                    t.timeToStation = arr.timeToStation;
                                    t.timestamp = Date.now();
                                    t.trail.setLatLngs([]);
                                }
                            }
                        }
                    });

                    // Garbage Collection: Remove trains for this line that were NOT updated
                    Object.values(trainsRef.current).forEach(t => {
                        if (t.lineId === lineId && !seenTrainIds.has(t.id)) {
                            t.marker.remove();
                            t.trail.remove();
                            delete trainsRef.current[t.id];
                        }
                    });

                } catch (e) {
                    console.warn(`Failed to update trains for line ${lineId}`, e);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 20000); // 20s update

        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [lineSequences, loading, map]);

    // Animation Loop (60fps)
    useEffect(() => {
        const animate = () => {
            const now = Date.now();

            Object.keys(trainsRef.current).forEach(id => {
                const train = trainsRef.current[id];

                // Visibility check based on activeLines
                // If activeLines is active (length > 0) and train's line is NOT in it -> hide
                const isVisible = activeLines.length === 0 || activeLines.includes(train.lineId);

                if (!isVisible) {
                    if (train.marker._icon) train.marker._icon.style.display = 'none';
                    train.trail.setStyle({ opacity: 0 });
                    return;
                } else {
                    if (train.marker._icon) train.marker._icon.style.display = 'block';
                }

                // Movement Logic
                const elapsed = (now - train.timestamp) / 1000;
                // Heuristic: Assume 'timeToStation' is accurate. 
                // However, detailed speed is hard. We approximate smooth movement.
                // We'll assume a standard travel duration buffer if currentTTL is large.
                // Simplified: Interpolate from Start to End over 'timeToStation' seconds.

                let progress = elapsed / Math.max(1, train.timeToStation);
                // Cap progress at 1 (arrival). 
                // Note: Real API updates timeToStation decreasingly, so this might jump.
                // Better approach: Move towards target at constant speed?
                // Let's stick to time-based interpolation for now, but smooth it.

                if (progress >= 1) {
                    train.marker.setLatLng([train.endLat, train.endLon]);
                    return;
                }

                const currentLat = train.startLat + (train.endLat - train.startLat) * progress;
                const currentLng = train.startLon + (train.endLon - train.startLon) * progress;
                const newPos = [currentLat, currentLng];

                train.marker.setLatLng(newPos);

                // Trail Logic
                // We keep a history of points. Or simpler: Trail is from Start to Current
                // Requirement: "Leave a trail behind".
                // Let's create a trail that fades or is fixed length? 
                // "Trail behind" usually implies path traveled.

                // Opacity Pulse?
                const isSelected = activeLines.length > 0 && activeLines.includes(train.lineId);
                const trailProps = isSelected ? { opacity: 0.8 } : { opacity: 0.5 };
                train.trail.setStyle(trailProps);
                train.trail.setLatLngs([
                    [train.startLat, train.startLon],
                    newPos
                ]);
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            // Cleanup markers
            Object.values(trainsRef.current).forEach(t => {
                t.marker.remove();
                t.trail.remove();
            });
            trainsRef.current = {};
        };
    }, [map, activeLines]); // Re-run if selection changes to update visibility rapidly

    return null; // Logic only component
};

export default TubeTrains;
