import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. Geocoding Search Proxy
app.get("/api/weather/search", async (req, res) => {
  try {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: "City query parameter is required" });
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=10&language=en&format=json`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from geocoding API" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Geocoding proxy error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 2. Weather Forecast Proxy
app.get("/api/weather/forecast", async (req, res) => {
  try {
    const lat = req.query.latitude as string;
    const lon = req.query.longitude as string;
    const timezone = (req.query.timezone as string) || "auto";

    if (!lat || !lon) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=${encodeURIComponent(
      timezone
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from weather API" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Forecast proxy error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3. AI Planning Recommendations
app.post("/api/weather/recommendations", async (req, res) => {
  try {
    const { city, current, daily, unit } = req.body;
    if (!city || !current || !daily) {
      return res.status(400).json({ error: "Missing required fields in request body" });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (apiError: any) {
      // Return a graceful error so the UI can prompt for setup instead of crashing
      return res.status(403).json({
        error: "GEMINI_API_KEY_MISSING",
        message: "Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel."
      });
    }

    const tempUnit = unit === "fahrenheit" ? "°F" : "°C";

    // Build a compact, informative prompt containing relevant weather data
    const weatherSummary = `
City: ${city}
Current Weather:
- Temperature: ${current.temperature_2m}${tempUnit}
- Feels Like: ${current.apparent_temperature}${tempUnit}
- Humidity: ${current.relative_humidity_2m}%
- Wind Speed: ${current.wind_speed_10m} km/h
- Weather Code: ${current.weather_code} (WMO standard)

7-Day Forecast Max/Min Temperatures:
${daily.time.map((time: string, idx: number) => {
  return `- ${time}: Max ${daily.temperature_2m_max[idx]}${tempUnit}, Min ${daily.temperature_2m_min[idx]}${tempUnit}, Weather Code: ${daily.weather_code[idx]}`;
}).join("\n")}
`;

    const systemInstruction = `You are an expert Weather Intelligence Assistant. Analyze the provided weather data for the city and compile highly customized, creative, and strictly practical planning recommendations. Return response strictly in JSON format matching the schema provided.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Based on this weather data:\n${weatherSummary}\n\nGenerate customized outfit suggestions, outdoor activity feasibility ratings, packing recommendations, planning tips, dynamic alerts (if any), and a weather-related or location-specific fun fact.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alert: {
              type: Type.OBJECT,
              description: "Highlight crucial advice or weather alerts. Set to null if there are no major weather events (heavy rain, extreme heat/cold, storms).",
              properties: {
                severity: {
                  type: Type.STRING,
                  description: "Level of advisory: 'info', 'warning', or 'danger'."
                },
                title: { type: Type.STRING, description: "Short title of alert" },
                message: { type: Type.STRING, description: "Helpful advice or details" }
              },
              required: ["severity", "title", "message"]
            },
            outfitPlanner: {
              type: Type.OBJECT,
              description: "Daily clothing guide based on the current temperature and conditions.",
              properties: {
                coreClothing: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Essential base layer/clothing (e.g. t-shirt, shorts, jeans)"
                },
                layers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Jackets, sweaters, or outer wear needed"
                },
                footwear: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Recommended shoes (e.g. waterproof boots, sandals, sneakers)"
                },
                accessories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Items like sunglasses, umbrella, sunscreen, beanie, gloves"
                },
                tip: {
                  type: Type.STRING,
                  description: "A friendly clothing planning tip"
                }
              },
              required: ["coreClothing", "layers", "footwear", "accessories", "tip"]
            },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of activity (e.g., Running, Sightseeing, Swimming, Cozy Indoor Museum)" },
                  rating: { type: Type.STRING, description: "Feasibility rating: 'Excellent', 'Good', 'Fair', or 'Poor'" },
                  reason: { type: Type.STRING, description: "Detailed reason based on wind, temp, and precipitation" },
                  bestTime: { type: Type.STRING, description: "Best time of day to do this (e.g., Early morning, afternoon, stay indoors)" }
                },
                required: ["name", "rating", "reason", "bestTime"]
              },
              description: "Assessments for popular outdoor or indoor activities."
            },
            packingSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  category: { type: Type.STRING, description: "e.g. Travel, Personal Care, Electronics, Clothing" },
                  necessity: { type: Type.STRING, description: "'Essential', 'Recommended', or 'Optional'" }
                },
                required: ["item", "category", "necessity"]
              },
              description: "Suggested items to pack or bring for a day out or weekend trip here."
            },
            weeklyHighlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "The day name or date (e.g., Mon, Tue)" },
                  headline: { type: Type.STRING, description: "Short planning tip (e.g., 'Perfect day for hikes', 'Rainy afternoon - plan museum')" },
                  type: { type: Type.STRING, description: "Vibe / tag (e.g., 'adventure', 'indoor', 'chill', 'caution')" }
                },
                required: ["day", "headline", "type"]
              },
              description: "A summary planning checklist matching key forecast days."
            },
            funFact: {
              type: Type.STRING,
              description: "An engaging, scientific, historical, or fun weather fact about this type of condition or city."
            }
          },
          required: [
            "outfitPlanner",
            "activities",
            "packingSuggestions",
            "weeklyHighlights",
            "funFact"
          ]
        }
      }
    });

    const recommendationText = response.text || "{}";
    const recommendationData = JSON.parse(recommendationText);
    return res.json(recommendationData);
  } catch (error: any) {
    console.error("Gemini recommendation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
});

// Vite Integration Middleware / Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
