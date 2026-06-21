import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function verifyApis() {
  const weatherKey = process.env.OPENWEATHER_API_KEY;
  const geoapifyKey = process.env.GEOAPIFY_API_KEY;

  console.log("=== API KEY INTEGRITY CHECK ===");
  console.log("Weather Key:", weatherKey ? "Loaded" : "Missing");
  console.log("Geoapify Key:", geoapifyKey ? "Loaded" : "Missing");

  if (!weatherKey || !geoapifyKey) {
    console.error("Missing keys. Make sure .env is updated.");
    process.exit(1);
  }

  const client = axios.create({ timeout: 5000 });

  // 1. Test Weather API
  try {
    console.log("\nTesting OpenWeather API for 'Goa'...");
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=goa&appid=${weatherKey}&units=metric`;
    const response = await client.get(url);
    console.log("✅ Weather API Success!");
    console.log("City:", response.data.city?.name);
    console.log("Country:", response.data.city?.country);
    console.log("Current Temp:", response.data.list?.[0]?.main?.temp, "°C");
  } catch (error: any) {
    console.error("❌ Weather API Failed:", error.response?.data || error.message);
  }

  // 2. Test Geoapify Geocoding API
  try {
    console.log("\nTesting Geoapify Geocoding API for 'Goa'...");
    const url = `https://api.geoapify.com/v1/geocode/search?text=Goa&limit=1&apiKey=${geoapifyKey}`;
    const response = await client.get(url);
    console.log("✅ Geoapify Geocoding Success!");
    const features = response.data?.features || [];
    if (features.length > 0) {
      console.log("Resolved Name:", features[0].properties?.formatted);
      console.log("Coordinates:", features[0].geometry?.coordinates);
    } else {
      console.log("No feature resolved.");
    }
  } catch (error: any) {
    console.error("❌ Geoapify Geocoding Failed:", error.response?.data || error.message);
  }

  // 3. Test Geoapify Places API
  try {
    console.log("\nTesting Geoapify Places API (Tourism) around Goa coordinates [74.1240, 15.2993]...");
    const categories = "tourism.attraction,catering.restaurant,accommodation.hotel";
    const radius = 15000;
    const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:74.1240,15.2993,${radius}&bias=proximity:74.1240,15.2993&limit=3&apiKey=${geoapifyKey}`;
    const response = await client.get(url);
    console.log("✅ Geoapify Places Success!");
    const places = response.data?.features || [];
    console.log(`Found ${places.length} places. Examples:`);
    places.forEach((p: any, idx: number) => {
      console.log(`  ${idx + 1}. ${p.properties?.name || "Unnamed"} (${p.properties?.categories?.[0]})`);
    });
  } catch (error: any) {
    console.error("❌ Geoapify Places Failed:", error.response?.data || error.message);
  }
}

verifyApis();
