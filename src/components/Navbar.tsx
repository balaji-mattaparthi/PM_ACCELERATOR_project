/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CloudSun, Layers, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'history' | 'settings';
  onChangeTab: (tab: 'dashboard' | 'history' | 'settings') => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export default function Navbar({
  activeTab,
  onChangeTab,
  isDark = false,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 transition duration-150 py-3 sm:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:h-16 items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand & Mobile Actions Row */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 bg-sky-500 text-white rounded-2xl shadow-sm hover:scale-105 transition-all">
              <CloudSun size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                PM Accelerator
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium mt-0.5 uppercase tracking-widest">
                Live Weather
              </p>
            </div>
          </div>

          {/* Quick shortcuts row for mobile display */}
          <div className="flex sm:hidden items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-850 rounded-xl transition cursor-pointer flex items-center justify-center"
                title="Toggle visual mode"
              >
                {isDark ? <Sun size={11} className="text-amber-400" /> : <Moon size={11} />}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => onChangeTab('dashboard')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold select-none transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <CloudSun size={13} />
            Forecast
          </button>
          
          <button
            onClick={() => onChangeTab('history')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold select-none transition relative cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            History & Logs
          </button>

          <button
            onClick={() => onChangeTab('settings')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold select-none transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <SettingsIcon size={13} />
            Settings
          </button>
        </nav>

        {/* Right side shortcuts (Desktop version) */}
        <div className="hidden sm:flex items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800 rounded-2xl transition cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={14} className="text-amber-400 animate-spin" style={{ animationDuration: '15s' }} /> : <Moon size={14} />}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
