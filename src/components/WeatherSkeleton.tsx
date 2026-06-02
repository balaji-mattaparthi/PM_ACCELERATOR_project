/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { CloudSun, Sparkles, MapPin, CalendarDays } from 'lucide-react';

interface WeatherSkeletonProps {
  message?: string;
}

export default function WeatherSkeleton({ message }: WeatherSkeletonProps) {
  return (
    <div className="space-y-6 relative overflow-hidden animate-fade-in w-full text-left">
      {/* Decorative background ambient dots */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-sky-200/10 dark:bg-sky-500/5 rounded-full blur-3xl" />
      <div className="absolute top-96 -right-32 w-80 h-80 bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />

      {message && (
        <div className="flex items-center justify-center gap-3 p-4 bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-800 rounded-3xl max-w-xl mx-auto animate-pulse shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-sans tracking-wide">{message}</span>
        </div>
      )}

      {/* Main Grid matches the Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Bento Blocks Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Current Weather Card Skeleton */}
          <div className="relative overflow-hidden bg-white/75 dark:bg-slate-900/75 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex flex-col justify-between space-y-8 md:space-y-0 w-full">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="h-8 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-3.5 w-1/3 bg-slate-100 dark:bg-slate-800/80 rounded animate-pulse" />
              </div>

              {/* Huge climate metric representation */}
              <div className="flex items-baseline gap-4 pt-4 md:pt-8 w-full">
                <div className="h-16 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Aux metrics sidebar skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0 justify-end md:w-[160px] w-full">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3 col-span-2 md:col-span-1">
                <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast Panel Grid Skeleton */}
          <div className="bg-white/75 dark:bg-slate-900/75 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" style={{ opacity: 0.6 }} />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-1/6 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>

            {/* Pulsing Sparkline Area */}
            <div className="h-24 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between w-full">
                <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-10 w-full border-b border-dashed border-slate-200/50 dark:border-slate-800/40 relative flex items-end justify-between">
                <div className="w-[12%] h-[20%] bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" />
                <div className="w-[12%] h-[40%] bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
                <div className="w-[12%] h-[35%] bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-[12%] h-[55%] bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="w-[12%] h-[48%] bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>

            {/* Daily column grid blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-150 dark:border-slate-800 rounded-2xl text-center flex flex-col items-center justify-between gap-3 min-h-[140px]"
                >
                  <div className="space-y-1 w-full flex flex-col items-center">
                    <div className="h-2.5 w-11 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-2 w-7 bg-slate-100 dark:bg-slate-800 rounded mt-1" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="space-y-1 w-full flex flex-col items-center">
                    <div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-6 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Section Skeleton */}
          <div className="bg-white/75 dark:bg-slate-900/75 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="w-20 h-5 bg-slate-100 dark:bg-slate-800 border border-slate-200/30 rounded" />
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl w-full animate-pulse" />
          </div>

        </div>

        {/* Sidebar Space Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Advisories Card Skeleton */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 flex flex-col h-[400px] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-sky-500/10 rounded-full blur-3xl" />
            
            <div className="flex justify-between items-center mb-5 border-b border-indigo-900/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Sparkles size={16} className="text-sky-300 animate-pulse animate-duration-[1800ms]" />
                </div>
                <div>
                  <div className="h-3 w-24 bg-white/20 rounded mt-0.5" />
                  <div className="h-2 w-16 bg-white/10 rounded mt-1.5" />
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white/15 animate-spin animate-duration-[3500ms]" />
            </div>

            <div className="flex-1 flex flex-col gap-5 justify-between">
              {/* Shimmer advising texts */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="h-3 bg-white/20 rounded w-11/12 animate-pulse" />
                <div className="h-3 bg-white/20 rounded w-full animate-pulse" />
                <div className="h-3 bg-white/20 rounded w-10/12 animate-pulse" />
                <div className="h-3 bg-white/20 rounded w-4/6 animate-pulse" />
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                <div className="h-2.5 bg-white/15 rounded w-1/3" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-white/10 border border-white/5 rounded-xl" />
                  <div className="h-6 w-14 bg-white/10 border border-white/5 rounded-xl" />
                  <div className="h-6 w-20 bg-white/10 border border-white/5 rounded-xl" />
                </div>
              </div>

              <div className="h-2 bg-white/5 rounded w-20 self-end" />
            </div>
          </div>

          {/* Quick Shortcuts Skeleton */}
          <div className="bg-white/75 dark:bg-slate-900/75 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-9 bg-slate-50 dark:bg-slate-950/40 rounded-xl" />
              <div className="h-9 bg-slate-50 dark:bg-slate-950/40 rounded-xl" />
              <div className="h-9 bg-slate-50 dark:bg-slate-950/40 rounded-xl" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
