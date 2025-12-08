import React from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTubeData } from '../../context/TubeContext';

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
        waterloo_city: '#95CDBA'
    };
    return colors[id.replace('-', '_')] || '#666';
};

const TubeLines = () => {
    const { lineSequences, activeLines, setActiveLines } = useTubeData();
    const map = useMap();

    const getGeometries = () => {
        const geometries = [];
        Object.entries(lineSequences).forEach(([lineId, sequence]) => {
            if (sequence && sequence.lineStrings) {
                const coords = sequence.lineStrings.map(ls => {
                    try {
                        return JSON.parse(ls).map(pt => [pt[1], pt[0]]);
                    } catch (e) {
                        return [];
                    }
                });

                // Aggregate all points for bounds calculation
                const allPoints = coords.flat();

                geometries.push({
                    id: lineId,
                    color: getLineColor(lineId),
                    paths: coords,
                    bounds: allPoints.length > 0 ? L.latLngBounds(allPoints) : null
                });
            }
        });
        return geometries;
    };

    const handleLineClick = (data) => {
        // Toggle selection logic:
        // If already selected alone, turn off.
        // If not selected, select it.
        const isSelected = activeLines.includes(data.id) && activeLines.length === 1;

        if (isSelected) {
            setActiveLines([]);
        } else {
            setActiveLines([data.id]);
            // Zoom to line
            if (data.bounds) {
                map.fitBounds(data.bounds, { padding: [20, 20], maxZoom: 14 });
            }
        }
    };

    return (
        <>
            {getGeometries().map((data) => {
                const isActive = activeLines.length === 0 || activeLines.includes(data.id);
                // Highlight weight if it is the ONLY active line
                const isFocused = activeLines.length === 1 && activeLines.includes(data.id);

                return data.paths.map((path, idx) => (
                    <Polyline
                        key={`${data.id}-${idx}`}
                        positions={path}
                        pathOptions={{
                            color: data.color,
                            weight: isFocused ? 6 : 3,
                            opacity: isActive ? 0.9 : 0.1
                        }}
                        eventHandlers={{
                            click: () => handleLineClick(data)
                        }}
                    />
                ));
            })}
        </>
    );
};

export default TubeLines;
