/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { 
  WeatherData, 
  AIAdviceResponse,
  FavoriteLocation,
  SearchHistoryItem
} from '../types';
import { 
  Search, 
  Compass, 
  Droplets, 
  Wind, 
  Gauge, 
  Sparkles, 
  X,
  ChevronRight, 
  CloudSun, 
  CalendarDays,
  Sun,
  MapPin,
  RefreshCw,
  Loader2,
  CloudRain,
  Snowflake,
  CloudLightning,
  AlertTriangle,
  Download,
  Star,
  Clock
} from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF, exportToMarkdown, exportToXML } from '../utils/exportUtils';
import WeatherMap from './WeatherMap';

interface DashboardProps {
  weatherData: WeatherData | null;
  locationName: string;
  onSearch: (city: string) => void;
  onGetLocationWeather: () => void;
  onCoordinateSelect: (lat: number, lng: number, name?: string) => void;
  tempUnit: 'C' | 'F';
  aiAdvice: AIAdviceResponse | null;
  onGenerateAIAdvice: () => void;
  aiLoading: boolean;
  searchLoading: boolean;
  deviceLocation: { lat: number; lng: number } | null;
  favorites: FavoriteLocation[];
  onAddCurrentToFav: () => void;
  onRemoveFavorite: (id: string) => void;
  isAddingActiveToFav: boolean;
  searchHistory: SearchHistoryItem[];
  onClearSearchHistory: () => void;
}

const getWmoDetails = (code: number): { label: string; icon: string; color: string; text: string } => {
  if (code === 0) {
    return { label: 'Clear Sky', icon: '☀️', color: 'from-amber-400 to-orange-500 bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' };
  }
  if (code >= 1 && code <= 3) {
    return { label: 'Partly Cloudy', icon: '⛅', color: 'from-sky-400 to-indigo-500 bg-sky-500/10', text: 'text-sky-600 dark:text-sky-300' };
  }
  if (code >= 45 && code <= 48) {
    return { label: 'Foggy Mist', icon: '🌫️', color: 'from-slate-300 to-slate-500 bg-slate-400/10', text: 'text-slate-500 dark:text-slate-400' };
  }
  if (code >= 51 && code <= 55) {
    return { label: 'Drizzle', icon: '🌧️', color: 'from-teal-400 to-emerald-500 bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' };
  }
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return { label: 'Active Rain / Showers', icon: '☔', color: 'from-blue-400 to-cyan-500 bg-blue-500/10', text: 'text-blue-600 dark:text-cyan-300' };
  }
  if (code >= 71 && code <= 77) {
    return { label: 'Snowfall', icon: '❄️', color: 'from-violet-300 to-teal-200 bg-violet-400/10', text: 'text-violet-500 dark:text-violet-300' };
  }
  if (code >= 95 && code <= 99) {
    return { label: 'Thunderstorms', icon: '⛈️', color: 'from-purple-600 to-indigo-950 bg-indigo-500/10', text: 'text-purple-600 dark:text-indigo-400' };
  }
  switch (code) {
    case 51:
    case 53:
    case 55:
      return { label: 'Light Drizzle', icon: '🌧️', color: 'from-teal-300 to-teal-500 bg-teal-400/10', text: 'text-teal-600 dark:text-teal-400' };
    case 61:
    case 63:
    case 65:
      return { label: 'Rainy', icon: '☔', color: 'from-blue-400 to-indigo-500 bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400 font-bold' };
    default:
      return { label: 'Mainly Cloudy', icon: '☁️', color: 'from-slate-400 to-slate-600 bg-slate-500/10', text: 'text-slate-500 dark:text-slate-400' };
  }
};

export default function Dashboard({
  weatherData,
  locationName,
  onSearch,
  onGetLocationWeather,
  onCoordinateSelect,
  tempUnit,
  aiAdvice,
  onGenerateAIAdvice,
  aiLoading,
  searchLoading,
  deviceLocation,
  favorites,
  onAddCurrentToFav,
  onRemoveFavorite,
  isAddingActiveToFav,
  searchHistory,
  onClearSearchHistory,
}: DashboardProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  // Filter uniquely searched term queries, slice up to 5 newest items
  const recentSearches = Array.from(
    new Map((searchHistory || []).map((item) => [item.query.trim().toLowerCase(), item])).values()
  ).slice(0, 5);

  // Close recent searches box or download dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Download logic for the active forecast parameters
  const handleDownloadCurrent = (type: 'csv' | 'json' | 'pdf' | 'xml' | 'markdown') => {
    if (!weatherData) return;
    const currentReport = {
      _id: 'current_active_forecast',
      city: locationName,
      date: new Date().toISOString().split('T')[0],
      temperature: weatherData.current.temperature,
      humidity: weatherData.current.humidity,
      weatherCondition: getWmoDetails(weatherData.current.weatherCode).label,
      notes: aiAdvice 
        ? aiAdvice.advice 
        : `Weather details for ${locationName}. Apparent temperature feels like ${weatherData.current.apparentTemperature || weatherData.current.temperature}°C.`,
      windSpeed: weatherData.current.windSpeed,
      forecast: weatherData.daily && weatherData.daily[0]
        ? `High: ${weatherData.daily[0].tempMax}°C, Low: ${weatherData.daily[0].tempMin}°C. Precipitation: ${weatherData.daily[0].precipitationSum}mm`
        : 'Stable weather outlook.',
      createdAt: new Date().toISOString()
    };
    
    const reportsArray = [currentReport];

    if (type === 'csv') exportToCSV(reportsArray);
    else if (type === 'json') exportToJSON(reportsArray);
    else if (type === 'pdf') exportToPDF(reportsArray);
    else if (type === 'xml') exportToXML(reportsArray);
    else if (type === 'markdown') exportToMarkdown(reportsArray);
  };

  // Check if current location is favorited
  const isFavorited = (favorites || []).some(
    (f) => f.name.toLowerCase() === locationName.toLowerCase() ||
    (Math.abs(f.latitude - (weatherData?.latitude || 0)) < 0.005 &&
     Math.abs(f.longitude - (weatherData?.longitude || 0)) < 0.005)
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      setIsSearchFocused(false);
    }
  };

  // Temperature unit conversion formatting
  const formatTemp = (temp: number) => {
    if (tempUnit === 'F') {
      const fahr = (temp * 9) / 5 + 32;
      return `${fahr.toFixed(1)}°F`;
    }
    return `${temp.toFixed(1)}°C`;
  };

  const currentWmo = weatherData ? getWmoDetails(weatherData.current.weatherCode) : null;

  const getAlertBadge = () => {
    if (!weatherData) return null;
    const code = weatherData.current.weatherCode;
    
    // Rain conditions (Drizzle, rain, showers)
    if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
      return {
        icon: <CloudRain size={11} className="text-sky-500 animate-pulse" />,
        label: 'Precipitation Warning: Rain Active',
        classes: 'bg-sky-500/10 border-sky-400/20 text-sky-700 dark:text-sky-300'
      };
    }
    
    // Snow conditions
    if (code >= 71 && code <= 77) {
      return {
        icon: <Snowflake size={11} className="text-indigo-400" />,
        label: 'Advisory: Snowfall Active',
        classes: 'bg-indigo-500/10 border-indigo-400/30 text-indigo-700 dark:text-indigo-300'
      };
    }
    
    // Thunderstorm conditions
    if (code >= 95 && code <= 99) {
      return {
        icon: <AlertTriangle size={11} className="text-amber-500 animate-bounce" />,
        label: 'Warning: Thunderstorms Active',
        classes: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
      };
    }
    
    return null;
  };

  const alertBadge = getAlertBadge();

  const chartData = weatherData
    ? weatherData.daily.slice(0, 5).map((day) => {
        const dateObj = new Date(day.date);
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabel = daysOfWeek[dateObj.getDay()];
        
        const maxVal = tempUnit === 'F' ? (day.tempMax * 9) / 5 + 32 : day.tempMax;
        const minVal = tempUnit === 'F' ? (day.tempMin * 9) / 5 + 32 : day.tempMin;
        
        return {
          name: dayLabel,
          Max: parseFloat(maxVal.toFixed(1)),
          Min: parseFloat(minVal.toFixed(1)),
        };
      })
    : [];

  return (
    <div className="space-y-6 relative overflow-x-hidden px-1 py-1">
      {/* Decorative ambient blurred layout background glows */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-sky-400/15 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-15" />
      <div className="absolute top-96 -right-32 w-80 h-80 bg-indigo-400/12 dark:bg-indigo-500/80 rounded-full blur-3xl pointer-events-none -z-15" />

      {/* Geocoding Search panel */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div ref={searchContainerRef} className="flex-1 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search city, ZIP, or landmark (e.g. Eiffel Tower, 90210, Tokyo)..."
                className="w-full pl-11 pr-5 py-3.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-sky-500 hover:shadow-sm transition duration-200"
              />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              
              {searchLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="text-sky-500 animate-spin" />
                </div>
              )}
            </form>

            <AnimatePresence>
              {isSearchFocused && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 backdrop-blur-md"
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 select-none">
                        <Clock size={10} className="text-sky-500" /> Recent Searches
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onClearSearchHistory();
                        }}
                        className="text-[10px] text-red-500 hover:text-red-600 dark:hover:text-red-400 font-bold hover:underline transition px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-0.5">
                      {recentSearches.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchInput(item.query);
                            onSearch(item.query);
                            setIsSearchFocused(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-left transition duration-100 cursor-pointer text-xs"
                        >
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                            {item.query}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={onGetLocationWeather}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 font-semibold rounded-3xl text-xs text-slate-700 dark:text-slate-200 shadow-sm transition"
              title="Localize via GPS"
            >
              <Compass size={14} className="text-sky-500" />
              GPS Location
            </button>

            <button
              onClick={() => {
                if (isFavorited) {
                  const favId = favorites.find(
                    (f) => f.name.toLowerCase() === locationName.toLowerCase() ||
                    (Math.abs(f.latitude - (weatherData?.latitude || 0)) < 0.005 &&
                     Math.abs(f.longitude - (weatherData?.longitude || 0)) < 0.005)
                  )?._id;
                  if (favId) onRemoveFavorite(favId);
                } else {
                  onAddCurrentToFav();
                }
              }}
              disabled={!weatherData || isAddingActiveToFav}
              className={`px-4 py-3.5 border rounded-3xl transition duration-150 ${
                isFavorited
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Pin to favorites'}
            >
              <Star size={16} className={isFavorited ? 'fill-white' : ''} />
            </button>

            {/* Premium Download Dropdown */}
            <div className="relative" ref={downloadDropdownRef}>
              <button
                type="button"
                onClick={() => setIsDownloadOpen((prev) => !prev)}
                disabled={!weatherData}
                className="flex items-center gap-2 px-5 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-650 text-white font-bold rounded-3xl text-xs shadow-md shadow-sky-500/15 hover:shadow-sky-500/25 transition cursor-pointer select-none"
                title="Download current meteorological observations in premium industry formats"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </button>

              <AnimatePresence>
                {isDownloadOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[100] overflow-hidden backdrop-blur-md"
                  >
                    <div className="p-2 border-b border-slate-105 dark:border-slate-800/60">
                      <span className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider px-2 py-1 select-none">
                        Select Download Format
                      </span>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadCurrent('csv');
                          setIsDownloadOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-left transition text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        Spreadsheet CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadCurrent('json');
                          setIsDownloadOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-left transition text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Raw JSON Format
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadCurrent('pdf');
                          setIsDownloadOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-left transition text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        Adobe PDF Document
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadCurrent('xml');
                          setIsDownloadOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Database XML Ledger
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDownloadCurrent('markdown');
                          setIsDownloadOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left transition text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        Rich Markdown Sheet
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Favorite Locations list as clean pins without extra container structures */}
        {favorites && favorites.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 select-none">
              <Star size={11} className="text-amber-400 fill-amber-400 animate-pulse" /> Pinned:
            </span>
            {favorites.map((fav) => (
              <div 
                key={fav._id}
                onClick={() => onCoordinateSelect(fav.latitude, fav.longitude, fav.name)}
                className="group flex items-center gap-1.5 px-3 py-1 bg-white/60 dark:bg-slate-900/40 hover:bg-sky-50 dark:hover:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 rounded-full text-[11px] font-semibold cursor-pointer transition select-none hover:scale-[1.01]"
              >
                <span className="text-slate-600 dark:text-slate-305">
                  {fav.name.split(',')[0]}
                </span>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav._id);
                  }}
                  className="text-slate-400 hover:text-rose-500 transition p-[1px]"
                  title="Unpin location"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

      </motion.div>

      {weatherData ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Main Weather Information Bento Section */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Current details box with elegant glassmorphism and subtle background mesh */}
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden glass-card rounded-3xl p-6 md:p-8 text-slate-800 dark:text-white shadow-xl/5 border border-white/50 dark:border-slate-800/60 flex flex-col md:flex-row items-stretch justify-between gap-6"
            >
              {/* Subtle visual radial background coordinate lights */}
              <div className="absolute right-0 bottom-0 w-44 h-44 bg-blue-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Climate Summary */}
              <div className="flex flex-col justify-between space-y-6 md:space-y-0 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-sky-600 dark:text-sky-300">
                      <MapPin size={11} className="stroke-[2.5]" />
                      Current Metrics
                    </div>

                    {alertBadge && (
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 100 }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border shadow-sm select-none ${alertBadge.classes}`}
                      >
                        {alertBadge.icon}
                        <span>{alertBadge.label}</span>
                      </motion.div>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-50 mt-1.5 truncate max-w-full md:max-w-md lg:max-w-lg min-w-0">
                    {locationName || 'Unknown Region'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live Geocoded Coordinates Report
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mt-4 md:mt-8">
                  <span className="text-5xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-white selection:bg-amber-400">
                    {formatTemp(weatherData.current.temperature)}
                  </span>
                  <div className="flex flex-col select-none">
                    <span className="text-2xl font-semibold leading-none">{currentWmo?.icon}</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-sky-100/90 mt-1.5 whitespace-nowrap">{currentWmo?.label}</span>
                  </div>
                </div>
              </div>

              {/* Auxiliary Bento Stats */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0 justify-end md:w-[160px] relative z-10">
                
                {/* Wind */}
                <div className="p-3 bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm/5 rounded-2xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 dark:bg-black/20 text-blue-600 dark:text-sky-300 rounded-lg">
                    <Wind size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Wind speed</p>
                    <p className="text-xs font-bold font-mono text-slate-750 dark:text-slate-200 truncate">{weatherData.current.windSpeed} km/h</p>
                  </div>
                </div>

                {/* Humidity */}
                <div className="p-3 bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm/5 rounded-2xl flex items-center gap-2.5">
                  <div className="p-1.5 bg-sky-50 dark:bg-black/20 text-sky-600 dark:text-sky-300 rounded-lg">
                    <Droplets size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Humidity</p>
                    <p className="text-xs font-bold font-mono text-slate-750 dark:text-slate-200 truncate">{weatherData.current.humidity}%</p>
                  </div>
                </div>

                {/* Feels like */}
                {weatherData.current.apparentTemperature !== undefined && (
                  <div className="p-3 bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm/5 rounded-2xl flex items-center gap-2.5 max-md:col-span-2">
                    <div className="p-1.5 bg-orange-50 dark:bg-black/20 text-orange-600 dark:text-amber-300 rounded-lg">
                      <Gauge size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Apparent Feels</p>
                      <p className="text-xs font-bold font-mono text-slate-750 dark:text-slate-200 truncate">{formatTemp(weatherData.current.apparentTemperature)}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 5-Day Forecast Grid */}
            <div className="glass-card rounded-3xl p-6 shadow-xl/5 border border-white/50 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-xl">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">5-Day Meteorological Forecast</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Upcoming weather predictions</p>
                </div>
              </div>

              {/* Sparkline Temperature Trend */}
              <div className="mb-6 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/60 dark:border-slate-800/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3.5 select-none">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">Weekly Temperature Trend</span>
                    <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Max</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Min</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-550">Interactive Sparkline</span>
                </div>
                <div className="h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorMaxTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                        </linearGradient>
                        <linearGradient id="colorMinTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 500 }} 
                        dy={4}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white/98 dark:bg-slate-950 px-3 py-2 border border-slate-200 dark:border-slate-800/90 rounded-xl text-[10px] font-sans shadow-md select-none">
                                <p className="font-extrabold text-slate-800 dark:text-white mb-1 tracking-wide">{payload[0].payload.name}</p>
                                <p className="text-amber-500 font-bold flex items-center justify-between gap-3">
                                  Max: <span className="font-mono">{payload[0].value}°{tempUnit}</span>
                                </p>
                                <p className="text-sky-500 font-bold flex items-center justify-between gap-3">
                                  Min: <span className="font-mono">{payload[1].value}°{tempUnit}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Max"
                        stroke="#f59e0b"
                        strokeWidth={1.8}
                        fillOpacity={1}
                        fill="url(#colorMaxTemp)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Min"
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        fillOpacity={1}
                        fill="url(#colorMinTemp)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-5 gap-3">
                {weatherData.daily.slice(0, 5).map((day, idx) => {
                  const dayWmo = getWmoDetails(day.weatherCode);
                  const isToday = idx === 0;
                  
                  // Format Day Label
                  const dateObj = new Date(day.date);
                  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const label = isToday ? 'Today' : daysOfWeek[dateObj.getDay()];

                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      whileHover={{ scale: 1.025, y: -2 }}
                      className={`p-3.5 rounded-2xl border flex flex-row sm:flex-col items-center justify-between gap-3 transition duration-150 w-full ${
                        isToday
                          ? 'bg-sky-500/10 border-sky-500/30 ring-1 ring-sky-500/20'
                          : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800'
                      }`}
                    >
                      {/* Left Block on Mobile / Top on Desktop */}
                      <div className="flex items-center gap-3 sm:flex-col sm:gap-1 text-left sm:text-center min-w-[85px] sm:min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-sky-600 dark:text-sky-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'}`}>
                          {label}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium font-mono sm:mt-0.5">{day.date.substring(5)}</p>
                      </div>

                      {/* Icon */}
                      <span className="text-2xl select-none sm:my-1.5" title={dayWmo.label}>{dayWmo.icon}</span>

                      {/* Right Block Temp & Rain */}
                      <div className="flex items-center gap-4 sm:flex-col sm:gap-1 text-right sm:text-center">
                        <div className="flex items-baseline gap-1.5 sm:flex-col sm:gap-0 sm:items-center">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {formatTemp(day.tempMax)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {formatTemp(day.tempMin)}
                          </p>
                        </div>

                        {day.precipitationSum > 0 && (
                          <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-lg text-[9px] font-mono leading-none text-blue-500 shrink-0">
                            {day.precipitationSum} mm
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Smart Map Selection component embedded in layout bento */}
            <WeatherMap 
              latitude={weatherData.latitude} 
              longitude={weatherData.longitude} 
              locationName={locationName}
              onCoordinateSelect={onCoordinateSelect}
              deviceLocation={deviceLocation}
              onGetLocationWeather={onGetLocationWeather}
            />

          </div>

          {/* Sidebar Area: AI Suggestions & Quick Pinboard */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Advisor Card with glassmorphic starlight borders */}
            <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800/80 flex flex-col min-h-[385px] overflow-hidden relative">
              
              {/* Stars decoration */}
              <div className="absolute right-0 top-0 w-36 h-36 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/4 bottom-0 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-5 z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
                    <Sparkles size={16} className="animate-pulse text-sky-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
                      AI Weather Advisor
                    </h3>
                    <p className="text-[10px] text-indigo-300/80 mt-1 font-sans">Powered by server-grounded Gemini</p>
                  </div>
                </div>

                <button
                  onClick={onGenerateAIAdvice}
                  disabled={aiLoading}
                  className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 transition duration-150"
                  title="Refresh recommendations"
                >
                  <RefreshCw size={13} className={aiLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {aiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border border-indigo-500/30 border-t-sky-400 animate-spin" />
                    <Sparkles size={12} className="absolute inset-x-0 inset-y-0 m-auto text-sky-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white tracking-wide">Synthesizing Advice...</p>
                    <p className="text-[10px] text-indigo-300 max-w-[180px] mt-1">Cross-referencing index values and active coordinates</p>
                  </div>
                </div>
              ) : aiAdvice ? (
                <div className="flex-1 flex flex-col justify-between space-y-5 z-10 text-xs text-slate-100">
                  
                  {/* Summary paragraph */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 leading-relaxed tracking-wide select-text">
                    {aiAdvice.advice}
                  </div>

                  {/* Recommendations layout */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Wear */}
                    <div>
                      <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sun size={11} /> Apparel Outfit Recommendations
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {aiAdvice.clothingSuggestions.map((wear, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2.5 py-1 bg-white/10 border border-white/5 rounded-xl text-[10px] font-medium"
                          >
                            {wear}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Strolls/Sports */}
                    <div>
                      <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">
                        🚴 Outdoor Suitability
                      </h4>
                      <p className="text-[11px] text-indigo-100">{aiAdvice.activitySuitability}</p>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 font-mono mt-2 self-end">
                    Advice current as of {new Date(aiAdvice.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-4 z-10">
                  <Sparkles size={36} className="text-indigo-400 animate-bounce" />
                  <div>
                    <p className="text-xs font-bold text-white">Advice Synthesizer Ready</p>
                    <p className="text-[10px] text-indigo-300 max-w-[210px] mt-1 mx-auto leading-relaxed">
                      Tap below to generate immediate, structured advice about what clothing to choose and what activities to schedule.
                    </p>
                  </div>
                  <button
                    onClick={onGenerateAIAdvice}
                    className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 font-semibold rounded-2xl text-xs hover:shadow-md transition duration-150"
                  >
                    Generate Smart Advice
                  </button>
                </div>
              )}

            </div>

          </div>

        </motion.div>
      ) : (
        <div className="text-center py-20 bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-950 text-sky-500 rounded-3xl flex items-center justify-center">
            <CloudSun size={24} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">No active meteorological index parsed</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[340px] leading-relaxed mx-auto">
              Please insert a city name in the query search line above, choose to lock onto your coordinate location via GPS, or click any grid spot on the map to display its weather.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
