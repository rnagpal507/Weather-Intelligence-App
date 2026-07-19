import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CitySearchResult,
  ForecastResponse,
  WeatherRecommendations,
  getWeatherDetails,
} from "./types";
import { WeatherIcon } from "./components/WeatherIcon";
import { HourlyForecastSlider } from "./components/HourlyForecastSlider";
import { DailyForecastList } from "./components/DailyForecastList";
import { WeatherRecommendationsPanel } from "./components/WeatherRecommendationsPanel";

const PRESET_CITIES: CitySearchResult[] = [
  { id: 1, name: "San Francisco", latitude: 37.7749, longitude: -122.4194, timezone: "America/Los_Angeles", country: "United States", admin1: "California" },
  { id: 2, name: "London", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London", country: "United Kingdom", admin1: "England" },
  { id: 3, name: "Tokyo", latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo", country: "Japan", admin1: "Tokyo" },
  { id: 4, name: "Sydney", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney", country: "Australia", admin1: "New South Wales" },
  { id: 5, name: "Cairo", latitude: 30.0444, longitude: 31.2357, timezone: "Africa/Cairo", country: "Egypt", admin1: "Cairo" },
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<CitySearchResult[]>([]);

  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(null);
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius");

  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<WeatherRecommendations | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load search history and default city on mount
  useEffect(() => {
    const saved = localStorage.getItem("weather_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }

    const savedCity = localStorage.getItem("weather_last_city");
    if (savedCity) {
      try {
        const parsed = JSON.parse(savedCity);
        handleCitySelection(parsed);
      } catch (e) {
        handleCitySelection(PRESET_CITIES[0]);
      }
    } else {
      // Default to San Francisco
      handleCitySelection(PRESET_CITIES[0]);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (city: CitySearchResult) => {
    const filtered = recentSearches.filter((item) => item.id !== city.id);
    const updated = [city, ...filtered].slice(0, 5); // Keep up to 5 history entries
    setRecentSearches(updated);
    localStorage.setItem("weather_recent_searches", JSON.stringify(updated));
  };

  // Close search suggestion dropdown if user clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Geocoding Search lookup
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/weather/search?city=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Geocoding search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleCitySelection = async (city: CitySearchResult) => {
    setSelectedCity(city);
    setShowDropdown(false);
    setSearchQuery("");
    saveRecentSearch(city);
    localStorage.setItem("weather_last_city", JSON.stringify(city));

    // Fetch Forecast and trigger AI
    setForecastLoading(true);
    setForecastError(null);
    setRecommendations(null);
    setRecommendationsError(null);
    setIsApiKeyMissing(false);

    try {
      const response = await fetch(
        `/api/weather/forecast?latitude=${city.latitude}&longitude=${city.longitude}&timezone=${encodeURIComponent(
          city.timezone
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to load forecast metrics");
      }

      const forecastData: ForecastResponse = await response.json();

      // Adjust to Fahrenheit if needed before sending to Gemini
      let processedForecast = { ...forecastData };
      if (unit === "fahrenheit") {
        processedForecast = convertForecastToFahrenheit(forecastData);
      }
      setForecast(processedForecast);
      setForecastLoading(false);

      // Trigger Gemini Planning Recommendations in Parallel
      setRecommendationsLoading(true);
      try {
        const recRes = await fetch("/api/weather/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: `${city.name}, ${city.country}`,
            current: processedForecast.current,
            daily: processedForecast.daily,
            unit,
          }),
        });

        if (recRes.status === 403) {
          const errData = await recRes.json();
          if (errData.error === "GEMINI_API_KEY_MISSING") {
            setIsApiKeyMissing(true);
          } else {
            throw new Error(errData.message || "Forbidden");
          }
        } else if (!recRes.ok) {
          throw new Error("Unable to construct AI predictions");
        } else {
          const recData = await recRes.json();
          setRecommendations(recData);
        }
      } catch (aiErr: any) {
        console.error("Failed to load AI weather insights", aiErr);
        setRecommendationsError(aiErr.message || "AI weather insights failed to load");
      } finally {
        setRecommendationsLoading(false);
      }
    } catch (err: any) {
      console.error("Forecast fetching failed", err);
      setForecastError(err.message || "Failed to load meteorological parameters");
      setForecastLoading(false);
    }
  };

  const handleUnitToggle = () => {
    const nextUnit = unit === "celsius" ? "fahrenheit" : "celsius";
    setUnit(nextUnit);

    if (forecast) {
      let updatedForecast = { ...forecast };
      if (nextUnit === "fahrenheit") {
        updatedForecast = convertForecastToFahrenheit(forecast);
      } else {
        // Since original fetch yields Celsius by default from Open-Meteo API
        // Re-fetching handles the cleanest revert, or convert back.
        // Let's just re-fetch for absolute precision of data conversion
        if (selectedCity) {
          handleCitySelection(selectedCity);
          return;
        }
      }
      setForecast(updatedForecast);

      // Trigger new AI recommendations so temperatures match
      if (selectedCity) {
        triggerAIRecommendations(selectedCity, updatedForecast, nextUnit);
      }
    }
  };

  const triggerAIRecommendations = async (
    city: CitySearchResult,
    currentForecast: ForecastResponse,
    targetUnit: "celsius" | "fahrenheit"
  ) => {
    setRecommendationsLoading(true);
    setRecommendations(null);
    setRecommendationsError(null);
    setIsApiKeyMissing(false);

    try {
      const recRes = await fetch("/api/weather/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: `${city.name}, ${city.country}`,
          current: currentForecast.current,
          daily: currentForecast.daily,
          unit: targetUnit,
        }),
      });

      if (recRes.status === 403) {
        const errData = await recRes.json();
        if (errData.error === "GEMINI_API_KEY_MISSING") {
          setIsApiKeyMissing(true);
        } else {
          throw new Error(errData.message || "Forbidden");
        }
      } else if (!recRes.ok) {
        throw new Error("Failed to load AI recommendations");
      } else {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
    } catch (aiErr: any) {
      console.error("Failed to reload AI insights", aiErr);
      setRecommendationsError(aiErr.message || "AI weather insights failed to load");
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Convert all temperature and speed keys inside response to Fahrenheit scale
  const convertForecastToFahrenheit = (original: ForecastResponse): ForecastResponse => {
    const cToF = (c: number) => (c * 9) / 5 + 32;
    return {
      ...original,
      current: {
        ...original.current,
        temperature_2m: parseFloat(cToF(original.current.temperature_2m).toFixed(1)),
        apparent_temperature: parseFloat(cToF(original.current.apparent_temperature).toFixed(1)),
      },
      hourly: {
        ...original.hourly,
        temperature_2m: original.hourly.temperature_2m.map((t) => parseFloat(cToF(t).toFixed(1))),
        apparent_temperature: original.hourly.apparent_temperature.map((t) => parseFloat(cToF(t).toFixed(1))),
      },
      daily: {
        ...original.daily,
        temperature_2m_max: original.daily.temperature_2m_max.map((t) => parseFloat(cToF(t).toFixed(1))),
        temperature_2m_min: original.daily.temperature_2m_min.map((t) => parseFloat(cToF(t).toFixed(1))),
        apparent_temperature_max: original.daily.apparent_temperature_max.map((t) => parseFloat(cToF(t).toFixed(1))),
        apparent_temperature_min: original.daily.apparent_temperature_min.map((t) => parseFloat(cToF(t).toFixed(1))),
      },
    };
  };

  const getWindDirectionLabel = (degree: number) => {
    const index = Math.floor(((degree + 11.25) % 360) / 22.5);
    const directions = [
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
    ];
    return directions[index] || "N";
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem("weather_recent_searches");
  };

  // Resolve styles based on current atmospheric conditions
  const atmosphereCode = forecast?.current.weather_code ?? 0;
  const currentAtmosphere = getWeatherDetails(atmosphereCode);

  const getDynamicCardBg = (code: number) => {
    if ([0, 1].includes(code)) return "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/10";
    if ([2, 3].includes(code)) return "bg-gradient-to-br from-slate-400 via-slate-500 to-indigo-600 text-white shadow-xl shadow-slate-500/10";
    if ([45, 48].includes(code)) return "bg-gradient-to-br from-slate-300 via-slate-400 to-zinc-500 text-white shadow-xl shadow-zinc-400/10";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-xl shadow-sky-500/10";
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return "bg-gradient-to-br from-teal-400 via-sky-400 to-cyan-500 text-white shadow-xl shadow-cyan-500/10";
    }
    if ([95, 96, 99].includes(code)) {
      return "bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-900 text-white shadow-xl shadow-purple-900/15";
    }
    return "bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-500 text-white";
  };

  const dynamicCardBg = getDynamicCardBg(atmosphereCode);
  const tempUnitChar = unit === "fahrenheit" ? "°F" : "°C";

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Core Header Brand */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-500 text-white rounded-xl shadow-sm">
                <WeatherIcon name="Sparkles" size={16} />
              </span>
              <span className="text-[10px] tracking-widest font-bold uppercase text-sky-600 font-mono">
                Meteorological Insights
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-slate-900">
              Weather Intelligence
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {/* Fahrenheit / Celsius Switcher */}
            <button
              id="unit-toggle-btn"
              onClick={handleUnitToggle}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold tracking-tight shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <WeatherIcon name="Thermometer" className="text-slate-400" size={14} />
              Display Unit: <strong className="text-sky-600 font-mono">{tempUnitChar}</strong>
            </button>
          </div>
        </header>

        {/* Dashboard Bento Body */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Wing Controls & Local Weather Data (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dynamic Search Controller Box */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5" ref={dropdownRef}>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold font-display text-slate-900">
                  Select Location
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Search globally or tap presets to retrieve microclimates.
                </p>
              </div>

              {/* Autocomplete Search input */}
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter city name... (e.g., Paris, Sydney)"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-2xl text-sm placeholder-slate-400 transition-all focus:outline-hidden"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {searchLoading ? (
                      <div className="w-4 h-4 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                    ) : (
                      <WeatherIcon name="Search" size={15} />
                    )}
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-mono font-medium"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showDropdown && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 left-0 right-0 mt-2.5 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-50"
                    >
                      {searchResults.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelection(city)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 text-sm block">
                              {city.name}
                            </span>
                            <span className="text-slate-400 text-[10px] mt-0.5 block">
                              {city.admin1 ? `${city.admin1}, ` : ""}{city.country}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            lat: {city.latitude.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Presets Row */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Quick Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CITIES.map((city) => {
                    const isSelected = selectedCity?.name === city.name;
                    return (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelection(city)}
                        className={`text-xs py-1.5 px-3 rounded-xl font-medium border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-sky-50 border-sky-200 text-sky-600 font-semibold shadow-xs"
                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                        }`}
                      >
                        {city.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent History Checklist */}
              {recentSearches.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-dashed border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Recent History
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-[9px] font-semibold text-rose-500 hover:text-rose-700 tracking-tight font-mono uppercase"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleCitySelection(city)}
                        className="text-[11px] py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-100 flex items-center gap-1 transition-all font-mono"
                      >
                        <WeatherIcon name="MapPin" className="text-slate-400" size={10} />
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Meteorological Primary Card */}
            {forecastError ? (
              <div className="bg-rose-50/50 rounded-3xl border border-rose-100 p-6 text-center space-y-3">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-full inline-block">
                  <WeatherIcon name="AlertTriangle" size={24} />
                </div>
                <h4 className="text-sm font-bold text-rose-950 font-display">
                  Forecast Retrieval Offline
                </h4>
                <p className="text-xs text-rose-900/80 leading-relaxed max-w-xs mx-auto">
                  {forecastError}. Please check your connection or choose another coordinate.
                </p>
                <button
                  onClick={() => selectedCity && handleCitySelection(selectedCity)}
                  className="px-3.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold"
                >
                  Retry Parameters
                </button>
              </div>
            ) : forecastLoading || !forecast || !selectedCity ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100 animate-spin border-4 border-slate-200 border-t-sky-500 mb-4" />
                <span className="text-xs font-medium text-slate-400 font-mono">
                  Synthesizing weather vectors...
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Large Beautiful Atmospheric Card */}
                <div className={`rounded-3xl p-6 ${dynamicCardBg} flex flex-col justify-between relative overflow-hidden transition-all duration-300`}>
                  
                  {/* Backdrop Subtle design grids */}
                  <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
                    <WeatherIcon name={currentAtmosphere.icon} size={250} />
                  </div>

                  {/* Header metadata row */}
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200 opacity-90 font-mono">
                        Current Atmosphere
                      </span>
                      <h3 className="text-xl font-bold font-display tracking-tight flex items-center gap-1.5">
                        <WeatherIcon name="MapPin" className="text-sky-200 shrink-0" size={16} />
                        {selectedCity.name}
                      </h3>
                      <span className="text-[10px] text-white/70 block">
                        {selectedCity.admin1 ? `${selectedCity.admin1}, ` : ""}{selectedCity.country}
                      </span>
                    </div>

                    <div className="bg-white/15 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-2xl text-right shrink-0">
                      <span className="text-[9px] font-bold font-mono tracking-widest block uppercase text-white/80">
                        {forecast.timezone_abbreviation || "Local TZ"}
                      </span>
                      <span className="text-[10px] font-semibold mt-0.5 block">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Center metrics reading */}
                  <div className="my-8 flex items-baseline justify-between z-10">
                    <div className="space-y-1">
                      <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter block font-display">
                        {Math.round(forecast.current.temperature_2m)}
                        <span className="text-3xl sm:text-4xl font-light align-super">{tempUnitChar}</span>
                      </span>
                      <span className="text-xs font-medium text-white/90 bg-white/15 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm inline-block">
                        Feels like {Math.round(forecast.current.apparent_temperature)}{tempUnitChar}
                      </span>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <WeatherIcon name={currentAtmosphere.icon} className="text-white drop-shadow-md animate-bounce-slow" size={76} />
                      <span className="text-sm font-bold mt-2 font-display text-white">
                        {currentAtmosphere.label}
                      </span>
                    </div>
                  </div>

                  {/* Footer minor meters */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 z-10 text-white/95">
                    
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/75 font-mono block">
                        Relative Humidity
                      </span>
                      <p className="text-sm font-bold font-mono">
                        💧 {forecast.current.relative_humidity_2m}%
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/75 font-mono block">
                        Wind Currents
                      </span>
                      <p className="text-sm font-bold font-mono truncate">
                        🌬️ {forecast.current.wind_speed_10m} km/h
                        <span className="text-[10px] font-normal ml-1">
                          {getWindDirectionLabel(forecast.current.wind_direction_10m)}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/75 font-mono block">
                        Cloud Coverage
                      </span>
                      <p className="text-sm font-bold font-mono">
                        ☁️ {forecast.current.cloud_cover}%
                      </p>
                    </div>

                  </div>

                </div>

                {/* 24-hour Slider Slider */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <HourlyForecastSlider hourly={forecast.hourly} unit={unit} />
                </div>
              </div>
            )}

          </div>

          {/* Right Wing AI Weather Intelligence Panel & 7-Day Forecast (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* AI Recommendations Panel */}
            <WeatherRecommendationsPanel
              recommendations={recommendations}
              loading={recommendationsLoading}
              error={recommendationsError}
              isApiKeyMissing={isApiKeyMissing}
              city={selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : ""}
              currentTemp={forecast ? forecast.current.temperature_2m : 20}
              isRainy={forecast ? forecast.current.precipitation > 0 : false}
            />

            {/* 7-Day expandable forecast */}
            {forecast && !forecastLoading && (
              <DailyForecastList daily={forecast.daily} unit={unit} />
            )}

          </div>

        </main>
      </div>

      {/* Dynamic footer copyright */}
      <footer className="max-w-6xl mx-auto mt-16 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
        <p>© 2026 Weather Intelligence App. Meteorologic grids fed by Open-Meteo. Intelligent advisory formulated by Google Gemini.</p>
        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200/50">
          SYSTEM LIVE
        </span>
      </footer>
    </div>
  );
}
