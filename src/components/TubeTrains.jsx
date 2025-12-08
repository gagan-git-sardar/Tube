import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { LINE_NAMES, TFL_COLORS } from '../services/tflApi';

// Create train icon SVG
function createTrainIcon(color) {
  return L.divIcon({
    html: `<svg width="32" height="20" viewBox="0 0 32 20">
      <!-- Main body with rounded roof effect -->
      <path d="M1,6 Q16,3 31,6 L31,16 Q16,16 1,16 Z" fill="${color}" stroke="#333" stroke-width="1"/>
      <!-- Roof highlight to suggest cylinder shape -->
      <path d="M2,6 Q16,4 30,6 L30,9 L2,9 Z" fill="#ffffff" fill-opacity="0.3"/>
      <!-- Windows -->
      <rect x="4" y="9" width="5" height="4" rx="1" fill="#cceeff"/>
      <rect x="11" y="9" width="10" height="4" rx="1" fill="#cceeff"/>
      <rect x="23" y="9" width="5" height="4" rx="1" fill="#cceeff"/>
      <!-- Doors (vertical lines) -->
      <path d="M10,6 L10,16" stroke="#333" stroke-width="1" opacity="0.5"/>
      <path d="M22,6 L22,16" stroke="#333" stroke-width="1" opacity="0.5"/>
    </svg>`,
    className: 'train-icon',
    iconSize: [32, 20],
    iconAnchor: [16, 10],
  });
}

function TubeTrains({ routes, visible }) {
  const map = useMap();
  const trainsRef = useRef([]);
  const animFrameRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Clean up previous state
    const cleanUp = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      trainsRef.current = [];
    };

    if (!visible || !routes || routes.length === 0) {
      cleanUp();
      return cleanUp;
    }

    console.log('TubeTrains: Setting up with', routes.length, 'routes');

    // Group routes by line to get total frequency per line
    const lineData = {};
    routes.forEach((route) => {
      if (!route.coordinates || route.coordinates.length < 2) return;

      if (!lineData[route.lineId]) {
        lineData[route.lineId] = {
          lineId: route.lineId,
          color: route.color || TFL_COLORS[route.lineId],
          routes: [],
          totalFrequency: 0,
        };
      }
      lineData[route.lineId].routes.push(route.coordinates);
      lineData[route.lineId].totalFrequency += route.frequency || 1;
    });

    // Create trains for each line
    const trains = [];

    Object.values(lineData).forEach((line) => {
      // Number of trains based on frequency (min 2, max 8 per line)
      const numTrains = Math.max(
        2,
        Math.min(8, Math.ceil(line.totalFrequency / 15)),
      );

      line.routes.forEach((routeCoords, routeIdx) => {
        // Distribute trains across routes
        const trainsForThisRoute = Math.max(
          1,
          Math.ceil(numTrains / line.routes.length),
        );

        for (let i = 0; i < trainsForThisRoute; i++) {
          // Stagger starting positions along the route
          const startProgress = i / trainsForThisRoute + Math.random() * 0.1;

          // Vary speed based on position (some faster, some slower) - SLOWER speeds
          const baseSpeed = 0.00001 + Math.random() * 0.00003;

          trains.push({
            id: `${line.lineId}-${routeIdx}-${i}`,
            lineId: line.lineId,
            color: line.color,
            route: routeCoords,
            progress: startProgress % 1,
            speed: baseSpeed,
            direction: i % 2 === 0 ? 1 : -1, // Alternate directions
            marker: null,
          });
        }
      });
    });

    console.log('TubeTrains: Created', trains.length, 'trains');
    trainsRef.current = trains;

    // Create Leaflet markers for each train
    trains.forEach((train) => {
      const pos = getPositionOnRoute(train.route, train.progress);
      const icon = createTrainIcon(train.color);
      const marker = L.marker(pos, { icon, zIndexOffset: 1000 });

      marker.bindTooltip(
        `<b style="color:${train.color}">${LINE_NAMES[train.lineId] || train.lineId
        }</b><br>In Service`,
        { direction: 'top', offset: [0, -10] },
      );

      marker.addTo(map);
      train.marker = marker;
      markersRef.current.push(marker);
    });

    console.log(
      'TubeTrains: Added',
      markersRef.current.length,
      'markers to map',
    );

    // Animation loop
    let lastTime = Date.now();

    function animate() {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      trainsRef.current.forEach((train) => {
        // Update progress based on speed and direction
        train.progress += train.speed * train.direction * delta;

        // Bounce at ends
        if (train.progress >= 1) {
          train.progress = 1;
          train.direction = -1;
        } else if (train.progress <= 0) {
          train.progress = 0;
          train.direction = 1;
        }

        // Get new position and update marker
        const newPos = getPositionOnRoute(train.route, train.progress);
        if (train.marker && newPos) {
          train.marker.setLatLng(newPos);
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    }

    // Start animation
    console.log('TubeTrains: Starting animation');
    animFrameRef.current = requestAnimationFrame(animate);

    return cleanUp;
  }, [visible, routes, map]);

  return null;
}

// Helper: Get lat/lng position at a given progress (0-1) along a route
function getPositionOnRoute(route, progress) {
  if (!route || route.length < 2) return [51.5, -0.1];

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalSegments = route.length - 1;
  const exactIdx = clampedProgress * totalSegments;
  const segmentIdx = Math.floor(exactIdx);
  const segmentProgress = exactIdx - segmentIdx;

  const idx1 = Math.min(segmentIdx, route.length - 1);
  const idx2 = Math.min(segmentIdx + 1, route.length - 1);

  const p1 = route[idx1];
  const p2 = route[idx2];

  if (!p1 || !p2) return [51.5, -0.1];

  const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

  return [lat, lng];
}

export default TubeTrains;
