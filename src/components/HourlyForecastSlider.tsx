import React from "react";
import { HourlyForecast, getWeatherDetails } from "../types";
import { WeatherIcon } from "./WeatherIcon";

interface HourlyForecastSliderProps {
  hourly: HourlyForecast;
  unit: "celsius" | "fahrenheit";
}

export function HourlyForecastSlider({ hourly, unit }: HourlyForecastSliderProps) {
  const tempUnit = unit === "fahrenheit" ? "°" : "°";

  // Slice the next 24 intervals of data starting from the nearest hour
  // Open-Meteo returns 168 hours (7 days) starting from midnight today
  const currentHourString = new Date().toISOString().substring(0, 13) + ":00";
  let startIndex = hourly.time.findIndex((t) => t.startsWith(currentHourString));
  if (startIndex === -1) startIndex = 0;

  const next24Hours = hourly.time.slice(startIndex, startIndex + 24).map((time, idx) => {
    const relativeIdx = startIndex + idx;
    const dateObj = new Date(time);
    let hourLabel = dateObj.toLocaleTimeString([], { hour: "numeric", hour12: true });

    // Mark current hour
    if (idx === 0) {
      hourLabel = "Now";
    }

    const temp = Math.round(hourly.temperature_2m[relativeIdx]);
    const apparentTemp = Math.round(hourly.apparent_temperature[relativeIdx]);
    const code = hourly.weather_code[relativeIdx];
    const precipProb = hourly.precipitation_probability[relativeIdx];
    const details = getWeatherDetails(code);

    return {
      hourLabel,
      temp,
      apparentTemp,
      precipProb,
      details,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider font-mono">
          24-Hour Timeline
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">
          Swipe horizontally to scroll
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-2 px-2 scroll-smooth">
        {next24Hours.map((hour, index) => (
          <div
            key={index}
            className={`min-w-[85px] p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
              index === 0
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/20 scale-105 z-10"
                : "bg-slate-50 hover:bg-slate-100/70 border border-slate-100 text-slate-700"
            }`}
          >
            {/* Hour Label */}
            <span className={`text-[10px] font-semibold tracking-tight ${index === 0 ? "text-sky-300" : "text-slate-400"}`}>
              {hour.hourLabel}
            </span>

            {/* Condition Icon */}
            <div className="my-2.5">
              <WeatherIcon
                name={hour.details.icon}
                className={index === 0 ? "text-amber-300" : hour.details.color}
                size={22}
              />
            </div>

            {/* Temperature */}
            <div className="space-y-0.5">
              <span className="text-sm font-bold tracking-tight">
                {hour.temp}{tempUnit}
              </span>
              <span className={`text-[9px] block ${index === 0 ? "text-slate-300" : "text-slate-400"}`}>
                Feels {hour.apparentTemp}°
              </span>
            </div>

            {/* Rain Probability */}
            {hour.precipProb > 0 && (
              <span className={`text-[9px] font-mono font-medium mt-1.5 flex items-center gap-0.5 ${index === 0 ? "text-sky-200" : "text-sky-600"}`}>
                💧{hour.precipProb}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
