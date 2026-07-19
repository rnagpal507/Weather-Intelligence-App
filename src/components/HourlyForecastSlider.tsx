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
            className={`min-w-[85px] p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-300 ${
              index === 0
                ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-950/20 scale-105 z-10 border border-slate-700/50"
                : `${hour.details.bgColor}/50 hover:${hour.details.bgColor}/80 border border-slate-200/40 text-slate-700 hover:scale-[1.03] hover:shadow-xs`
            }`}
          >
            {/* Hour Label */}
            <span className={`text-[10px] font-bold tracking-tight ${index === 0 ? "text-sky-300 uppercase" : "text-slate-400"}`}>
              {hour.hourLabel}
            </span>

            {/* Condition Icon */}
            <div className="my-2.5 transition-transform duration-300 group-hover:scale-110">
              <WeatherIcon
                name={hour.details.icon}
                className={index === 0 ? "text-amber-300 drop-shadow-[0_2px_8px_rgba(252,211,77,0.3)]" : hour.details.color}
                size={22}
              />
            </div>

            {/* Temperature */}
            <div className="space-y-0.5">
              <span className="text-sm font-extrabold tracking-tight">
                {hour.temp}{tempUnit}
              </span>
              <span className={`text-[9px] font-medium block ${index === 0 ? "text-slate-300" : "text-slate-500"}`}>
                Feels {hour.apparentTemp}°
              </span>
            </div>

            {/* Rain Probability */}
            {hour.precipProb > 0 && (
              <span className={`text-[9px] font-mono font-bold mt-1.5 flex items-center gap-0.5 ${index === 0 ? "text-sky-200" : "text-sky-600"}`}>
                💧{hour.precipProb}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
