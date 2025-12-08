import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import TubeLines from './TubeLines';
import TubeStations from './TubeStations';
import TubeTrains from './TubeTrains';

// London Coordinates
const CENTER = [51.505, -0.09];
const ZOOM = 13;

const Map = () => {
    return (
        <MapContainer
            center={CENTER}
            zoom={ZOOM}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TubeLines />
            <TubeStations />
            <TubeTrains />
        </MapContainer>
    );
};

export default Map;
