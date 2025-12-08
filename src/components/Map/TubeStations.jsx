import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { useTubeData } from '../../context/TubeContext';

const TubeStations = () => {
    const { stations } = useTubeData();

    return (
        <>
            {stations.map(station => (
                <CircleMarker
                    key={station.id}
                    center={[station.lat, station.lon]}
                    radius={3}
                    pathOptions={{ color: '#fff', fillColor: '#111', fillOpacity: 0.8, weight: 1 }}
                >
                    <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                        {station.name}
                    </Tooltip>
                </CircleMarker>
            ))}
        </>
    );
};

export default TubeStations;
