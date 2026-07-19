export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  country: string;
  country_code?: string;
  admin1?: string;
}

export interface WeatherCodeDetails {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const WEATHER_CODES: Record<number, WeatherCodeDetails> = {
  0: { label: "Clear sky", icon: "Sun", color: "text-amber-500", bgColor: "bg-amber-50" },
  1: { label: "Mainly clear", icon: "SunDim", color: "text-amber-400", bgColor: "bg-amber-50" },
  2: { label: "Partly cloudy", icon: "CloudSun", color: "text-sky-500", bgColor: "bg-sky-50" },
  3: { label: "Overcast", icon: "Cloud", color: "text-slate-500", bgColor: "bg-slate-50" },
  45: { label: "Foggy", icon: "CloudFog", color: "text-slate-400", bgColor: "bg-slate-50" },
  48: { label: "Depositing rime fog", icon: "CloudFog", color: "text-slate-400", bgColor: "bg-slate-50" },
  51: { label: "Light drizzle", icon: "CloudDrizzle", color: "text-blue-400", bgColor: "bg-blue-50" },
  53: { label: "Moderate drizzle", icon: "CloudDrizzle", color: "text-blue-500", bgColor: "bg-blue-50" },
  55: { label: "Dense drizzle", icon: "CloudDrizzle", color: "text-blue-600", bgColor: "bg-blue-50" },
  56: { label: "Light freezing drizzle", icon: "CloudSnow", color: "text-teal-400", bgColor: "bg-teal-50" },
  57: { label: "Dense freezing drizzle", icon: "CloudSnow", color: "text-teal-500", bgColor: "bg-teal-50" },
  61: { label: "Slight rain", icon: "CloudRain", color: "text-blue-400", bgColor: "bg-blue-50" },
  63: { label: "Moderate rain", icon: "CloudRain", color: "text-blue-500", bgColor: "bg-blue-50" },
  65: { label: "Heavy rain", icon: "CloudRain", color: "text-blue-700", bgColor: "bg-blue-50" },
  66: { label: "Light freezing rain", icon: "CloudSnow", color: "text-teal-400", bgColor: "bg-teal-50" },
  67: { label: "Heavy freezing rain", icon: "CloudSnow", color: "text-teal-600", bgColor: "bg-teal-50" },
  71: { label: "Slight snow fall", icon: "Snowflake", color: "text-sky-300", bgColor: "bg-sky-50" },
  73: { label: "Moderate snow fall", icon: "Snowflake", color: "text-sky-400", bgColor: "bg-sky-50" },
  75: { label: "Heavy snow fall", icon: "Snowflake", color: "text-sky-600", bgColor: "bg-sky-50" },
  77: { label: "Snow grains", icon: "Snowflake", color: "text-sky-500", bgColor: "bg-sky-50" },
  80: { label: "Slight rain showers", icon: "CloudRain", color: "text-blue-400", bgColor: "bg-blue-50" },
  81: { label: "Moderate rain showers", icon: "CloudRain", color: "text-blue-500", bgColor: "bg-blue-50" },
  82: { label: "Violent rain showers", icon: "CloudRain", color: "text-blue-800", bgColor: "bg-blue-50" },
  85: { label: "Slight snow showers", icon: "CloudSnow", color: "text-teal-300", bgColor: "bg-teal-50" },
  86: { label: "Heavy snow showers", icon: "CloudSnow", color: "text-teal-500", bgColor: "bg-teal-50" },
  95: { label: "Thunderstorm", icon: "CloudLightning", color: "text-purple-600", bgColor: "bg-purple-50" },
  96: { label: "Thunderstorm with slight hail", icon: "CloudLightning", color: "text-purple-700", bgColor: "bg-purple-50" },
  99: { label: "Thunderstorm with heavy hail", icon: "CloudLightning", color: "text-purple-900", bgColor: "bg-purple-50" },
};

export function getWeatherDetails(code: number): WeatherCodeDetails {
  return WEATHER_CODES[code] || { label: "Unknown conditions", icon: "Cloud", color: "text-slate-500", bgColor: "bg-slate-50" };
}

export interface CurrentWeather {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  uv_index: number[];
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: Record<string, string>;
  current: CurrentWeather;
  hourly_units: Record<string, string>;
  hourly: HourlyForecast;
  daily_units: Record<string, string>;
  daily: DailyForecast;
}

export interface OutfitPlanner {
  coreClothing: string[];
  layers: string[];
  footwear: string[];
  accessories: string[];
  tip: string;
}

export interface ActivityRating {
  name: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  reason: string;
  bestTime: string;
}

export interface PackingSuggestion {
  item: string;
  category: string;
  necessity: "Essential" | "Recommended" | "Optional";
}

export interface WeeklyHighlight {
  day: string;
  headline: string;
  type: string;
}

export interface WeatherAlert {
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
}

export interface WeatherRecommendations {
  alert: WeatherAlert | null;
  outfitPlanner: OutfitPlanner;
  activities: ActivityRating[];
  packingSuggestions: PackingSuggestion[];
  weeklyHighlights: WeeklyHighlight[];
  funFact: string;
}
