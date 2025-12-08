import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { LINE_NAMES } from '../services/tflApi';

// Create SVG icon for tube train
function createTubeIcon(color) {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24" width="40" height="24">
      <rect x="2" y="4" width="36" height="16" rx="4" ry="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <rect x="6" y="7" width="8" height="6" rx="1" fill="#fff" opacity="0.9"/>
      <rect x="16" y="7" width="8" height="6" rx="1" fill="#fff" opacity="0.9"/>
      <rect x="26" y="7" width="8" height="6" rx="1" fill="#fff" opacity="0.9"/>
      <circle cx="10" cy="20" r="2.5" fill="#333"/>
      <circle cx="30" cy="20" r="2.5" fill="#333"/>
      <rect x="0" y="2" width="4" height="3" rx="1" fill="${color}"/>
      <rect x="36" y="2" width="4" height="3" rx="1" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svgString,
    className: 'tube-marker',
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
}

function AnimatedTubes({ tubes: initialTubes, visible }) {
  const map = useMap();
  const stateRef = useRef({
    markers: {},
    tubes: [],
    animationId: null,
    initialized: false,
  });

  useEffect(() => {
    const state = stateRef.current;

    // Cleanup function
    const cleanup = () => {
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      Object.values(state.markers).forEach((marker) => marker.remove());
      state.markers = {};
      state.tubes = [];
      state.initialized = false;
    };

    // If not visible, cleanup and exit
    if (!visible) {
      cleanup();
      return;
    }

    // If no tubes data, exit
    if (!initialTubes || initialTubes.length === 0) {
      return;
    }

    // If already initialized, exit
    if (state.initialized) {
      return;
    }

    console.log('Initializing', initialTubes.length, 'tubes');
    state.initialized = true;

    // Clone tube data
    state.tubes = initialTubes.map((t) => ({
      id: t.id,
      lineId: t.lineId,
      color: t.color,
      progress: t.progress,
      speed: t.speed,
      direction: t.direction,
      route: t.route.map((c) => [c[0], c[1]]),
    }));

    // Create markers
    state.tubes.forEach((tube) => {
      const startPos = tube.route[0];
      const icon = createTubeIcon(tube.color);
      const marker = L.marker(startPos, { icon }).addTo(map);

      marker.bindTooltip(
        `<strong style="color:${tube.color}">${
          LINE_NAMES[tube.lineId] || tube.lineId
        }</strong><br>Train in service`,
        { direction: 'top', offset: [0, -12] },
      );

      state.markers[tube.id] = marker;
    });

    console.log('Created', Object.keys(state.markers).length, 'markers');

    // Animation function
    let lastTime = performance.now();

    const animate = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      state.tubes.forEach((tube) => {
        // Update progress
        tube.progress += tube.speed * tube.direction * dt * 15;

        // Bounce at ends
        if (tube.progress > 0.95) {
          tube.progress = 0.95;
          tube.direction = -1;
        } else if (tube.progress < 0.05) {
          tube.progress = 0.05;
          tube.direction = 1;
        }

        // Calculate position
        const len = tube.route.length;
        if (len < 2) return;

        const idx = tube.progress * (len - 1);
        const i = Math.floor(idx);
        const j = Math.min(i + 1, len - 1);
        const t = idx - i;

        const p1 = tube.route[i];
        const p2 = tube.route[j];

        if (p1 && p2) {
          const lat = p1[0] + (p2[0] - p1[0]) * t;
          const lng = p1[1] + (p2[1] - p1[1]) * t;

          const marker = state.markers[tube.id];
          if (marker) {
            marker.setLatLng([lat, lng]);
          }
        }
      });

      state.animationId = requestAnimationFrame(animate);
    };

    // Start animation after a small delay
    setTimeout(() => {
      console.log('Starting animation');
      state.animationId = requestAnimationFrame(animate);
    }, 200);

    return cleanup;
  }, [visible, initialTubes, map]);

  return null;
}

export default AnimatedTubes;
