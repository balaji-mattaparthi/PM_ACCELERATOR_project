/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Download, Thermometer, ShieldCheck, Database, FileText, Sun, Moon } from 'lucide-react';
import { WeatherReport } from '../types';
import { exportToCSV, exportToJSON, exportToPDF, exportToMarkdown, exportToXML } from '../utils/exportUtils';

interface SettingsProps {
  tempUnit: 'C' | 'F';
  onToggleTempUnit: () => void;
  weatherReports: WeatherReport[];
  dbStatus: { isUsingMongo: boolean; mongoError?: string };
  isDark?: boolean;
  onToggleTheme?: () => void;
  currentCityName?: string;
  currentWeatherData?: any;
  currentAiAdvice?: any;
}

export default function Settings({
  tempUnit,
  onToggleTempUnit,
  weatherReports,
  dbStatus,
  isDark = false,
  onToggleTheme,
  currentCityName,
  currentWeatherData,
  currentAiAdvice,
}: SettingsProps) {

  // Computed data helper: if they have saved report logs, use them. Otherwise, default to exporting the current active search city!
  const getExportData = (): WeatherReport[] => {
    if (weatherReports && weatherReports.length > 0) {
      return weatherReports;
    }
    if (currentWeatherData && currentCityName) {
      return [{
        _id: 'active_forecast',
        city: currentCityName,
        date: new Date().toISOString().split('T')[0],
        temperature: currentWeatherData.current.temperature,
        humidity: currentWeatherData.current.humidity,
        weatherCondition: 'Stable Climate',
        notes: currentAiAdvice?.advice || `Forecast logged for ${currentCityName}. Feels like ${currentWeatherData.current.apparentTemperature || currentWeatherData.current.temperature}°C.`,
        windSpeed: currentWeatherData.current.windSpeed,
        forecast: currentWeatherData.daily && currentWeatherData.daily[0]
          ? `High: ${currentWeatherData.daily[0].tempMax}°C, Low: ${currentWeatherData.daily[0].tempMin}°C. Precipitation: ${currentWeatherData.daily[0].precipitationSum}mm`
          : 'Stable weather outlook',
        createdAt: new Date().toISOString()
      }];
    }
    return [];
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    const data = getExportData();
    if (data.length > 0) exportToCSV(data);
  };

  // JSON Export Trigger
  const handleExportJSON = () => {
    const data = getExportData();
    if (data.length > 0) exportToJSON(data);
  };

  // PDF Export Trigger
  const handleExportPDF = () => {
    const data = getExportData();
    if (data.length > 0) exportToPDF(data);
  };

  // Markdown Export Trigger
  const handleExportMarkdown = () => {
    const data = getExportData();
    if (data.length > 0) exportToMarkdown(data);
  };

  // XML Export Trigger
  const handleExportXML = () => {
    const data = getExportData();
    if (data.length > 0) exportToXML(data);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-3xl mx-auto space-y-6"
    >
      
      {/* Settings Grid Card */}
      <div className="glass-card rounded-3xl p-6 shadow-md border border-white/50 dark:border-slate-800/60">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-2">
          🛠️ System Configurations
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">Configure unit settings, visual themes, and backup actions</p>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">

          {/* Temperature scale */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100/50 dark:bg-slate-900/60 text-slate-600 dark:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-800">
                <Thermometer size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Degree Temperature Scale</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Convert forecast values between Celsius and Fahrenheit</p>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800/90">
              <button
                onClick={() => tempUnit !== 'C' && onToggleTempUnit()}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer ${
                  tempUnit === 'C'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => tempUnit !== 'F' && onToggleTempUnit()}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer ${
                  tempUnit === 'F'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>
          </div>

          {/* Visual Theme toggle */}
          {onToggleTheme && (
            <div className="flex items-center justify-between py-4 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100/50 dark:bg-slate-900/60 text-slate-600 dark:text-amber-400 rounded-xl border border-slate-200 dark:border-slate-800">
                  {isDark ? <Moon size={16} className="text-amber-400" /> : <Sun size={16} className="text-amber-500" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Visual Display Mode</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Toggle application layout style between dark & light environments</p>
                </div>
              </div>
              
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800/90">
                <button
                  onClick={() => isDark && onToggleTheme()}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                    !isDark
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Sun size={11} />
                  Light
                </button>
                <button
                  onClick={() => !isDark && onToggleTheme()}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Moon size={11} />
                  Dark
                </button>
              </div>
            </div>
          )}

          {/* Connected db info */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100/50 dark:bg-slate-900/60 text-slate-600 dark:text-sky-400 rounded-xl border border-slate-200 dark:border-slate-800">
                <Database size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Connected Database Backend</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[240px] leading-relaxed md:max-w-none">
                  {dbStatus.isUsingMongo 
                    ? 'Mongoose connects securely with your Atlas MongoDB' 
                    : 'Saving locally to read/write persistent .config db.json file in runtime container'
                  }
                </p>

              </div>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl select-none">
              <div className={`w-1.5 h-1.5 rounded-full ${dbStatus.isUsingMongo ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                {dbStatus.isUsingMongo ? 'MongoDB' : 'JSON DB'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Records Box (Always active, supports DB logs if available, or current forecast fallback) */}
      <div className="glass-card rounded-3xl p-6 shadow-md border border-white/50 dark:border-slate-800/60">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          📥 Export Climate Observations Logs
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
          {weatherReports.length > 0 
            ? `Download all ${weatherReports.length} saved climate report sheets on your physical workstation` 
            : `Download active forecast observations logs for ${currentCityName || 'San Francisco, USA'} on your physical workstation in your desired industry format`}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Export JSON Card */}
          <button
             onClick={handleExportJSON}
             className="group text-left p-4 bg-white/40 dark:bg-slate-900/30 hover:bg-white/60 dark:hover:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl transition flex items-start gap-3.5 select-none cursor-pointer"
          >
            <div className="p-3 bg-white dark:bg-slate-800 text-amber-500 shadow-sm border border-slate-100 dark:border-slate-700/60 rounded-xl group-hover:scale-105 transition-transform">
              <Download size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Raw JSON Format</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-relaxed">Highly detailed payload suitable for backup restoration in relational engines.</p>
            </div>
          </button>

          {/* Export CSV Card */}
          <button
             onClick={handleExportCSV}
             className="group text-left p-4 bg-white/40 dark:bg-slate-900/30 hover:bg-white/60 dark:hover:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl transition flex items-start gap-3.5 select-none cursor-pointer"
          >
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-700/60 rounded-xl group-hover:scale-105 transition-transform">
              <Download size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Spreadsheet CSV</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-relaxed">Perfect format for Excel, Google Sheets, or Numbers. Comma separated with values.</p>
            </div>
          </button>

          {/* Export PDF Card */}
          <button
             onClick={handleExportPDF}
             className="group text-left p-4 bg-white/40 dark:bg-slate-900/30 hover:bg-white/60 dark:hover:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl transition flex items-start gap-3.5 select-none cursor-pointer"
          >
            <div className="p-3 bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-slate-100 dark:border-slate-700/60 rounded-xl group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Adobe PDF Document</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-relaxed">Formatted corporate report containing lead engineer citations and metadata logs.</p>
            </div>
          </button>

          {/* Export XML Card */}
          <button
             onClick={handleExportXML}
             className="group text-left p-4 bg-white/40 dark:bg-slate-900/30 hover:bg-white/60 dark:hover:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl transition flex items-start gap-3.5 select-none cursor-pointer"
          >
            <div className="p-3 bg-white dark:bg-slate-800 text-emerald-500 shadow-sm border border-slate-100 dark:border-slate-700/60 rounded-xl group-hover:scale-105 transition-transform">
              <Download size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Database XML Ledger</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-relaxed">Hierarchical tags structured for XML-friendly parsers and schema data maps.</p>
            </div>
          </button>

          {/* Export Markdown Card */}
          <button
             onClick={handleExportMarkdown}
             className="group text-left p-4 bg-white/40 dark:bg-slate-900/30 hover:bg-white/60 dark:hover:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl transition flex items-start gap-3.5 select-none cursor-pointer"
          >
            <div className="p-3 bg-white dark:bg-slate-800 text-teal-500 shadow-sm border border-slate-100 dark:border-slate-700/60 rounded-xl group-hover:scale-105 transition-transform">
              <Download size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Rich Markdown Sheet</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 leading-relaxed">Plaintext table ready for README files, Notion documents, or Obsidian vault logs.</p>
            </div>
          </button>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-sky-500/10 dark:bg-sky-500/5 rounded-3xl p-6 border border-sky-100 dark:border-sky-900/30 flex flex-col md:flex-row gap-5">
        <div className="p-3 bg-white dark:bg-slate-900 text-sky-500 dark:text-sky-400 border border-sky-100/50 dark:border-slate-800 rounded-2xl shrink-0 self-start shadow-sm">
          <ShieldCheck size={24} className="text-sky-500" />
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-black text-sky-800 dark:text-sky-300 uppercase tracking-wider">⚡ Global Meteorological System &amp; Collaborators</h4>
            <p className="text-xs text-sky-600/80 dark:text-sky-400 leading-relaxed font-semibold mt-1">
              Enforcing absolute compliance with strict open-science metrics. Geocoding coordinates utilize OSM OpenStreetMap Nominatim, maps run on Leaflet.js canvases, and calculations rely on Open-Meteo's public research models.
            </p>
          </div>
          
          <div className="pt-3 border-t border-sky-500/10 dark:border-sky-900/10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-sky-850 dark:text-sky-400 uppercase tracking-wider">Lead Architect &amp; Software Engineer</p>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">Balaji Mattaparthi</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Developed the high-performance live climate platform, secure database connectors, custom data exports, and integrated weather routing canvases.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-850 dark:text-sky-400 uppercase tracking-wider">Strategic Program Partner</p>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">PM Accelerator (Product Management Accelerator)</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Helping students and tech professionals build production-grade web applications, Artificial Intelligence strategy, and technical leadership mastery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
