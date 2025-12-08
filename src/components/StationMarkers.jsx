import { useMemo, useState, useEffect } from 'react';
import { CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { TFL_COLORS } from '../services/tflApi';

function StationMarkers({ stations, visible }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  // Listen to zoom changes
  useEffect(() => {
    const onZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  // Calculate zoom-relative radius
  const getRadius = (baseRadius) => {
    // Scale radius based on zoom level (base zoom is 12)
    const zoomFactor = Math.pow(1.3, zoom - 12);
    return Math.max(2, Math.min(20, baseRadius * zoomFactor));
  };

  // Memoize station markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    if (!visible || !stations.length) return null;

    return stations.map((station) => {
      // Determine primary line color (first line)
      const primaryLine = station.lines[0];
      const color = TFL_COLORS[primaryLine] || '#666666';

      // Calculate opacity based on frequency (busier = more opaque)
      const opacity = Math.min(1, 0.5 + station.frequency * 0.1);

      // Zoom-relative radius
      const radius = getRadius(station.radius);

      return (
        <CircleMarker
          key={station.id}
          center={[station.lat, station.lon]}
          radius={radius}
          pathOptions={{
            fillColor: color,
            fillOpacity: opacity,
            color: '#ffffff',
            weight: Math.max(1, 2 * (zoom / 12)),
            opacity: 0.9,
          }}>
          <Tooltip direction='top' offset={[0, -10]} opacity={0.9}>
            <div
              style={{
                padding: '5px',
                minWidth: '150px',
                fontFamily: 'Segoe UI, sans-serif',
              }}>
              <strong style={{ fontSize: '14px' }}>{station.name}</strong>
              <br />
              <span style={{ fontSize: '12px', color: '#666' }}>
                Lines: {station.lines.length}
              </span>
              <br />
              <span style={{ fontSize: '11px', color: '#999' }}>
                Connections: {station.frequency}
              </span>
            </div>
          </Tooltip>
        </CircleMarker>
      );
    });
  }, [stations, visible, zoom]);

  return <>{markers}</>;
}

export default StationMarkers;
