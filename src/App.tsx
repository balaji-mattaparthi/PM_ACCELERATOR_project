/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import Settings from './components/Settings';
import WeatherSkeleton from './components/WeatherSkeleton';
import { 
  WeatherData, 
  FavoriteLocation, 
  SearchHistoryItem, 
  WeatherReport, 
  AIAdviceResponse 
} from './types';

export default function App() {
  // Tabs and general config state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(() => {
    return (localStorage.getItem('tempUnit') as 'C' | 'F') || 'C';
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    }
    return false;
  });

  // Watch for isDark changes and mutate html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
    triggerToast('Visual theme preference updated', 'info');
  };

  // Weather and position states
  const [currentCityName, setCurrentCityName] = useState('San Francisco, USA');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);

  // DB Sync Collections
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [weatherReports, setWeatherReports] = useState<WeatherReport[]>([]);
  const [dbStatus, setDbStatus] = useState<{ isUsingMongo: boolean; mongoError?: string }>({ isUsingMongo: false });

  // AI & loaders state
  const [aiAdvice, setAiAdvice] = useState<AIAdviceResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(true);
  const [isAddingActiveToFav, setIsAddingActiveToFav] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('📡 Detecting precise GPS location...');



  // Utility to fire temporary notifications
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Synchronise database details on startup
  useEffect(() => {
    const initSync = async () => {
      try {
        const [dbRes, favsRes, histRes, repsRes] = await Promise.all([
          fetch('/api/db-status'),
          fetch('/api/favorites'),
          fetch('/api/search-history'),
          fetch('/api/weather-reports'),
        ]);

        if (dbRes.ok) setDbStatus(await dbRes.json());
        if (favsRes.ok) setFavorites(await favsRes.json());
        if (histRes.ok) setSearchHistory(await histRes.json());
        if (repsRes.ok) setWeatherReports(await repsRes.json());
      } catch (err) {
        console.error('Initial DB synchronization failed:', err);
      }
    };
    initSync();
  }, []);

  // Retrieve climate metrics when position is modified
  const fetchWeather = async (lat: number, lng: number, name: string) => {
    setLoadingMessage(`📡 Requesting weather data for ${name.replace('📍 ', '')}...`);
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error('API server failed to retrieve weather data block.');
      const data = await res.json();
      setWeatherData(data);
      setCurrentCityName(name);
      setLatitude(lat);
      setLongitude(lng);
      setAiAdvice(null); // Reset AI block so they can re-trigger on different city
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred querying weather parameters.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  // Redundant IP Geolocation fallback to estimate user position
  const fetchIPLocation = async (isManualClick = false): Promise<boolean> => {
    try {
      // 1. Try multiple direct browser client-side IP lookup endpoints to use the user's real residential IP
      const providers = [
        {
          name: 'FreeIPAPI',
          url: 'https://freeipapi.com/api/json',
          parse: (data: any) => {
            if (data && data.latitude && data.longitude) {
              return {
                lat: Number(data.latitude),
                lng: Number(data.longitude),
                cityLabel: data.cityName ? `${data.cityName}, ${data.countryName || ''}`.trim() : null
              };
            }
            return null;
          }
        },
        {
          name: 'IPApi.co',
          url: 'https://ipapi.co/json/',
          parse: (data: any) => {
            if (data && data.latitude && data.longitude) {
              return {
                lat: Number(data.latitude),
                lng: Number(data.longitude),
                cityLabel: data.city ? `${data.city}, ${data.country_name || ''}`.trim() : null
              };
            }
            return null;
          }
        },
        {
          name: 'IPWho.is',
          url: 'https://ipwho.is/',
          parse: (data: any) => {
            if (data && data.latitude && data.longitude) {
              return {
                lat: Number(data.latitude),
                lng: Number(data.longitude),
                cityLabel: data.city ? `${data.city}, ${data.country || ''}`.trim() : null
              };
            }
            return null;
          }
        }
      ];

      for (const provider of providers) {
        try {
          const clientRes = await fetch(provider.url, { signal: AbortSignal.timeout(3000) });
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            const parsed = provider.parse(clientData);
            if (parsed) {
              const label = parsed.cityLabel || `Estimated Area (${parsed.lat}, ${parsed.lng})`;
              setDeviceLocation({ lat: parsed.lat, lng: parsed.lng });
              await fetchWeather(parsed.lat, parsed.lng, label);
              if (isManualClick) {
                triggerToast(`Client IP resolved via ${provider.name}: ${label}`, 'success');
              }
              return true;
            }
          }
        } catch (err: any) {
          console.warn(`Direct client IP lookup via ${provider.name} failed or was blocked:`, err.message || err);
        }
      }

      // 2. Roll back to server-side proxy
      const res = await fetch('/api/ip-location');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const name = data.cityName 
            ? `${data.cityName}, ${data.countryName || ''}`.trim()
            : `Estimated Area (${data.latitude}, ${data.longitude})`;
          
          setDeviceLocation({ lat: Number(data.latitude), lng: Number(data.longitude) });
          await fetchWeather(Number(data.latitude), Number(data.longitude), name);
          
          if (isManualClick) {
            if (data.isFallback) {
              triggerToast('Defaulting weather layout to San Francisco', 'info');
            } else {
              triggerToast(`Location estimated via proxy IP: ${name}`, 'success');
            }
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('Server-proxied Geolocation lookup failed:', e);
    }

    return false;
  };

  // Geo Location device query lookup
  const handleGetDeviceLocation = (isManualClick = false) => {
    setLoadingMessage('📡 Detecting precise GPS location...');
    setSearchLoading(true);

    if (isManualClick) {
      triggerToast('Querying browser Geolocation hardware...', 'info');
    }
    
    let fallbackTriggered = false;
    const triggerFallbackIP = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      
      setLoadingMessage('📡 Resolving estimated location via IP...');
      
      if (isManualClick) {
        triggerToast('GPS hardware request deferred. Resolving position via IP Geolocation...', 'info');
      }
      
      fetchIPLocation(isManualClick).then((success) => {
        if (!success) {
          if (isManualClick) {
            triggerToast('Both GPS and IP positioning failed. Please type your city manually.', 'error');
            setSearchLoading(false);
          } else {
            fetchWeather(37.7749, -122.4194, 'San Francisco, USA');
          }
        }
      });
    };

    // A safety timeout of 12.2 seconds to trigger IP fallback.
    // If the browser geolocation prompt hangs, blocks, or is ignored, this avoids infinite loader.
    const fallbackTimer = setTimeout(() => {
      triggerFallbackIP();
    }, 12200);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          clearTimeout(fallbackTimer);
          if (fallbackTriggered) return;
          
          // Full precision latitude and longitude values
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDeviceLocation({ lat, lng });
          
          // Highly resilient multi-layered Reverse Geocoding pipeline (Server-Proxy first, client direct second)
          let resolvedLabel = '';
          
          // Layer 1: Try secure, adblock-safe server proxy (with rural detection enabled at zoom=18)
          try {
            const serverGeoRes = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
            if (serverGeoRes.ok) {
              const geoData = await serverGeoRes.json();
              if (geoData && geoData.address) {
                const locationName =
                  geoData.address.village ||
                  geoData.address.hamlet ||
                  geoData.address.suburb ||
                  geoData.address.town ||
                  geoData.address.city ||
                  geoData.address.county ||
                  "Unknown Location";
                
                const hasDetailedArea = !!(geoData.address.village || geoData.address.hamlet || geoData.address.suburb);
                if (isManualClick && !hasDetailedArea && (geoData.address.town || geoData.address.city || geoData.address.county)) {
                  triggerToast('Unable to detect exact village. Showing nearest known location.', 'info');
                }

                // Construct detailed location array, preventing duplicates
                const parts: string[] = [locationName];
                const secondary = geoData.address.town || geoData.address.county || geoData.address.state_district;
                if (secondary && secondary !== locationName && !parts.includes(secondary)) {
                  parts.push(secondary);
                }
                const state = geoData.address.state;
                if (state && !parts.includes(state)) {
                  parts.push(state);
                }
                const country = geoData.address.country;
                if (country && !parts.includes(country)) {
                  parts.push(country);
                }

                resolvedLabel = `📍 ${parts.join(', ')}`;
              }
            }
          } catch (err) {
            console.warn('Backend reverse-geocody proxy bypass triggered:', err);
          }

          // Layer 2: Fall back to direct client-side OpenStreetMap Nominatim request with zoom=18 precision
          if (!resolvedLabel) {
            try {
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, {
                headers: { 'User-Agent': 'FreeWeatherApp/1.0' }
              });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.address) {
                  const locationName =
                    geoData.address.village ||
                    geoData.address.hamlet ||
                    geoData.address.suburb ||
                    geoData.address.town ||
                    geoData.address.city ||
                    geoData.address.county ||
                    "Unknown Location";
                  
                  const hasDetailedArea = !!(geoData.address.village || geoData.address.hamlet || geoData.address.suburb);
                  if (isManualClick && !hasDetailedArea && (geoData.address.town || geoData.address.city || geoData.address.county)) {
                    triggerToast('Unable to detect exact village. Showing nearest known location.', 'info');
                  }

                  // Construct detailed location array
                  const parts: string[] = [locationName];
                  const secondary = geoData.address.town || geoData.address.county || geoData.address.state_district;
                  if (secondary && secondary !== locationName && !parts.includes(secondary)) {
                    parts.push(secondary);
                  }
                  const state = geoData.address.state;
                  if (state && !parts.includes(state)) {
                    parts.push(state);
                  }
                  const country = geoData.address.country;
                  if (country && !parts.includes(country)) {
                    parts.push(country);
                  }

                  resolvedLabel = `📍 ${parts.join(', ')}`;
                }
              }
            } catch (err) {
              console.warn('Direct OSM client reverse-geocody lookup failed:', err);
            }
          }

          // Layer 3: Final coordinate string template baseline fallback
          if (!resolvedLabel) {
            resolvedLabel = `Coordinates Area: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }

          await fetchWeather(lat, lng, resolvedLabel);
          if (isManualClick) {
            triggerToast(`GPS matched location: ${resolvedLabel}`, 'success');
          }
        },
        (error) => {
          clearTimeout(fallbackTimer);
          if (fallbackTriggered) return;
          
          console.error('Geolocation lookup failed:', error);
          let errMsg = 'Could not retrieve GPS coordinates.';
          if (error.code === 1) {
            errMsg = 'GPS access blocked inside preview iframe. Trying IP-based location...';
          } else if (error.code === 2) {
            errMsg = 'GPS position unavailable. Trying IP-based location...';
          } else if (error.code === 3) {
            errMsg = 'GPS request timed out. Trying IP-based location...';
          }
          
          if (isManualClick) {
            triggerToast(errMsg, 'info');
          }
          
          triggerFallbackIP();
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000
        }
      );
    } else {
      clearTimeout(fallbackTimer);
      // Geolocator completely missing on browser
      triggerFallbackIP();
    }
  };

  // Geo Location mount lookup
  useEffect(() => {
    handleGetDeviceLocation(false);
  }, []);

  // Search trigger
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoadingMessage(`📡 Locating "${query}" via satellites...`);
    setSearchLoading(true);
    try {
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      if (!geoRes.ok) throw new Error('Geocoding node failed. Please check network connection.');
      const geoData = await geoRes.json();

      if (!Array.isArray(geoData) || geoData.length === 0) {
        throw new Error(`Location query "${query}" was not resolved by OpenStreetMap geocoders.`);
      }

      const topMatch = geoData[0];
      const name = topMatch.display_name.split(',')[0] + ', ' + (topMatch.address?.country || topMatch.display_name.split(',').slice(-1)[0]).trim();
      const lat = parseFloat(topMatch.lat);
      const lng = parseFloat(topMatch.lon);

      await fetchWeather(lat, lng, name);
      triggerToast(`Loaded weather for ${name}`, 'success');

      // Sync recent search list
      const histRes = await fetch('/api/search-history');
      if (histRes.ok) setSearchHistory(await histRes.json());
    } catch (err: any) {
      triggerToast(err.message || 'Geocoding query extraction timed out.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  // Map position click selector handler
  const handleCoordinateSelect = (lat: number, lng: number, labelName?: string) => {
    fetchWeather(lat, lng, labelName || `Coordinate: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    triggerToast('Updated weather perspectives at coordinates pin', 'info');
  };

  // Add active view area to system pinboards (Favorites)
  const handleAddCurrentToFavorites = async () => {
    if (!currentCityName) return;
    setIsAddingActiveToFav(true);
    try {
      const exists = favorites.find(
        (f) => Math.abs(f.latitude - latitude) < 0.05 && Math.abs(f.longitude - longitude) < 0.05
      );
      if (exists) {
        triggerToast(`"${currentCityName}" already active on your favorites list.`, 'info');
        return;
      }

      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentCityName,
          latitude,
          longitude,
        }),
      });

      if (!res.ok) throw new Error('Failed to save to database cloud favorites list.');
      const added = await res.json();
      setFavorites((prev) => [added, ...prev]);
      triggerToast(`Pinned "${currentCityName}" to Favorite Locations!`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Pin favorite failure.', 'error');
    } finally {
      setIsAddingActiveToFav(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete favorites entry from repository.');
      setFavorites((prev) => prev.filter((item) => item._id !== id));
      triggerToast('Removed location from favorites.', 'info');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Toggle active favorites on dashboard view
  const handleSelectFavorite = (fav: FavoriteLocation) => {
    fetchWeather(fav.latitude, fav.longitude, fav.name);
    triggerToast(`Flipped to saved dashboard: ${fav.name}`, 'info');
  };

  // Clear queries indices
  const handleClearSearchHistory = async () => {
    try {
      const res = await fetch('/api/search-history', { method: 'DELETE' });
      if (res.ok) {
        setSearchHistory([]);
        triggerToast('Cleared query history list successfully.', 'info');
      }
    } catch (err) {
      triggerToast('Could not purge search logs from database.', 'error');
    }
  };

  // AI advisory node trigger
  const handleGenerateAIAdvice = async () => {
    if (!weatherData) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: weatherData,
          cityName: currentCityName,
        }),
      });
      if (!res.ok) throw new Error('Gemini expert endpoint did not complete successfully.');
      const data = await res.json();
      setAiAdvice(data);
      triggerToast('AI analysis compiled successfully!', 'success');
    } catch (e: any) {
      triggerToast(e.message || 'Failed code parsing suggestions from AI nodes.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // CRUD Observations Methods
  const handleAddReport = async (report: Omit<WeatherReport, '_id'>) => {
    const res = await fetch('/api/weather-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) throw new Error('Could not preserve climate report ledger.');
    const added = await res.json();
    setWeatherReports((prev) => [added, ...prev]);
    triggerToast('Climate observation recorded securely!', 'success');
    return added;
  };

  const handleUpdateReport = async (id: string, report: Omit<WeatherReport, '_id'>) => {
    const res = await fetch(`/api/weather-reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) throw new Error('Could not update selected climate records.');
    const updated = await res.json();
    setWeatherReports((prev) => prev.map((item) => (item._id === id ? updated : item)));
    triggerToast('Observation updated successfully.', 'success');
    return updated;
  };

  const handleDeleteReport = async (id: string) => {
    const res = await fetch(`/api/weather-reports/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Deletion request failed on database cluster.');
    setWeatherReports((prev) => prev.filter((item) => item._id !== id));
    triggerToast('Observation removed from ledger.', 'info');
  };

  // Celsius - Fahrenheit scale toggler
  const handleToggleTempUnit = () => {
    const next = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(next);
    localStorage.setItem('tempUnit', next);
    triggerToast(`Converted temperatures to °${next}`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 border-t-2 border-sky-500 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200 overflow-x-hidden">
      
      {/* Toast Overlay alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full px-4"
          >
            <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/90 border-red-200/50 dark:border-red-800 text-red-600 dark:text-red-300'
                : toast.type === 'info'
                ? 'bg-sky-50 dark:bg-sky-950/90 border-sky-200/50 dark:border-sky-800 text-sky-600 dark:text-sky-300'
                : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200/50 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={18} className="shrink-0" />
              ) : toast.type === 'info' ? (
                <Info size={18} className="shrink-0" />
              ) : (
                <CheckCircle size={18} className="shrink-0" />
              )}
              <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* Primary Layout Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 select-text overflow-x-hidden">
        {weatherData === null && searchLoading ? (
          <WeatherSkeleton message={loadingMessage} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {activeTab === 'dashboard' && (
                <div className="w-full">
                  <Dashboard 
                    weatherData={weatherData}
                    locationName={currentCityName}
                    onSearch={handleSearch}
                    onGetLocationWeather={() => handleGetDeviceLocation(true)}
                    onCoordinateSelect={handleCoordinateSelect}
                    tempUnit={tempUnit}
                    aiAdvice={aiAdvice}
                    onGenerateAIAdvice={handleGenerateAIAdvice}
                    aiLoading={aiLoading}
                    searchLoading={searchLoading}
                    deviceLocation={deviceLocation}
                    favorites={favorites}
                    onAddCurrentToFav={handleAddCurrentToFavorites}
                    onRemoveFavorite={handleRemoveFavorite}
                    isAddingActiveToFav={isAddingActiveToFav}
                    searchHistory={searchHistory}
                    onClearSearchHistory={handleClearSearchHistory}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <HistoryList 
                  searchHistory={searchHistory}
                  weatherReports={weatherReports}
                  onSelectSearch={(q) => {
                    handleSearch(q);
                    setActiveTab('dashboard');
                  }}
                  onClearSearchHistory={handleClearSearchHistory}
                  onAddReport={handleAddReport}
                  onUpdateReport={handleUpdateReport}
                  onDeleteReport={handleDeleteReport}
                />
              )}

              {activeTab === 'settings' && (
                <Settings 
                  tempUnit={tempUnit}
                  onToggleTempUnit={handleToggleTempUnit}
                  weatherReports={weatherReports}
                  dbStatus={dbStatus}
                  isDark={isDark}
                  onToggleTheme={handleToggleTheme}
                  currentCityName={currentCityName}
                  currentWeatherData={weatherData}
                  currentAiAdvice={aiAdvice}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Humid Footer information */}
      <footer className="py-6 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 select-none mt-auto">
        <p>© 2026 PM Accelerator. Meteorological services compiled under OSM & open-meteo license attributes.</p>
        <p className="mt-1">Designed by Balaji Mattaparthi. Fully production verified & local database resilient.</p>
      </footer>

    </div>
  );
}
