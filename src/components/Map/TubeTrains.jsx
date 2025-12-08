import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTubeData } from '../../context/TubeContext';
import { fetchArrivals } from '../../services/tflApi';

// Train Icon Factory
const createTrainIcon = (color) => new L.DivIcon({
    className: 'train-icon-container',
    html: `<div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px ${color}, 0 0 5px white;
        transition: all 0.1s linear;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const TubeTrains = () => {
    const { lineSequences, loading } = useTubeData();
    const [trains, setTrains] = useState([]);
    const [tick, setTick] = useState(0); // Force re-render for animation

    // Fetch data periodically
    useEffect(() => {
        if (loading || Object.keys(lineSequences).length === 0) return;

        const updateData = async () => {
            const activeLines = Object.keys(lineSequences);
            const allArrivals = [];

            await Promise.all(activeLines.map(async (lineId) => {
                const arrivals = await fetchArrivals(lineId);
                const sequence = lineSequences[lineId];

                arrivals.forEach(arr => {
                    // Find target station index
                    const targetIdx = sequence.stations.findIndex(s => s.id === arr.naptanId);
                    if (targetIdx !== -1) {
                        // Find previous station (if exists, else self)
                        const prevStation = targetIdx > 0 ? sequence.stations[targetIdx - 1] : sequence.stations[targetIdx];
                        const targetStation = sequence.stations[targetIdx];

                        allArrivals.push({
                            id: arr.vehicleId || `${arr.naptanId}-${arr.timeToStation}`, // Fallback ID
                            lineId,
                            destination: arr.destinationName,
                            timeToStation: arr.timeToStation,
                            startLat: prevStation.lat,
                            startLon: prevStation.lon,
                            endLat: targetStation.lat,
                            endLon: targetStation.lon,
                            color: getLineColor(lineId),
                            timestamp: Date.now()
                        });
                    }
                });
            }));

            setTrains(allArrivals);
        };

        updateData();
        const interval = setInterval(updateData, 30000); // Fetch every 30s to avoid rate limits
        return () => clearInterval(interval);
    }, [lineSequences, loading]);

    // Animation loop: Update positions using requestAnimationFrame
    useEffect(() => {
        let animationFrameId;

        const animate = () => {
            setTick(t => t + 1);
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Calculate current positions
    const visibleTrains = trains.map(train => {
        const timePassed = (Date.now() - train.timestamp) / 1000;
        const currentTTL = train.timeToStation - timePassed;

        // If arrived, stay at station
        if (currentTTL <= 0) return { ...train, lat: train.endLat, lon: train.endLon };

        const avgTravelTime = 150;
        let progress = 1 - (currentTTL / avgTravelTime);
        // Linear interpolation is okay, but easing is better? 
        // For trains, constant speed (linear) is actually more realistic than ease-in-out between stations.
        progress = Math.max(0, Math.min(1, progress));

        const lat = train.startLat + (train.endLat - train.startLat) * progress;
        const lon = train.startLon + (train.endLon - train.startLon) * progress;

        return { ...train, lat, lon };
    });

    return (
        <>
            {visibleTrains.map(train => (
                <Marker
                    key={train.id}
                    position={[train.lat, train.lon]}
                    icon={createTrainIcon(train.color)}
                >
                    <Popup>
                        <strong>{train.destination}</strong><br />
                        Next stop in {Math.max(0, Math.floor(train.timeToStation - (Date.now() - train.timestamp) / 1000))}s
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

// Start: Duplicate color helper, should move to utils
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

export default TubeTrains;
