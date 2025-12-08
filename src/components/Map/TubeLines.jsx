import React from 'react';
import { Polyline } from 'react-leaflet';
import { useTubeData } from '../../context/TubeContext';

const TubeLines = () => {
    const { lineSequences } = useTubeData();

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
                geometries.push({
                    id: lineId,
                    color: getLineColor(lineId),
                    paths: coords
                });
            }
        });
        return geometries;
    };

    return (
        <>
            {getGeometries().map((data) => (
                data.paths.map((path, idx) => (
                    <Polyline
                        key={`${data.id}-${idx}`}
                        positions={path}
                        pathOptions={{ color: data.color, weight: 3, opacity: 0.8 }}
                    />
                ))
            ))}
        </>
    );
};

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

export default TubeLines;
