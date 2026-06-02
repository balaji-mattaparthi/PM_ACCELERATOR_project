/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { MapPin, Info, Navigation, Compass } from 'lucide-react';
import L from 'leaflet';

interface WeatherMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  onCoordinateSelect: (lat: number, lng: number, name?: string) => void;
  deviceLocation?: { lat: number; lng: number } | null;
  onGetLocationWeather?: () => void;
}

export default function WeatherMap({ 
  latitude, 
  longitude, 
  locationName, 
  onCoordinateSelect, 
  deviceLocation,
  onGetLocationWeather
}: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const shouldCenterOnUserUpdateRef = useRef(false);
  const onCoordinateSelectRef = useRef(onCoordinateSelect);

  // Sync the latest onCoordinateSelect callback
  useEffect(() => {
    onCoordinateSelectRef.current = onCoordinateSelect;
  }, [onCoordinateSelect]);

  const tileLayerRef = useRef<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark') ||
             window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Watch for theme HTML/Body class mutations to toggle map colors
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current) return;

    // Create map instance if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 10,
        zoomControl: true,
      });

      // Add CartoDB tile layer with support for high-performance CDNs
      const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const activeUrl = isDarkMode ? darkUrl : lightUrl;

      tileLayerRef.current = L.tileLayer(activeUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapInstanceRef.current);

      // Listen for map clicks to select custom coordinate
      mapInstanceRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onCoordinateSelectRef.current?.(
          parseFloat(lat.toFixed(5)), 
          parseFloat(lng.toFixed(5)),
          `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        );
      });

      setMapLoaded(true);
    }

    return () => {
      // Clean up map instance on unmount to avoid container already initialized errors
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markerInstanceRef.current = null;
        userMarkerRef.current = null;
        userAccuracyCircleRef.current = null;
      }
    };
  }, []);

  // Synchronize map tile layers with live theme changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !tileLayerRef.current) return;

    const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const nextUrl = isDarkMode ? darkUrl : lightUrl;

    tileLayerRef.current.setUrl(nextUrl);
  }, [isDarkMode, mapLoaded]);

  // Update center & marker when coordinates change
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !mapLoaded) return;

    // Pan / center the map view
    mapInstanceRef.current.setView([latitude, longitude], 10);

    // Update marker
    if (markerInstanceRef.current && mapInstanceRef.current.hasLayer(markerInstanceRef.current)) {
      markerInstanceRef.current.setLatLng([latitude, longitude]);
      const popup = markerInstanceRef.current.getPopup();
      if (popup) {
        popup.setContent(`<b>${locationName || 'Selected Area'}</b>`);
      }
    } else {
      if (markerInstanceRef.current) {
        try {
          markerInstanceRef.current.remove();
        } catch (e) {}
      }
      // Custom gorgeous glassy pulsing Leaflet marker for selected city
      const pulseIcon = L.divIcon({
        className: 'custom-leaflet-pulse-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
            <div style="position: absolute; width: 20px; height: 20px; background-color: rgba(14, 165, 233, 0.4); border-radius: 50%; animation: custom_ping 1.5s infinite ease-in-out;"></div>
            <div style="position: relative; width: 12px; height: 12px; background: linear-gradient(135deg, #38bdf8, #6366f1); border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10]
      });

      markerInstanceRef.current = L.marker([latitude, longitude], { icon: pulseIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${locationName || 'Selected Area'}</b>`)
        .openPopup();
    }
  }, [latitude, longitude, locationName, mapLoaded]);

  // Update current user location representation if available
  useEffect(() => {
    if (!L || !mapInstanceRef.current || !mapLoaded) return;

    if (deviceLocation) {
      const position: L.LatLngTuple = [deviceLocation.lat, deviceLocation.lng];

      // 1. Solid standard-accuracy zone circles (vector overlay, adblock and styling safe)
      if (userAccuracyCircleRef.current && mapInstanceRef.current.hasLayer(userAccuracyCircleRef.current)) {
        userAccuracyCircleRef.current.setLatLng(position);
      } else {
        if (userAccuracyCircleRef.current) {
          try {
            userAccuracyCircleRef.current.remove();
          } catch (e) {}
        }
        userAccuracyCircleRef.current = L.circle(position, {
          radius: 900, // Safe 900m accuracy zone representation
          fillColor: '#3b82f6',
          fillOpacity: 0.16,
          color: '#2563eb',
          weight: 1.5,
          opacity: 0.35
        }).addTo(mapInstanceRef.current);
      }

      // 2. High-fidelity standard Marker with custom blue dot representation so it renders in the marker pane on top
      const userBlueDotIcon = L.divIcon({
        className: 'custom-leaflet-user-icon',
        html: `
          <div class="user-pulse-circle"></div>
          <div class="user-core-dot"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10]
      });

      if (userMarkerRef.current && mapInstanceRef.current.hasLayer(userMarkerRef.current)) {
        userMarkerRef.current.setLatLng(position);
      } else {
        if (userMarkerRef.current) {
          try {
            userMarkerRef.current.remove();
          } catch (e) {}
        }
        userMarkerRef.current = L.marker(position, {
          icon: userBlueDotIcon,
          zIndexOffset: 1000 // Ensure it renders on top of search pin marker
        }).addTo(mapInstanceRef.current)
          .bindPopup(`<b>Your Verified Location</b><br/>Lat: ${deviceLocation.lat.toFixed(4)}, Lng: ${deviceLocation.lng.toFixed(4)}`);
      }

      // 3. Pan to user physical device coordinates if triggered by manual button Click
      if (shouldCenterOnUserUpdateRef.current) {
        mapInstanceRef.current.setView(position, 12);
        if (userMarkerRef.current) {
          userMarkerRef.current.openPopup();
        }
        shouldCenterOnUserUpdateRef.current = false;
      }
    } else {
      // Clear out references if coordinates are deleted
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (e) {}
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        try {
          userAccuracyCircleRef.current.remove();
        } catch (e) {}
        userAccuracyCircleRef.current = null;
      }
    }
  }, [deviceLocation, mapLoaded]);

  // Invalidates size on element resize to prevent broken/grayed-out leaflet tiles
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapLoaded]);

  // Action: Center view on weather queries
  const handleRecenterWeather = () => {
    if (!L || !mapInstanceRef.current || !mapLoaded) return;
    mapInstanceRef.current.setView([latitude, longitude], 11);
    
    // Zoom in and open the selected layout area popup to signal reset
    if (markerInstanceRef.current) {
      markerInstanceRef.current.openPopup();
    }
  };

  // Action: Center view on GPS device location or fetch it
  const handleRecenterUser = () => {
    if (!L || !mapInstanceRef.current || !mapLoaded) return;

    if (deviceLocation) {
      mapInstanceRef.current.setView([deviceLocation.lat, deviceLocation.lng], 12);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else {
      // Flag to center once the location is updated statefully
      shouldCenterOnUserUpdateRef.current = true;
      if (onGetLocationWeather) {
        onGetLocationWeather();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden flex flex-col min-h-[465px] h-auto">
      {/* Card Header Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Interactive Weather Map</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {deviceLocation ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" style={{ animationDuration: '1.8s' }} />
                  <span>GPS Lock Ready</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-500 dark:text-amber-400 font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>Connecting GPS...</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs font-mono font-medium px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-500 self-start sm:self-center">
          Lat: {latitude.toFixed(3)}, Lng: {longitude.toFixed(3)}
        </span>
      </div>

      {/* Map Element Container */}
      <div className="relative h-[280px] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div id="leaflet-map-element" ref={mapContainerRef} className="w-full h-full z-0" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-2 z-10 w-full h-full">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400">Loading OpenStreetMap Canvas...</p>
          </div>
        )}
      </div>

      {/* Action Buttons: Cleanly placed BELOW the map, NOT on the map overlay */}
      {mapLoaded && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            id="recenter-current-forecast-btn"
            type="button"
            onClick={handleRecenterWeather}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:active:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-xs transition-all active:scale-95 cursor-pointer"
            title="Recenter on searched city weather coordinates"
          >
            <Navigation size={14} className="text-sky-500 rotate-45 transform" />
            <span>Center Weather</span>
          </button>

          <button
            id="recenter-user-btn"
            type="button"
            onClick={handleRecenterUser}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:active:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-xs transition-all active:scale-95 cursor-pointer"
            title="Locate and center map on my position"
          >
            <Compass size={14} className="text-emerald-500 animate-pulse animate-duration-[2000ms]" />
            <span>My Location</span>
          </button>
        </div>
      )}

      {/* Footer Info line */}
      <div className="flex items-start gap-2 mt-4 px-1 text-slate-400 dark:text-slate-500 text-[11px] leading-normal border-t border-slate-50 dark:border-slate-800/80 pt-3">
        <Info size={13} className="shrink-0 text-sky-500 mt-0.5" />
        <p>
          Use the <b>My Location</b> button to instantly fetch and lock your coordinates. Tapping <b>Center Weather</b> will return the map camera to focus on the active weather parameters card.
        </p>
      </div>
    </div>
  );
}
