import React, { useState, useMemo } from 'react';
import { CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useTubeData } from '../../context/TubeContext';
import { getStationUsage } from '../../data/stationData';

const TubeStations = () => {
    const { stations, activeLines, setActiveLines } = useTubeData();
    const map = useMap();
    const [zoomLevel, setZoomLevel] = useState(map.getZoom());

    useMapEvents({
        zoomend: () => {
            setZoomLevel(map.getZoom());
        }
    });

    const showLabels = zoomLevel >= 13;

    const markers = useMemo(() => {
        return stations.map(station => {
            // Is this station relevant to the active lines?
            // If activeLines is empty, all are relevant.
            // If activeLines is set, station is relevant if it serves at least one active line.
            const isRelevant = activeLines.length === 0 ||
                (station.lineIds && station.lineIds.some(id => activeLines.includes(id)));

            // Calculate size based on usage
            const usage = getStationUsage(station.name);
            // Scale: Min 3, Max 10 (at zoom 13). Adjust based on zoom.
            // Max usage is around 300,000.
            const sizeFactor = Math.min(10, Math.max(3, 3 + (usage / 300000) * 10));

            const radius = isRelevant ? (zoomLevel > 12 ? sizeFactor * (zoomLevel / 12) : sizeFactor * 0.6) : 1.5;

            return (
                <CircleMarker
                    key={station.id}
                    center={[station.lat, station.lon]}
                    radius={radius}
                    pathOptions={{
                        color: '#000', // Black border
                        weight: isRelevant ? 2 : 1,
                        fillColor: '#fff', // White fill (Classic Metro Style)
                        fillOpacity: 1,
                        opacity: isRelevant ? 1 : 0.3
                    }}
                    eventHandlers={{
                        click: (e) => {
                            // Zoom to station
                            map.flyTo(e.latlng, 15, {
                                duration: 1.5
                            });

                            // Highlight lines passing through this station
                            if (station.lineIds && station.lineIds.length > 0) {
                                setActiveLines(station.lineIds);
                            } else {
                                setActiveLines([]);
                            }
                        }
                    }}
                >
                    {showLabels && (
                        <Tooltip
                            direction="top"
                            offset={[0, -5]}
                            opacity={0.9}
                            permanent={zoomLevel > 14}
                        >
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{station.name}</span>
                        </Tooltip>
                    )}
                </CircleMarker>
            );
        });
    }, [stations, activeLines, showLabels, zoomLevel, map, setActiveLines]);

    return <>{markers}</>;
};

export default TubeStations;
