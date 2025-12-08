import { useEffect, useState, useMemo } from 'react';
import { Polyline, useMap } from 'react-leaflet';

function AnimatedRoutes({
  routes,
  stations,
  visible,
  animationDuration = 10000,
}) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [zoom, setZoom] = useState(12);
  const map = useMap();

  // Track zoom level changes
  useEffect(() => {
    if (!map) return;

    setZoom(map.getZoom());

    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  useEffect(() => {
    if (!visible) {
      setAnimationProgress(0);
      return;
    }

    const startTime = Date.now();
    let animationFrame;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / animationDuration);

      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [visible, animationDuration]);

  // Build a map of station coordinates to their frequency
  const stationFrequencyMap = useMemo(() => {
    const map = new Map();
    if (stations && stations.length > 0) {
      stations.forEach((station) => {
        // Use lat,lon as key (rounded to avoid floating point issues)
        const key = `${station.lat.toFixed(5)},${station.lon.toFixed(5)}`;
        map.set(key, station.frequency || 1);
      });
    }
    return map;
  }, [stations]);

  // Get max station frequency for normalization
  const maxStationFreq = useMemo(() => {
    if (!stations || stations.length === 0) return 1;
    return Math.max(...stations.map((s) => s.frequency || 1));
  }, [stations]);

  // Create segments from routes with thickness based on station busyness
  const animatedSegments = useMemo(() => {
    if (!visible || !routes || routes.length === 0) return null;

    const allSegments = [];

    routes.forEach((route, routeIndex) => {
      const coords = route.coordinates;
      if (!coords || coords.length < 2) return;

      // Create a segment for each pair of consecutive stations
      for (let i = 0; i < coords.length - 1; i++) {
        const from = coords[i];
        const to = coords[i + 1];

        // Get frequency of both stations
        const fromKey = `${from[0].toFixed(5)},${from[1].toFixed(5)}`;
        const toKey = `${to[0].toFixed(5)},${to[1].toFixed(5)}`;

        const fromFreq = stationFrequencyMap.get(fromKey) || 1;
        const toFreq = stationFrequencyMap.get(toKey) || 1;

        // Segment frequency is average of connected stations
        const segmentFreq = (fromFreq + toFreq) / 2;

        allSegments.push({
          routeIndex,
          segmentIndex: i,
          from,
          to,
          color: route.color,
          frequency: segmentFreq,
        });
      }
    });

    // Render segments with thickness based on frequency
    return allSegments.map((segment, index) => {
      // Stagger animation by route, then by segment within route
      const overallProgress =
        (segment.routeIndex * 100 + segment.segmentIndex) /
        (routes.length * 50);
      const delay = Math.min(0.5, overallProgress * 0.5);
      const adjustedProgress = Math.max(
        0,
        (animationProgress - delay) / (1 - delay),
      );

      if (adjustedProgress <= 0) return null;

      // Calculate thickness: busier stations = thicker segment
      // Use exponential scaling for dramatic difference
      const normalizedFreq = segment.frequency / maxStationFreq;

      // Simple thickness: busy = thick, quiet = thin
      // No zoom scaling - just clear visual difference
      const minWeight = 1; // Thin for quiet segments
      const maxWeight = 18; // Very thick for busy segments

      // Linear scaling - straightforward relationship
      const weight = minWeight + normalizedFreq * (maxWeight - minWeight);

      return (
        <Polyline
          key={`seg-${segment.routeIndex}-${segment.segmentIndex}`}
          positions={[segment.from, segment.to]}
          pathOptions={{
            color: segment.color,
            weight: weight,
            opacity: Math.min(0.9, adjustedProgress),
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      );
    });
  }, [
    routes,
    visible,
    animationProgress,
    stationFrequencyMap,
    maxStationFreq,
    zoom,
  ]);

  return <>{animatedSegments}</>;
}

export default AnimatedRoutes;
