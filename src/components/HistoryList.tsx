/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchHistoryItem, SavedWeatherReport } from '../types';
import { 
  CloudSun, 
  Trash2, 
  Plus, 
  Search, 
  Calendar, 
  Edit3, 
  Check, 
  X, 
  ChevronRight, 
  Bookmark, 
  FileText,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Droplets,
  Wind,
  CloudLightning,
  ChevronDown,
  BookOpen,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { WeatherReport } from '../types';
import { exportToCSV, exportToJSON, exportToPDF, exportToMarkdown, exportToXML } from '../utils/exportUtils';

interface HistoryListProps {
  searchHistory: SearchHistoryItem[];
  weatherReports: any[]; // Kept for compatibility with some dashboard props
  onSelectSearch: (query: string) => void;
  onClearSearchHistory: () => void;
  onAddReport?: (report: any) => Promise<any>; // Fallback
  onUpdateReport?: (id: string, report: any) => Promise<any>; // Fallback
  onDeleteReport?: (id: string) => Promise<any>; // Fallback
  sidebarMode?: boolean;
}

export default function HistoryList({
  searchHistory,
  onSelectSearch,
  onClearSearchHistory,
  sidebarMode = false,
  weatherReports = [],
  onAddReport,
  onUpdateReport,
  onDeleteReport,
}: HistoryListProps) {
  // Navigation Tabs for History section
  const [subTab, setSubTab] = useState<'search' | 'saved'>('search');

  // Date Range Search States
  const [locationInput, setLocationInput] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [rangeResult, setRangeResult] = useState<any>(null);

  // Notes state for new save
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Raw list of saved reports
  const [savedReports, setSavedReports] = useState<SavedWeatherReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');

  // Editing mode states
  const [editingReport, setEditingReport] = useState<SavedWeatherReport | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Confirmation deletion modal state
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Success toast helper local
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Download toggles & references
  const [isRangeDownloadOpen, setIsRangeDownloadOpen] = useState(false);
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [activeDownloadRowId, setActiveDownloadRowId] = useState<string | null>(null);

  const rangeDownloadDropdownRef = React.useRef<HTMLDivElement>(null);
  const bulkDownloadDropdownRef = React.useRef<HTMLDivElement>(null);
  const rowDownloadDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rangeDownloadDropdownRef.current && !rangeDownloadDropdownRef.current.contains(event.target as Node)) {
        setIsRangeDownloadOpen(false);
      }
      if (bulkDownloadDropdownRef.current && !bulkDownloadDropdownRef.current.contains(event.target as Node)) {
        setIsBulkDownloadOpen(false);
      }
      if (rowDownloadDropdownRef.current && !rowDownloadDropdownRef.current.contains(event.target as Node)) {
        setActiveDownloadRowId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper mappings for premium export
  const mapSavedToReport = (report: SavedWeatherReport): WeatherReport => {
    const summary = report.weatherData?.summary || {
      avgTempMax: 0,
      avgTempMin: 0,
      totalPrecipitation: 0,
      overallCondition: 'Stable'
    };
    return {
      _id: report._id,
      city: report.location,
      date: report.startDate,
      temperature: summary.avgTempMax,
      humidity: report.weatherData?.dailyData?.[0]?.humidityMean || 65,
      weatherCondition: summary.overallCondition,
      notes: report.notes || 'Saved Archived Meteorological Summary Log.',
      windSpeed: report.weatherData?.dailyData?.[0]?.windSpeedMax || 15,
      forecast: `Archive timeframe: ${report.startDate} to ${report.endDate}. Extremes: Avg High: ${summary.avgTempMax}°C, Avg Low: ${summary.avgTempMin}°C. Precipitation: ${summary.totalPrecipitation}mm.`,
      createdAt: report.createdAt
    };
  };

  const mapRangeToReport = (range: any): WeatherReport => {
    const summary = range.summary || {
      avgTempMax: 0,
      avgTempMin: 0,
      totalPrecipitation: 0,
      overallCondition: 'Stable'
    };
    return {
      _id: 'active_range_download',
      city: range.location,
      date: range.startDate,
      temperature: summary.avgTempMax,
      humidity: range.dailyData?.[0]?.humidityMean || 65,
      weatherCondition: summary.overallCondition,
      notes: `Range insights for ${range.location}.`,
      windSpeed: range.dailyData?.[0]?.windSpeedMax || 15,
      forecast: `Temporal scope: ${range.startDate} to ${range.endDate}. Average high: ${summary.avgTempMax}°C, Average low: ${summary.avgTempMin}°C. Accumulated rainfall: ${summary.totalPrecipitation}mm.`,
      createdAt: new Date().toISOString()
    };
  };

  const handleDownloadRangeResult = (type: 'csv' | 'json' | 'pdf' | 'xml' | 'markdown') => {
    if (!rangeResult) return;
    const mapped = [mapRangeToReport(rangeResult)];
    if (type === 'csv') exportToCSV(mapped);
    else if (type === 'json') exportToJSON(mapped);
    else if (type === 'pdf') exportToPDF(mapped);
    else if (type === 'xml') exportToXML(mapped);
    else if (type === 'markdown') exportToMarkdown(mapped);
  };

  const handleDownloadSavedSingle = (report: SavedWeatherReport, type: 'csv' | 'json' | 'pdf' | 'xml' | 'markdown') => {
    const mapped = [mapSavedToReport(report)];
    if (type === 'csv') exportToCSV(mapped);
    else if (type === 'json') exportToJSON(mapped);
    else if (type === 'pdf') exportToPDF(mapped);
    else if (type === 'xml') exportToXML(mapped);
    else if (type === 'markdown') exportToMarkdown(mapped);
  };

  const handleDownloadSavedAllSubmit = (type: 'csv' | 'json' | 'pdf' | 'xml' | 'markdown') => {
    if (savedReports.length === 0) return;
    const mapped = savedReports.map(mapSavedToReport);
    if (type === 'csv') exportToCSV(mapped);
    else if (type === 'json') exportToJSON(mapped);
    else if (type === 'pdf') exportToPDF(mapped);
    else if (type === 'xml') exportToXML(mapped);
    else if (type === 'markdown') exportToMarkdown(mapped);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => {
      setLocalToast(null);
    }, 3000);
  };

  // Fetch all saved reports on mount or sub-tab switch
  const fetchAllSavedReports = async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const res = await fetch('/api/weather/reports');
      if (!res.ok) throw new Error('Could not pull saved intelligence reports database.');
      const data = await res.json();
      setSavedReports(data);
    } catch (err: any) {
      setReportsError(err.message || 'Error occurred while loading reports');
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (!sidebarMode) {
      fetchAllSavedReports();
    }
  }, [sidebarMode]);

  // Execute range weather search
  const handleRangeSearchSubmit = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const queryTerm = presetQuery || locationInput.trim();

    if (!queryTerm) {
      setSearchError('Please provide a valid search queries coordinate, ZIP code, or city name.');
      return;
    }

    // 1. Validations
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setSearchError('Dates must be configured correctly.');
      return;
    }

    if (end < start) {
      setSearchError('Date range error: End Date must fall after Start Date!');
      return;
    }

    const minDate = new Date('1940-01-01');
    if (start < minDate) {
      setSearchError('Unsupported dates: Climate database supports requests starting from January 1st, 1940 or later.');
      return;
    }

    const maxFuture = new Date();
    maxFuture.setDate(maxFuture.getDate() + 16);
    if (end > maxFuture) {
      setSearchError('Prevent unrealistic future dates: Forecasting limit is capped at 16 days in the future.');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setRangeResult(null);
    
    try {
      const url = `/api/weather/range-search?q=${encodeURIComponent(queryTerm)}&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Server weather query geocoding or lookup fault.');
      }
      const data = await res.json();
      setRangeResult(data);
      setNotes(''); // reset save notes input
      showToast(`Fetched weather for ${data.location}!`, 'success');
    } catch (err: any) {
      setSearchError(err.message || 'Geocoding or Meteorological servers experienced an error.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Create a saved report
  const handleSaveReport = async () => {
    if (!rangeResult) return;
    setIsSaving(true);
    try {
      const payload = {
        location: rangeResult.location,
        startDate: rangeResult.startDate,
        endDate: rangeResult.endDate,
        weatherData: rangeResult,
        notes: notes.trim(),
      };

      const res = await fetch('/api/weather/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Could not serialize report contents');
      }

      showToast('Climate intelligence report saved successfully!', 'success');
      setNotes('');
      // Refresh reports list
      fetchAllSavedReports();
      // Switch tab to show it
      setSubTab('saved');
    } catch (err: any) {
      showToast(err.message || 'Error occurred saving report', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Launch report editor modal/card content
  const handleStartEdit = (report: SavedWeatherReport) => {
    setEditingReport(report);
    setEditLocation(report.location);
    setEditStartDate(report.startDate);
    setEditEndDate(report.endDate);
    setEditNotes(report.notes || '');
    setEditError('');
  };

  // Update a saved report (with optional re-fetching of weather data or raw values update)
  const handleUpdateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    if (!editLocation.trim()) {
      setEditError('Location query cannot be empty.');
      return;
    }

    const start = new Date(editStartDate);
    const end = new Date(editEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setEditError('Please configure valid date formats.');
      return;
    }
    if (end < start) {
      setEditError('End Date must fall after Start Date!');
      return;
    }

    setIsEditLoading(true);
    setEditError('');

    try {
      // Re-fetch weather if dates or location changed
      let finalWeatherData = editingReport.weatherData;
      const locationChanged = editLocation.trim() !== editingReport.location;
      const dateChanged = editStartDate !== editingReport.startDate || editEndDate !== editingReport.endDate;

      if (locationChanged || dateChanged) {
        showToast('Refreshing weather files for updated config...', 'info');
        const resolveRes = await fetch(`/api/weather/range-search?q=${encodeURIComponent(editLocation.trim())}&startDate=${editStartDate}&endDate=${editEndDate}`);
        if (!resolveRes.ok) {
          const errData = await resolveRes.json();
          throw new Error(errData.error || 'Unable to update geocoding config inputs.');
        }
        finalWeatherData = await resolveRes.json();
      }

      const payload = {
        location: editLocation.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
        weatherData: finalWeatherData,
        notes: editNotes.trim()
      };

      const res = await fetch(`/api/weather/reports/${editingReport._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || 'Failed to modify database record.');
      }

      showToast('Saved report updated successfully!', 'success');
      setEditingReport(null);
      fetchAllSavedReports();
    } catch (err: any) {
      setEditError(err.message || 'Could not update report config');
    } finally {
      setIsEditLoading(false);
    }
  };

  // Delete a saved report with confirmation modal
  const handleDeleteConfirm = async () => {
    if (!deletingReportId) return;
    setIsDeletingLoading(true);
    try {
      const res = await fetch(`/api/weather/reports/${deletingReportId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Could not delete report from repository database.');
      showToast('Report deleted successfully.', 'info');
      setSavedReports((prev) => prev.filter((r) => r._id !== deletingReportId));
      setDeletingReportId(null);
    } catch (err: any) {
      showToast(err.message || 'Error deleting report', 'error');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  // Convert chart data nicely
  const getChartData = () => {
    if (!rangeResult?.dailyData) return [];
    return rangeResult.dailyData.map((day: any) => ({
      name: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      max: day.tempMax,
      min: day.tempMin,
      precip: day.precipitationSum,
      wind: day.windSpeedMax || 0
    }));
  };

  if (sidebarMode) {
    // Elegant quick history sidebar mode
    return (
      <div className="glass-card rounded-3xl p-5 border border-white/40 dark:border-slate-800/60 flex flex-col h-full min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              <Search size={14} className="text-sky-500" /> Recent Search Queries
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">History of searched cities</p>
          </div>
          {searchHistory.length > 0 && (
            <button
              onClick={onClearSearchHistory}
              className="text-[10px] text-red-500 hover:text-red-600 font-bold py-1 px-2 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1 scrollbar-thin">
          {searchHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Search className="mx-auto mb-1.5 text-slate-300 dark:text-slate-700" size={24} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">No history logged</p>
            </div>
          ) : (
            searchHistory.map((item, idx) => (
              <motion.button
                key={item._id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                onClick={() => onSelectSearch(item.query)}
                className="w-full flex items-center justify-between p-2.5 bg-white/45 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl text-left group transition duration-150 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bookmark size={11} className="text-slate-400 group-hover:text-sky-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {item.query}
                  </span>
                </div>
                <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative select-text"
    >
      {/* Toast Alert overlay locally */}
      {localToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] max-w-sm w-full px-4">
          <div className={`p-3 rounded-2xl shadow-xl flex items-center gap-2.5 border ${
            localToast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/90 border-red-200 text-red-600 dark:text-red-300'
              : localToast.type === 'info'
              ? 'bg-sky-50 dark:bg-sky-950/90 border-sky-200 text-sky-600 dark:text-sky-300'
              : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 text-emerald-600 dark:text-emerald-300'
          }`}>
            <Info size={16} />
            <span className="text-xs font-bold leading-relaxed">{localToast.message}</span>
          </div>
        </div>
      )}

      {/* Main Panel Content (12 columns) */}
      <div className="lg:col-span-12 flex flex-col gap-6">
        
        {/* Navigation Tab Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 text-white rounded-2xl">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider leading-none">
                Climate Intelligence Reports
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 font-semibold uppercase tracking-widest">
                Compare ranges, discover trends, and CRUD saved observations
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setSubTab('search')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition select-none ${
                subTab === 'search'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
              }`}
            >
              <Search size={13} />
              Date-Range Query
            </button>
            <button
              onClick={() => {
                setSubTab('saved');
                fetchAllSavedReports();
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition select-none ${
                subTab === 'saved'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
              }`}
            >
              <FileText size={13} />
              Saved Archives ({savedReports.length})
            </button>
          </div>
        </div>

        {/* Tab content 1: Range Weather Search */}
        {subTab === 'search' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Form Column */}
            <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sparkles size={14} className="text-indigo-500" /> Start Meteorological Search
              </h3>

              {searchError && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/5 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-500/10 text-xs font-semibold">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <p>{searchError}</p>
                </div>
              )}

              <form onSubmit={handleRangeSearchSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                    Target Location query *
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="e.g. Zurich, 90210, 35.67,139.65, or Eiffel Tower"
                    className="w-full text-xs px-3.5 py-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-350 transition"
                    required
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                    Supports city names, zip codes, coordinates (lat,lon), or major monuments.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-105 outline-none focus:ring-1 focus:ring-indigo-550 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-105 outline-none focus:ring-1 focus:ring-indigo-550 transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={searchLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Processing Satellite Files...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Fetch Date-Range Meteo Chart
                    </>
                  )}
                </button>
              </form>

              {/* Recent queries lookup inside Range Search page */}
              {searchHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/65 space-y-2">
                  <span className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Quick Geocode History
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchHistory.slice(0, 5).map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setLocationInput(item.query);
                          handleRangeSearchSubmit(undefined, item.query);
                        }}
                        className="text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200/50 dark:border-slate-800 text-slate-655 dark:text-slate-400 hover:text-indigo-600 rounded-lg transition font-semibold"
                      >
                        {item.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Dashboard Display Column */}
            <div className="xl:col-span-8 space-y-6">
              
              {!rangeResult && !searchLoading && (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-sm">
                  <CloudSun className="mx-auto mb-3 text-indigo-500/20" size={54} />
                  <h4 className="text-sm font-black text-slate-750 dark:text-slate-300">Compare Historical and Forecast Ranges</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                    Provide a city name or coordinates and date parameters to visualize multi-day temperatures, precipitation totals, and load ground-truth meteorological files.
                  </p>
                </div>
              )}

              {searchLoading && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center py-24 gap-4">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={48} />
                    <Sparkles className="absolute text-indigo-400 animate-pulse" size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">Connecting with Open-Meteo Satellites</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Resolving coordinates with OpenStreetMap Nominatim proxy and caching range datasets...
                    </p>
                  </div>
                </div>
              )}

              {/* Range Weather results panel loaded */}
              {rangeResult && (
                <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl p-6 shadow-sm animate-fade-in">
                  
                  {/* Results Title Area */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20 rounded-full text-[9px] font-black uppercase tracking-wider mb-1.5 shadow-sm">
                        {rangeResult.isHistorical ? '📚 Historical Archive Record' : '🔮 Short-Term Climate Forecast'}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight">
                        {rangeResult.location}
                      </h3>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{rangeResult.startDate}</span>
                        <ArrowRight size={10} className="text-slate-450" />
                        <span>{rangeResult.endDate}</span>
                        <span className="text-slate-300">|</span>
                        <span>{rangeResult.dailyData.length} observation days logged</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left sm:text-right hidden sm:block">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Predominant Condition</p>
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mt-1">
                          {rangeResult.summary.overallCondition}
                        </p>
                      </div>

                      {/* Range observation query download option */}
                      <div className="relative" ref={rangeDownloadDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsRangeDownloadOpen((prev) => !prev)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-[10px] shadow-sm tracking-wide uppercase transition duration-100 cursor-pointer select-none"
                          title="Export queried time-series details in pro formats"
                        >
                          <Download size={13} />
                          <span>Export Results</span>
                        </button>
                        <AnimatePresence>
                          {isRangeDownloadOpen && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] overflow-hidden text-left"
                            >
                              <div className="p-1.5 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadRangeResult('csv');
                                    setIsRangeDownloadOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200/90"
                                >
                                  Spreadsheet CSV
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadRangeResult('json');
                                    setIsRangeDownloadOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200/90"
                                >
                                  Raw JSON Format
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadRangeResult('pdf');
                                    setIsRangeDownloadOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200/90"
                                >
                                  Adobe PDF Document
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadRangeResult('xml');
                                    setIsRangeDownloadOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200/90"
                                >
                                  Database XML Ledger
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadRangeResult('markdown');
                                    setIsRangeDownloadOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200/90"
                                >
                                  Rich Markdown Sheet
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Bento Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-150 dark:border-slate-800 rounded-2xl">
                      <span className="block text-[8px] font-black uppercase text-slate-400 mb-1 tracking-wider">Average High</span>
                      <span className="text-base sm:text-lg font-mono font-black text-red-500">
                        {rangeResult.summary.avgTempMax}°C
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-150 dark:border-slate-800 rounded-2xl">
                      <span className="block text-[8px] font-black uppercase text-slate-400 mb-1 tracking-wider">Average Low</span>
                      <span className="text-base sm:text-lg font-mono font-black text-sky-500">
                        {rangeResult.summary.avgTempMin}°C
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-150 dark:border-slate-800 rounded-2xl">
                      <span className="block text-[8px] font-black uppercase text-slate-400 mb-1 tracking-wider">Total Precip.</span>
                      <span className="text-base sm:text-lg font-mono font-black text-indigo-500">
                        {rangeResult.summary.totalPrecipitation} mm
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-150 dark:border-slate-800 rounded-2xl">
                      <span className="block text-[8px] font-black uppercase text-slate-400 mb-1 tracking-wider">Coords Grid</span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-600 dark:text-slate-300 block truncate" title={`${rangeResult.latitude}, ${rangeResult.longitude}`}>
                        {rangeResult.latitude.toFixed(3)}, {rangeResult.longitude.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Charts Tab Container */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-4 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1.5 select-none">
                        <TrendingUp size={12} /> Interactive Temperature & Rainfall Trend
                      </h4>
                      <span className="text-[9px] font-semibold text-slate-400 font-mono">Drag slider / Hover for values</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData()} margin={{ top: 8, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800/40" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                          <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(15, 23, 42, 0.9)', 
                              border: 'none', 
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: '#fff'
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Line type="monotone" dataKey="max" stroke="#EF4444" name="Max Temp (°C)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="min" stroke="#3B82F6" name="Min Temp (°C)" strokeWidth={2} />
                          <Line type="linear" dataKey="precip" stroke="#6366F1" name="Precip (mm)" strokeWidth={1} strokeDasharray="4 4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Saved Report form entry logic */}
                  <div className="bg-indigo-500/5 dark:bg-slate-850 border border-indigo-500/10 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest leading-none">
                      <FileText size={12} /> Save to Professional Archive Storage
                    </div>

                    <div className="flex flex-col sm:flex-row items-end gap-3">
                      <div className="w-full sm:flex-1">
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Optional: Enter observation remarks, landmark details, or field logs..."
                          className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleSaveReport}
                        disabled={isSaving}
                        className="w-full sm:w-auto shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer select-none flex items-center justify-center gap-1.5"
                      >
                        {isSaving ? (
                          <Loader2 className="animate-spin" size={13} />
                        ) : (
                          <Plus size={13} />
                        )}
                        Persist & Save Report
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* Tab content 2: Saved ARCHIVES Table / CRUD */}
        {subTab === 'saved' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="text-indigo-500" size={16} /> Saved Reports Inventory List
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wider">
                  List of captured date range reports with full editorial overrides
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {savedReports.length > 0 && (
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 py-1.5 px-2.5 rounded-lg font-bold font-mono text-slate-500">
                    Total: {savedReports.length} records
                  </span>
                )}

                {/* Bulk Export Dropdown Option */}
                {savedReports.length > 0 && (
                  <div className="relative" ref={bulkDownloadDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsBulkDownloadOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-200 font-bold rounded-xl text-[10px] shadow-sm tracking-wide uppercase transition duration-100 cursor-pointer select-none"
                    >
                      <Download size={12} className="text-sky-500" />
                      <span>Bulk Export</span>
                    </button>
                    <AnimatePresence>
                      {isBulkDownloadOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] overflow-hidden text-left"
                        >
                          <div className="p-1 bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800">
                            <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider px-2 py-1 select-none">
                              Export All {savedReports.length} Items
                            </span>
                          </div>
                          <div className="p-1.5 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleDownloadSavedAllSubmit('csv');
                                setIsBulkDownloadOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              Spreadsheet CSV
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDownloadSavedAllSubmit('json');
                                setIsBulkDownloadOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              Raw JSON Format
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDownloadSavedAllSubmit('pdf');
                                setIsBulkDownloadOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              Adobe PDF Document
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDownloadSavedAllSubmit('xml');
                                setIsBulkDownloadOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              Database XML Ledger
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDownloadSavedAllSubmit('markdown');
                                setIsBulkDownloadOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              Rich Markdown Sheet
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Error alerts */}
            {reportsError && (
              <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-650 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} /> {reportsError}
              </div>
            )}

            {/* Editing modal block */}
            {editingReport && (
              <div className="bg-indigo-500/5 border border-indigo-500/15 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/10">
                  <h4 className="text-[11px] font-black uppercase text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
                    <Edit3 size={12} /> Refine Report Parameters: {editingReport.location}
                  </h4>
                  <button onClick={() => setEditingReport(null)} className="text-slate-400 hover:text-slate-700">
                    <X size={15} />
                  </button>
                </div>

                {editError && (
                  <p className="p-2.5 rounded-xl bg-red-500/5 text-red-600 text-xs font-semibold border border-red-200/20">{editError}</p>
                )}

                <form onSubmit={handleUpdateReportSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[8px] font-black uppercase text-slate-400 mb-1.5">Location *</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100"
                      required
                    />
                  </div>
                  <div className="md:col-span-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 mb-1.5">Start Date *</label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="w-full text-[10px] px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 mb-1.5">End Date *</label>
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full text-[10px] px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[8px] font-black uppercase text-slate-400 mb-1.5">Observations notes & Remarks</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100"
                      placeholder="e.g. Aligned references"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isEditLoading}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer select-none"
                    >
                      {isEditLoading ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        <>
                          <Check size={12} /> Save
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReport(null)}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-500 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                <p className="text-[9px] text-slate-400 leading-none">
                  * Note: If dates or location change, the server automatically queries and translates real meteorological satellite databases again on save.
                </p>
              </div>
            )}

            {/* List Table / Card rendering */}
            {reportsLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-xs text-slate-405 font-bold">Synchronizing reporting archives records...</p>
              </div>
            )}

            {!reportsLoading && savedReports.length === 0 && (
              <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl select-none">
                <FileText className="mx-auto mb-2 text-slate-350 dark:text-slate-700" size={32} />
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-400">Archive inventory directory empty</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[285px] mx-auto leading-relaxed">
                  Go to <strong>Date-Range Query</strong> tab to perform coordinate range searches, analyze graphs and save documents here!
                </p>
              </div>
            )}

            {!reportsLoading && savedReports.length > 0 && (
              <>
                {/* Mobile Responsive Cards Layout (visible on phones/small screens) */}
                <div className="block sm:hidden space-y-4">
                  {savedReports.map((report) => {
                    const summary = report.weatherData?.summary || {
                      avgTempMax: 0,
                      avgTempMin: 0,
                      totalPrecipitation: 0,
                      overallCondition: 'Stable'
                    };
                    return (
                      <div 
                        key={report._id} 
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-3 relative animate-fade-in"
                      >
                        {/* Title & Date Range */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                              {report.location}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              <Calendar size={11} className="text-slate-450 shrink-0" />
                              <span>{report.startDate}</span>
                              <ArrowRight size={10} className="text-slate-350 shrink-0" />
                              <span>{report.endDate}</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/55 dark:border-slate-700 rounded-md text-[9px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {summary.overallCondition}
                          </span>
                        </div>

                        {/* Meteorological metrics in grid */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-850/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                          <div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Avg Temperatures</p>
                            <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                              <span className="text-red-500">{summary.avgTempMax}°C</span>
                              <span className="text-slate-300 dark:text-slate-600 px-1">/</span>
                              <span className="text-sky-500">{summary.avgTempMin}°C</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Accumulated Rain</p>
                            <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-350 mt-0.5">
                              {summary.totalPrecipitation} mm
                            </p>
                          </div>
                        </div>

                        {/* Notes remark */}
                        {report.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic bg-slate-50/30 dark:bg-black/10 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            "{report.notes}"
                          </div>
                        )}

                        {/* Footer timestamps and buttons */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3 mt-1">
                          <span className="text-[9px] font-mono text-slate-400">
                            {report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Row Download Dropdown option */}
                            <div className="relative inline-block text-left" ref={rowDownloadDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setActiveDownloadRowId(activeDownloadRowId === report._id ? null : report._id)}
                                className="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Download this record"
                              >
                                <Download size={13} />
                              </button>
                              <AnimatePresence>
                                {activeDownloadRowId === report._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] text-left"
                                  >
                                    <div className="p-1.5 space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadSavedSingle(report, 'csv');
                                          setActiveDownloadRowId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                      >
                                        Export as CSV
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadSavedSingle(report, 'json');
                                          setActiveDownloadRowId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                      >
                                        Export as JSON
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadSavedSingle(report, 'pdf');
                                          setActiveDownloadRowId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                      >
                                        Export as PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadSavedSingle(report, 'xml');
                                          setActiveDownloadRowId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-705 dark:text-slate-200"
                                      >
                                        Export as XML
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadSavedSingle(report, 'markdown');
                                          setActiveDownloadRowId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-705 dark:text-slate-200"
                                      >
                                        Export as Markdown
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <button
                              onClick={() => handleStartEdit(report)}
                              className="p-1.5 text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Edit report parameters"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingReportId(report._id)}
                              className="p-1.5 text-slate-400 hover:text-red-650 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Delete historical document"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Tablet Standard Table Layout (visible on larger screen sizes) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 text-[10px] uppercase text-slate-405 font-bold tracking-wider">
                        <th className="py-2.5 px-3">Location Name</th>
                        <th className="py-2.5 px-3">Date Range Query</th>
                        <th className="py-2.5 px-3">Average Max/Min</th>
                        <th className="py-2.5 px-3">Overall Trend</th>
                        <th className="py-2.5 px-3">Rainfall Total</th>
                        <th className="py-2.5 px-3">Archived Notes</th>
                        <th className="py-2.5 px-3">Saved Timestamp</th>
                        <th className="py-2.5 px-3 text-right">Overrides</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                      {savedReports.map((report) => {
                        const summary = report.weatherData?.summary || {
                          avgTempMax: 0,
                          avgTempMin: 0,
                          totalPrecipitation: 0,
                          overallCondition: 'Stable'
                        };
                        return (
                          <tr key={report._id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 group transition duration-100">
                            <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{report.location}</td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                                <Calendar size={11} className="text-slate-400" />
                                <span>{report.startDate}</span>
                                <ArrowRight size={10} className="text-slate-300" />
                                <span>{report.endDate}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-mono font-bold whitespace-nowrap">
                              <span className="text-red-500">{summary.avgTempMax}°C</span>
                              <span className="text-slate-300 px-1">/</span>
                              <span className="text-sky-500">{summary.avgTempMin}°C</span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-md text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                {summary.overallCondition}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-mono font-medium text-slate-500">{summary.totalPrecipitation} mm</td>
                            <td className="py-3.5 px-3 max-w-[150px] truncate text-slate-400 dark:text-slate-500" title={report.notes}>
                              {report.notes || '—'}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-[9px] text-slate-400 whitespace-nowrap">
                              {report.createdAt ? new Date(report.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                
                                {/* Row Download Dropdown option */}
                                <div className="relative inline-block text-left" ref={rowDownloadDropdownRef}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveDownloadRowId(activeDownloadRowId === report._id ? null : report._id)}
                                    className="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Download this record"
                                  >
                                    <Download size={13} />
                                  </button>
                                  <AnimatePresence>
                                    {activeDownloadRowId === report._id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                        className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] text-left"
                                      >
                                        <div className="p-1.5 space-y-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDownloadSavedSingle(report, 'csv');
                                              setActiveDownloadRowId(null);
                                            }}
                                            className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                          >
                                            Export as CSV
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDownloadSavedSingle(report, 'json');
                                              setActiveDownloadRowId(null);
                                            }}
                                            className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                          >
                                            Export as JSON
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDownloadSavedSingle(report, 'pdf');
                                              setActiveDownloadRowId(null);
                                            }}
                                            className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                          >
                                            Export as PDF
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDownloadSavedSingle(report, 'xml');
                                              setActiveDownloadRowId(null);
                                            }}
                                            className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                          >
                                            Export as XML
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDownloadSavedSingle(report, 'markdown');
                                              setActiveDownloadRowId(null);
                                            }}
                                            className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold text-slate-700 dark:text-slate-200"
                                          >
                                            Export as Markdown
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                <button
                                  onClick={() => handleStartEdit(report)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Edit report parameters"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => setDeletingReportId(report._id)}
                                  className="p-1.5 text-slate-400 hover:text-red-655 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Delete historical document"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Confirmation Deletion Modal overlay */}
      <AnimatePresence>
        {deletingReportId && (
          <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/70 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Delete saved weather report?
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Are you sure you want to purge this ground truth historical observations record from the archive database? This action is permanent and irreversible.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeletingLoading}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 text-white font-bold rounded-xl text-xs cursor-pointer select-none transition"
                >
                  {isDeletingLoading ? 'Processing...' : 'Yes, Delete Record'}
                </button>
                <button
                  onClick={() => setDeletingReportId(null)}
                  disabled={isDeletingLoading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
