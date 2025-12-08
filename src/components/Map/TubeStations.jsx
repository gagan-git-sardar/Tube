import React, { useState, useMemo } from 'react';
import { CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useTubeData } from '../../context/TubeContext';

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

            return (
                <CircleMarker
                    key={station.id}
                    center={[station.lat, station.lon]}
                    radius={isRelevant ? 4 : 2}
                    pathOptions={{
                        color: '#fff',
                        fillColor: '#111',
                        fillOpacity: isRelevant ? 0.9 : 0.2,
                        weight: 1,
                        opacity: isRelevant ? 1 : 0.2
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
