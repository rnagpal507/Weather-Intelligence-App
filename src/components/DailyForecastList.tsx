import React, { useState } from "react";
import { DailyForecast, getWeatherDetails } from "../types";
import { WeatherIcon } from "./WeatherIcon";

interface DailyForecastListProps {
  daily: DailyForecast;
  unit: "celsius" | "fahrenheit";
}

export function DailyForecastList({ daily, unit }: DailyForecastListProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const tempUnit = unit === "fahrenheit" ? "°" : "°";

  const getDayName = (dateStr: string, index: number) => {
    if (index === 0) return "Today";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const toggleDay = (index: number) => {
    if (expandedDay === index) {
      setExpandedDay(null);
    } else {
      setExpandedDay(index);
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/50 p-6 shadow-md shadow-slate-100/40 space-y-4">
      <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider font-mono">
        7-Day Forecast & Daily Metrics
      </h3>

      <div className="space-y-3">
        {daily.time.map((time, index) => {
          const isExpanded = expandedDay === index;
          const details = getWeatherDetails(daily.weather_code[index]);
          const maxTemp = Math.round(daily.temperature_2m_max[index]);
          const minTemp = Math.round(daily.temperature_2m_min[index]);
          const appMax = Math.round(daily.apparent_temperature_max[index]);
          const appMin = Math.round(daily.apparent_temperature_min[index]);
          const rainProb = daily.precipitation_probability_max[index];
          const uvIndex = daily.uv_index_max[index];
          const windSpeed = daily.wind_speed_10m_max[index];

          // Format Sunrise & Sunset nicely
          const formatTime = (isoStr: string) => {
            return new Date(isoStr).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          };

          return (
            <div
              key={index}
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                isExpanded
                  ? `${details.bgColor}/60 border-slate-200/70 shadow-xs scale-[1.01]`
                  : `${details.bgColor}/20 hover:${details.bgColor}/40 border-slate-100/60 hover:scale-[1.005] hover:shadow-xs`
              }`}
            >
              {/* Main Summary Bar */}
              <div
                onClick={() => toggleDay(index)}
                className="flex items-center justify-between cursor-pointer"
              >
                {/* Day name & date */}
                <div className="w-28 space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-800">
                    {getDayName(time, index)}
                  </h4>
                  <span className="text-[10px] font-bold font-mono text-slate-400">
                    {formatDateLabel(time)}
                  </span>
                </div>

                {/* Condition Icon + Label */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2">
                  <div className={`p-2 rounded-xl bg-white shadow-xs shrink-0`}>
                    <WeatherIcon name={details.icon} className={details.color} size={18} />
                  </div>
                  <span className="text-xs text-slate-700 font-semibold truncate hidden sm:inline">
                    {details.label}
                  </span>
                </div>

                {/* Precip Prob */}
                <div className="w-16 text-right">
                  {rainProb > 0 ? (
                    <span className="text-xs text-sky-600 font-bold font-mono">
                      💧 {rainProb}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300 font-mono font-medium">-</span>
                  )}
                </div>

                {/* Temp Bars */}
                <div className="w-24 text-right flex items-center justify-end gap-3 font-mono">
                  <span className="text-xs font-extrabold text-slate-800">
                    {maxTemp}{tempUnit}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {minTemp}{tempUnit}
                  </span>
                  <WeatherIcon
                    name={isExpanded ? "ChevronUp" : "ChevronDown"}
                    className="text-slate-400 shrink-0 ml-1"
                    size={14}
                  />
                </div>
              </div>

              {/* Expandable detailed drawer */}
              {isExpanded && (
                <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-200/50 px-2 pb-1 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
                  {/* UV Index */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                      UV Exposure
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-700 font-mono">
                        {uvIndex.toFixed(1)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          uvIndex < 3
                            ? "bg-emerald-100 text-emerald-800"
                            : uvIndex < 6
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {uvIndex < 3 ? "Low" : uvIndex < 6 ? "Mod" : "High"}
                      </span>
                    </div>
                  </div>

                  {/* Apparent range */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                      Feels Like Range
                    </span>
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      {appMin}{tempUnit} to {appMax}{tempUnit}
                    </span>
                  </div>

                  {/* Wind Max */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                      Peak Wind
                    </span>
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      🌬️ {windSpeed} km/h
                    </span>
                  </div>

                  {/* Sunrise/Sunset */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                      Sun Schedule
                    </span>
                    <span className="text-xs font-semibold text-slate-700 font-mono flex flex-col sm:flex-row sm:gap-2">
                      <span>🌅 {formatTime(daily.sunrise[index])}</span>
                      <span className="hidden sm:inline text-slate-300">|</span>
                      <span>🌇 {formatTime(daily.sunset[index])}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
