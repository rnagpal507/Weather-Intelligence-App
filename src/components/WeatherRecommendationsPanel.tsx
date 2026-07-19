import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  WeatherRecommendations,
  OutfitPlanner,
  ActivityRating,
  PackingSuggestion,
  WeeklyHighlight,
  WeatherAlert,
} from "../types";
import { WeatherIcon } from "./WeatherIcon";

interface WeatherRecommendationsPanelProps {
  recommendations: WeatherRecommendations | null;
  loading: boolean;
  error: string | null;
  isApiKeyMissing: boolean;
  city: string;
  currentTemp: number;
  isRainy: boolean;
}

export function WeatherRecommendationsPanel({
  recommendations,
  loading,
  error,
  isApiKeyMissing,
  city,
  currentTemp,
  isRainy,
}: WeatherRecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"outfit" | "activities" | "packing" | "weekly">("outfit");

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-50 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            style={{ width: "100%" }}
          />
        </div>
        <div className="p-4 bg-sky-50 rounded-full text-sky-500 animate-pulse mb-4">
          <WeatherIcon name="Sparkles" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 font-display">
          Consulting Weather Intelligence...
        </h3>
        <p className="text-slate-400 text-sm mt-1 text-center max-w-sm">
          Gemini is analyzing temperature models, wind factors, and precipitation forecasts to draft custom planning strategies.
        </p>
      </div>
    );
  }

  // Generates robust default recommendations if Gemini is unavailable
  const getDefaultRecommendations = (): WeatherRecommendations => {
    const isCold = currentTemp < 12;
    const isHot = currentTemp > 28;

    const alert: WeatherAlert | null = isRainy
      ? {
          severity: "warning",
          title: "Precipitation Advisory",
          message: "Wet conditions detected. Outdoor visibility might be reduced and walkways may be slippery.",
        }
      : isHot
      ? {
          severity: "warning",
          title: "High Temperature Warning",
          message: "High thermal indices detected. Stay hydrated and limit direct exposure to peak afternoon sun.",
        }
      : null;

    const outfit: OutfitPlanner = {
      coreClothing: isHot
        ? ["Breathable shorts", "Light t-shirt", "Linen garments"]
        : isCold
        ? ["Thermal leggings", "Heavy denims", "Long-sleeve base layer"]
        : ["Casual chinos", "Comfy cotton tee", "Light shirt"],
      layers: isCold
        ? ["Thick wool sweater", "Windproof winter coat", "Insulated fleece jacket"]
        : isHot
        ? []
        : ["Light denim jacket", "Cardigan sweater"],
      footwear: isRainy
        ? ["Water-resistant boots", "Non-slip sneakers"]
        : isHot
        ? ["Breathable sandals", "Light espadrilles"]
        : ["Comfortable walking sneakers", "Loafers"],
      accessories: [
        ...(isRainy ? ["Compact umbrella", "Waterproof backpack cover"] : []),
        ...(isHot ? ["Polarized sunglasses", "Wide-brim UV hat"] : []),
        ...(isCold ? ["Knitted beanie", "Insulated gloves", "Thermal scarf"] : ["Polarized sunglasses"]),
      ],
      tip: isRainy
        ? "Focus on water-resistant outer layers and keep footwear insulated."
        : "Layering is key. Choose items you can easily remove as temperatures shift throughout the day.",
    };

    const activities: ActivityRating[] = [
      {
        name: "Outdoor Sightseeing",
        rating: isRainy ? "Poor" : isHot ? "Fair" : "Excellent",
        reason: isRainy
          ? "Rain makes sightseeing uncomfortable."
          : isHot
          ? "Mid-day heat can lead to fatigue."
          : "Mild, comfortable weather is ideal for walking tours.",
        bestTime: isHot ? "Late evening or early morning" : "Afternoon",
      },
      {
        name: "Jogging & Exercise",
        rating: isRainy ? "Fair" : isCold ? "Good" : isHot ? "Poor" : "Excellent",
        reason: isHot
          ? "Excessive heat places heavy stress on cardiovascular activity."
          : isRainy
          ? "Wet pavement increases slips; choose light indoor cardio."
          : "Fresh air and cool breezes support high stamina outdoors.",
        bestTime: "Early morning before the atmosphere heats up",
      },
      {
        name: "Cozy Café & Reading",
        rating: "Excellent",
        reason: isRainy
          ? "The perfect cozy backdrop for a warm beverage and study session."
          : "Always a solid option to relax and enjoy the local city lifestyle.",
        bestTime: "Anytime",
      },
    ];

    const packingSuggestions: PackingSuggestion[] = [
      { item: "Power bank", category: "Electronics", necessity: "Recommended" },
      { item: "Reusable insulated water bottle", category: "Personal Care", necessity: "Essential" },
      ...(isRainy ? [{ item: "Travel umbrella", category: "Travel", necessity: "Essential" as const }] : []),
      ...(isHot ? [{ item: "SPF 50+ Sunscreen", category: "Personal Care", necessity: "Essential" as const }] : []),
      ...(isCold ? [{ item: "Lip balm & moisturizer", category: "Personal Care", necessity: "Recommended" as const }] : []),
    ];

    const weeklyHighlights: WeeklyHighlight[] = [
      {
        day: "Today",
        headline: isRainy ? "Indoor exploration recommended" : "Favorable conditions for parks and strolls",
        type: isRainy ? "indoor" : "adventure",
      },
      {
        day: "Upcoming",
        headline: "Check forecast daily to align out-of-town drives with weather windows",
        type: "chill",
      },
    ];

    return {
      alert,
      outfitPlanner: outfit,
      activities,
      packingSuggestions,
      weeklyHighlights,
      funFact: isRainy
        ? "Raindrops aren't actually tear-shaped! As they fall, they collide with air resistance, causing their bottoms to flatten so they look more like tiny hamburger buns."
        : "The highest temperature ever reliably recorded on Earth was 56.7°C (134°F) in Death Valley, California, on July 10, 1913.",
    };
  };

  // Resolve whether we use standard Gemini output or local fallback
  const displayData = recommendations || getDefaultRecommendations();

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {displayData.alert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 flex items-start gap-3.5 ${
            displayData.alert.severity === "danger"
              ? "bg-rose-50/70 border-rose-100 text-rose-900"
              : displayData.alert.severity === "warning"
              ? "bg-amber-50/70 border-amber-100 text-amber-900"
              : "bg-sky-50/70 border-sky-100 text-sky-900"
          }`}
        >
          <div
            className={`p-2 rounded-xl mt-0.5 ${
              displayData.alert.severity === "danger"
                ? "bg-rose-100 text-rose-600"
                : displayData.alert.severity === "warning"
                ? "bg-amber-100 text-amber-600"
                : "bg-sky-100 text-sky-600"
            }`}
          >
            <WeatherIcon
              name={
                displayData.alert.severity === "danger"
                  ? "Skull"
                  : displayData.alert.severity === "warning"
                  ? "AlertTriangle"
                  : "Info"
              }
              size={18}
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-tight font-display">
              {displayData.alert.title}
            </h4>
            <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
              {displayData.alert.message}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Container */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-md shadow-slate-100/40 overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar bg-slate-50/35">
          <button
            onClick={() => setActiveTab("outfit")}
            className={`flex-1 min-w-[120px] py-4 px-5 text-center font-display font-bold text-xs tracking-tight border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "outfit"
                ? "border-sky-500 text-sky-600 bg-white/90 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/40"
            }`}
          >
            <WeatherIcon name="Shirt" size={14} />
            Outfit Planner
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`flex-1 min-w-[120px] py-4 px-5 text-center font-display font-bold text-xs tracking-tight border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "activities"
                ? "border-sky-500 text-sky-600 bg-white/90 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/40"
            }`}
          >
            <WeatherIcon name="Activity" size={14} />
            Activities
          </button>
          <button
            onClick={() => setActiveTab("packing")}
            className={`flex-1 min-w-[120px] py-4 px-5 text-center font-display font-bold text-xs tracking-tight border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "packing"
                ? "border-sky-500 text-sky-600 bg-white/90 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/40"
            }`}
          >
            <WeatherIcon name="Briefcase" size={14} />
            Packing List
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex-1 min-w-[120px] py-4 px-5 text-center font-display font-bold text-xs tracking-tight border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "weekly"
                ? "border-sky-500 text-sky-600 bg-white/90 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/40"
            }`}
          >
            <WeatherIcon name="CheckCircle2" size={14} />
            Highlights
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "outfit" && (
              <motion.div
                key="outfit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Core & Layers */}
                  <div className="space-y-3 p-4.5 bg-sky-50/40 hover:bg-sky-50/70 rounded-2xl border border-sky-100/50 shadow-xs transition-all duration-300">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-sky-700/80 font-mono block">
                      Clothing Layers
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {displayData.outfitPlanner.coreClothing.map((item, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 bg-white rounded-lg text-slate-700 font-bold border border-slate-100 shadow-xs"
                          >
                            👕 {item}
                          </span>
                        ))}
                      </div>
                      {displayData.outfitPlanner.layers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-dashed border-sky-200/60">
                          {displayData.outfitPlanner.layers.map((item, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 bg-sky-100/60 text-sky-800 rounded-lg font-bold border border-sky-200/40"
                            >
                              🧥 Layer: {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footwear & Accessories */}
                  <div className="space-y-3 p-4.5 bg-amber-50/40 hover:bg-amber-50/70 rounded-2xl border border-amber-100/50 shadow-xs transition-all duration-300">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700/80 font-mono block">
                      Footwear & Accessories
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {displayData.outfitPlanner.footwear.map((item, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 bg-white rounded-lg text-slate-700 font-bold border border-slate-100 shadow-xs"
                          >
                            👟 {item}
                          </span>
                        ))}
                      </div>
                      {displayData.outfitPlanner.accessories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-dashed border-amber-200/60">
                          {displayData.outfitPlanner.accessories.map((item, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 bg-amber-100/60 text-amber-800 rounded-lg font-bold border border-amber-200/40"
                            >
                              👓 {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4.5 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 rounded-2xl border border-violet-100/60 flex items-start gap-2.5 shadow-xs">
                  <div className="text-violet-500 mt-0.5 animate-pulse">
                    <WeatherIcon name="Sparkles" size={16} />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-violet-800 uppercase tracking-wider font-display block">
                      Style Tip
                    </span>
                    <p className="text-xs text-violet-950/80 leading-relaxed mt-0.5 font-medium">
                      {displayData.outfitPlanner.tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "activities" && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                {displayData.activities.map((activity, index) => {
                  const ratingColors = {
                    Excellent: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                    Good: "bg-teal-50 text-teal-700 border-teal-200/60",
                    Fair: "bg-amber-50 text-amber-700 border-amber-200/60",
                    Poor: "bg-rose-50 text-rose-700 border-rose-200/60",
                  };

                  const tileColors = {
                    Excellent: "bg-emerald-50/20 hover:bg-emerald-50/45 border-emerald-100/50 text-emerald-950",
                    Good: "bg-teal-50/20 hover:bg-teal-50/45 border-teal-100/50 text-teal-950",
                    Fair: "bg-amber-50/20 hover:bg-amber-50/45 border-amber-100/50 text-amber-950",
                    Poor: "bg-rose-50/20 hover:bg-rose-50/45 border-rose-100/50 text-rose-950",
                  };

                  const ratingTextColors = {
                    Excellent: "text-emerald-500",
                    Good: "text-teal-500",
                    Fair: "text-amber-500",
                    Poor: "text-rose-500",
                  };

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        tileColors[activity.rating] || "bg-slate-50/30 border-slate-100/70"
                      }`}
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 font-display">
                            {activity.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ratingColors[activity.rating] || "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {activity.rating}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {activity.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 md:self-center shrink-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                          Optimal:
                        </span>
                        <span className="text-xs bg-white py-1 px-2.5 rounded-lg border border-slate-100 text-slate-700 font-bold shadow-xs">
                          🕒 {activity.bestTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "packing" && (
              <motion.div
                key="packing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Essential */}
                  <div className="p-4.5 rounded-2xl bg-rose-50/30 hover:bg-rose-50/50 border border-rose-100/70 space-y-3 transition-all duration-300 shadow-xs">
                    <div className="flex items-center justify-between border-b border-rose-100/60 pb-2">
                      <span className="text-xs font-bold text-rose-800 font-display flex items-center gap-1.5">
                        🚨 Essential
                      </span>
                      <span className="text-[10px] bg-white border border-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                        Must Bring
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {displayData.packingSuggestions
                        .filter((p) => p.necessity === "Essential")
                        .map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-rose-500 font-bold">✓</span>
                            <div>
                              <p className="font-bold text-slate-800">{p.item}</p>
                              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                                {p.category}
                              </span>
                            </div>
                          </li>
                        ))}
                      {displayData.packingSuggestions.filter((p) => p.necessity === "Essential").length === 0 && (
                        <p className="text-xs text-slate-400 italic">No critical essentials required.</p>
                      )}
                    </ul>
                  </div>

                  {/* Recommended */}
                  <div className="p-4.5 rounded-2xl bg-sky-50/30 hover:bg-sky-50/50 border border-sky-100/70 space-y-3 transition-all duration-300 shadow-xs">
                    <div className="flex items-center justify-between border-b border-sky-100/60 pb-2">
                      <span className="text-xs font-bold text-sky-800 font-display flex items-center gap-1.5">
                        ⭐ Recommended
                      </span>
                      <span className="text-[10px] bg-white border border-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full">
                        More Comfort
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {displayData.packingSuggestions
                        .filter((p) => p.necessity === "Recommended")
                        .map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-sky-500 font-bold">✓</span>
                            <div>
                              <p className="font-bold text-slate-800">{p.item}</p>
                              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                                {p.category}
                              </span>
                            </div>
                          </li>
                        ))}
                      {displayData.packingSuggestions.filter((p) => p.necessity === "Recommended").length === 0 && (
                        <p className="text-xs text-slate-400 italic">No extra recommendations.</p>
                      )}
                    </ul>
                  </div>

                  {/* Optional */}
                  <div className="p-4.5 rounded-2xl bg-indigo-50/20 hover:bg-indigo-50/40 border border-indigo-100/40 space-y-3 transition-all duration-300 shadow-xs">
                    <div className="flex items-center justify-between border-b border-indigo-100/40 pb-2">
                      <span className="text-xs font-bold text-indigo-800 font-display flex items-center gap-1.5">
                        🎒 Optional
                      </span>
                      <span className="text-[10px] bg-white border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                        Extra Leisure
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {displayData.packingSuggestions
                        .filter((p) => p.necessity === "Optional" || p.necessity === undefined)
                        .map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="text-indigo-400 font-bold">✓</span>
                            <div>
                              <p className="font-bold text-slate-800">{p.item}</p>
                              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                                {p.category}
                              </span>
                            </div>
                          </li>
                        ))}
                      {displayData.packingSuggestions.filter((p) => p.necessity === "Optional").length === 0 && (
                        <p className="text-xs text-slate-400 italic">No optional suggestions.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "weekly" && (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <div className="space-y-2.5">
                  {displayData.weeklyHighlights.map((highlight, idx) => {
                    const tagStyles: Record<string, string> = {
                      adventure: "bg-emerald-50 text-emerald-700 border-emerald-100",
                      caution: "bg-rose-50 text-rose-700 border-rose-100",
                      indoor: "bg-indigo-50 text-indigo-700 border-indigo-100",
                      chill: "bg-sky-50 text-sky-700 border-sky-100",
                    };

                    const cardStyles: Record<string, string> = {
                      adventure: "bg-emerald-50/15 hover:bg-emerald-50/35 border-emerald-100/50",
                      caution: "bg-rose-50/15 hover:bg-rose-50/35 border-rose-100/50",
                      indoor: "bg-indigo-50/15 hover:bg-indigo-50/35 border-indigo-100/50",
                      chill: "bg-sky-50/15 hover:bg-sky-50/35 border-sky-100/50",
                    };

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                          cardStyles[highlight.type.toLowerCase()] ||
                          "bg-slate-50/30 hover:bg-slate-50/50 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                            {highlight.day}
                          </span>
                          <p className="text-xs font-bold text-slate-700">
                            {highlight.headline}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border shrink-0 ${
                            tagStyles[highlight.type.toLowerCase()] ||
                            "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {highlight.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fun Fact Footer card */}
        <div className="bg-slate-50/60 p-5 border-t border-slate-100 flex items-start gap-3">
          <div className="text-amber-500 mt-0.5 shrink-0">
            <WeatherIcon name="Flame" size={16} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono block">
              Weather Science Fact
            </span>
            <p className="text-xs text-slate-600/90 leading-relaxed mt-0.5 italic">
              "{displayData.funFact}"
            </p>
          </div>
        </div>
      </div>

      {/* API Key Graceful Degradation Notice (If applicable) */}
      {isApiKeyMissing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-3xl bg-amber-50/30 border border-amber-200/50 space-y-3"
        >
          <div className="flex items-center gap-2 text-amber-800">
            <WeatherIcon name="Sparkles" className="text-amber-500 animate-pulse" size={16} />
            <h5 className="font-bold text-xs font-display tracking-tight uppercase">
              Demonstration Mode (Default Rules Active)
            </h5>
          </div>
          <p className="text-xs text-amber-900/70 leading-relaxed">
            The Gemini API key is currently not configured, so we are running using smart, deterministic fallback rules based on Open-Meteo's raw temperature and precipitation data!
          </p>
          <div className="text-[11px] text-amber-800/80 bg-white/70 border border-amber-200/30 rounded-xl p-3 leading-relaxed font-mono">
            <strong>To activate fully personalized AI intelligence:</strong> Open the <strong className="text-sky-600">Settings &gt; Secrets</strong> panel in the upper-right corner of the AI Studio UI and add a <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-900">GEMINI_API_KEY</code>.
          </div>
        </motion.div>
      )}
    </div>
  );
}
