import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ZoomAwareStationMarkers from './components/StationMarkers';
import AnimatedRoutes from './components/AnimatedRoutes';
import TubeTrains from './components/TubeTrains';
import Legend from './components/Legend';
import { getAllTubeData } from './services/tflApi';

// London center coordinates
const LONDON_CENTER = [51.509, -0.118];
const DEFAULT_ZOOM = 12;

// Animation phases
const PHASES = {
  LOADING: 'loading',
  STATIONS: 'stations',
  ROUTES: 'routes',
  TUBES: 'tubes',
};

// Phase descriptions
const PHASE_DESCRIPTIONS = {
  [PHASES.LOADING]: 'Loading TFL data...',
  [PHASES.STATIONS]: 'Displaying stations...',
  [PHASES.ROUTES]: 'Drawing tube routes...',
  [PHASES.TUBES]: 'Animating tube trains...',
};

// Map controller to handle view changes
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

function App() {
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [data, setData] = useState({
    stations: [],
    routes: [],
    segments: [],
    arrivals: [],
  });
  const [error, setError] = useState(null);

  // Fetch TFL data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setPhase(PHASES.LOADING);
        const tflData = await getAllTubeData();
        console.log('TFL Data loaded:', tflData);
        setData(tflData);

        // Start showing stations immediately after data loads
        setPhase(PHASES.STATIONS);

        // After 1 second, start drawing routes
        setTimeout(() => {
          setPhase(PHASES.ROUTES);
        }, 1000);

        // After routes animation (10 seconds), start tubes
        setTimeout(() => {
          console.log('Starting TUBES phase');
          setPhase(PHASES.TUBES);
        }, 11000);
      } catch (err) {
        console.error('Error fetching TFL data:', err);
        setError(err.message);
      }
    }

    fetchData();
  }, []);

  // Render loading overlay
  const renderLoading = () => {
    if (phase !== PHASES.LOADING) return null;

    return (
      <div className='loading-overlay'>
        <div className='loading-spinner' />
        <div className='loading-text'>
          <p>Connecting to TFL API...</p>
          <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '10px' }}>
            Loading station and route data
          </p>
        </div>
      </div>
    );
  };

  // Render phase indicator
  const renderPhaseIndicator = () => {
    if (phase === PHASES.LOADING) return null;

    return (
      <div className='phase-indicator'>
        <h3>🚇 TFL Tube Visualization</h3>
        <p>{PHASE_DESCRIPTIONS[phase]}</p>
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            opacity: 0.7,
          }}>
          <span>Stations: {data.stations.length}</span>
          <span style={{ marginLeft: '15px' }}>
            Routes: {data.routes.length}
          </span>
        </div>
      </div>
    );
  };

  // Render error state
  if (error) {
    return (
      <div
        className='app-container'
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#1a1a2e',
          color: 'white',
        }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Error Loading TFL Data</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#E32017',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='app-container'>
      {renderLoading()}
      {renderPhaseIndicator()}

      <MapContainer
        center={LONDON_CENTER}
        zoom={DEFAULT_ZOOM}
        className='map-container'
        zoomControl={true}
        scrollWheelZoom={true}>
        <MapController center={LONDON_CENTER} zoom={DEFAULT_ZOOM} />

        {/* Terrain map tiles */}
        <TileLayer

          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles: Stamen Design'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {/* Station markers (always visible after loading) */}
        <ZoomAwareStationMarkers
          stations={data.stations}
          visible={phase !== PHASES.LOADING}
        />

        {/* Animated routes (visible during and after ROUTES phase) */}
        <AnimatedRoutes
          routes={data.routes}
          stations={data.stations}
          visible={phase === PHASES.ROUTES || phase === PHASES.TUBES}
          animationDuration={10000}
        />

        {/* Tube trains (visible only during TUBES phase) */}
        <TubeTrains routes={data.routes} visible={phase === PHASES.TUBES} />
      </MapContainer>

      {/* Legend */}
      {phase !== PHASES.LOADING && <Legend />}
    </div>
  );
}

export default App;
