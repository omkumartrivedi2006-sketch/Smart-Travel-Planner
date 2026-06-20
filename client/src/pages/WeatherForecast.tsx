import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Cloud, Droplets, Wind, Eye, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  forecast: { day: string; high: number; low: number; condition: string; rain: string }[];
  bestTime: string;
  bestSeason: string;
  tempRange: string;
  rainfall: string;
  packingEssentials: string[];
  packingOptional: string[];
}

const WEATHER_DB: Record<string, WeatherData> = {
  bali: {
    city: "Bali",
    country: "Indonesia",
    temp: 28,
    condition: "Partly Cloudy",
    icon: "⛅",
    humidity: 75,
    windSpeed: 12,
    visibility: 10,
    uvIndex: 8,
    forecast: [
      { day: "Monday", high: 30, low: 24, condition: "☀️ Sunny", rain: "0%" },
      { day: "Tuesday", high: 29, low: 23, condition: "⛅ Partly Cloudy", rain: "10%" },
      { day: "Wednesday", high: 27, low: 22, condition: "🌧️ Rainy", rain: "80%" },
      { day: "Thursday", high: 28, low: 23, condition: "☀️ Sunny", rain: "5%" },
      { day: "Friday", high: 29, low: 24, condition: "☀️ Sunny", rain: "0%" },
      { day: "Saturday", high: 30, low: 25, condition: "⛅ Partly Cloudy", rain: "15%" },
      { day: "Sunday", high: 28, low: 23, condition: "🌧️ Shower", rain: "60%" },
    ],
    bestTime: "Based on weather patterns, the best time to visit Bali is from April to October when the weather is dry and sunny. Avoid the rainy season from November to March.",
    bestSeason: "Dry Season (Apr-Oct)",
    tempRange: "26-30°C",
    rainfall: "Minimal / Low",
    packingEssentials: ["Light, breathable cotton clothing", "Sunscreen (SPF 50+)", "Hat and polarized sunglasses", "Comfortable beachwear"],
    packingOptional: ["Light rain jacket", "Insect repellent", "Sturdy hiking shoes for volcanoes", "Waterproof dry bag"],
  },
  switzerland: {
    city: "Swiss Alps",
    country: "Switzerland",
    temp: 6,
    condition: "Snowy",
    icon: "❄️",
    humidity: 85,
    windSpeed: 22,
    visibility: 6,
    uvIndex: 3,
    forecast: [
      { day: "Monday", high: 7, low: 2, condition: "❄️ Light Snow", rain: "40%" },
      { day: "Tuesday", high: 5, low: 0, condition: "❄️ Heavy Snow", rain: "90%" },
      { day: "Wednesday", high: 4, low: -2, condition: "❄️ Snowy", rain: "80%" },
      { day: "Thursday", high: 8, low: 1, condition: "⛅ Partly Cloudy", rain: "10%" },
      { day: "Friday", high: 9, low: 3, condition: "☀️ Sunny", rain: "0%" },
      { day: "Saturday", high: 7, low: 2, condition: "⛅ Cloudy", rain: "20%" },
      { day: "Sunday", high: 6, low: 0, condition: "❄️ Flurries", rain: "50%" },
    ],
    bestTime: "For skiing and winter sports, visit between December and March. For hiking, alpine meadows, and pleasant sightseeing, June to September is absolutely stunning.",
    bestSeason: "Dec-Apr / Jun-Sep",
    tempRange: "-5 to 15°C",
    rainfall: "Moderate (Snow)",
    packingEssentials: ["Thermal base layers", "Insulated waterproof ski jacket", "Gloves, warm beanies, and wool socks", "Sunscreen (high altitude UV)"],
    packingOptional: ["Hiking poles", "Goggles / snow sunglasses", "Moisture-wicking activewear", "Lip balm with SPF"],
  },
  spain: {
    city: "Madrid",
    country: "Spain",
    temp: 18,
    condition: "Sunny",
    icon: "☀️",
    humidity: 45,
    windSpeed: 8,
    visibility: 10,
    uvIndex: 6,
    forecast: [
      { day: "Monday", high: 20, low: 11, condition: "☀️ Sunny", rain: "0%" },
      { day: "Tuesday", high: 19, low: 10, condition: "☀️ Sunny", rain: "5%" },
      { day: "Wednesday", high: 17, low: 8, condition: "⛅ Partly Cloudy", rain: "10%" },
      { day: "Thursday", high: 18, low: 9, condition: "☀️ Sunny", rain: "0%" },
      { day: "Friday", high: 21, low: 12, condition: "☀️ Sunny", rain: "0%" },
      { day: "Saturday", high: 22, low: 13, condition: "☀️ Sunny", rain: "0%" },
      { day: "Sunday", high: 19, low: 10, condition: "🌧️ Showers", rain: "40%" },
    ],
    bestTime: "The best times to visit Madrid are in the spring (March to May) or autumn (September to November) when the weather is mild, pleasant, and perfect for walking tours.",
    bestSeason: "Spring / Autumn",
    tempRange: "10-22°C",
    rainfall: "Very Low",
    packingEssentials: ["Light jacket or trench coat", "Comfortable walking sneakers", "Stylish smart-casual outfits", "Travel sunglasses"],
    packingOptional: ["Small compact umbrella", "Crossbody anti-theft bag", "Reusable water bottle", "Cardigan for breezy nights"],
  },
  tokyo: {
    city: "Tokyo",
    country: "Japan",
    temp: 16,
    condition: "Clear",
    icon: "☀️",
    humidity: 50,
    windSpeed: 10,
    visibility: 10,
    uvIndex: 5,
    forecast: [
      { day: "Monday", high: 18, low: 11, condition: "☀️ Sunny", rain: "0%" },
      { day: "Tuesday", high: 17, low: 10, condition: "⛅ Partly Cloudy", rain: "10%" },
      { day: "Wednesday", high: 15, low: 8, condition: "🌧️ Rain", rain: "70%" },
      { day: "Thursday", high: 16, low: 9, condition: "☀️ Sunny", rain: "0%" },
      { day: "Friday", high: 18, low: 12, condition: "☀️ Sunny", rain: "0%" },
      { day: "Saturday", high: 19, low: 11, condition: "⛅ Partly Cloudy", rain: "15%" },
      { day: "Sunday", high: 17, low: 10, condition: "☀️ Sunny", rain: "0%" },
    ],
    bestTime: "Spring (March to May) for cherry blossoms, and Autumn (September to November) for colorful foliage and comfortable, crisp outdoor walking weather.",
    bestSeason: "Spring / Autumn",
    tempRange: "8-20°C",
    rainfall: "Moderate",
    packingEssentials: ["Slip-on shoes (for temple visits)", "Light layering sweaters", "Comfortable walking shoes", "Travel power bank"],
    packingOptional: ["Folding umbrella", "Hand sanitizer / wet wipes", "Coin pouch for cash transactions", "Fleece pullover"],
  },
};

export default function WeatherForecast() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("Bali");
  const [currentWeather, setCurrentWeather] = useState<WeatherData>(WEATHER_DB.bali);
  const [travelDate, setTravelDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Parse URL search parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destParam = params.get("destination");
    if (destParam) {
      setSearchQuery(destParam);
      handleSearchWeather(destParam);
    }
  }, []);

  const handleSearchWeather = (queryStr?: string) => {
    const target = (queryStr || searchQuery).trim().toLowerCase();
    if (!target) {
      toast.error("Please enter a city or destination");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Lookup in DB
      let foundData: WeatherData | undefined;

      if (target.includes("bali")) foundData = WEATHER_DB.bali;
      else if (target.includes("alps") || target.includes("swiss") || target.includes("switzerland")) foundData = WEATHER_DB.switzerland;
      else if (target.includes("madrid") || target.includes("spain")) foundData = WEATHER_DB.spain;
      else if (target.includes("tokyo") || target.includes("japan")) foundData = WEATHER_DB.tokyo;

      if (foundData) {
        setCurrentWeather(foundData);
        toast.success(`Weather details updated for ${foundData.city}!`);
      } else {
        // Mock fallback weather for general cities
        const generalMock: WeatherData = {
          city: searchQuery,
          country: "Explore",
          temp: 22,
          condition: "Partly Cloudy",
          icon: "⛅",
          humidity: 60,
          windSpeed: 15,
          visibility: 10,
          uvIndex: 5,
          forecast: [
            { day: "Monday", high: 24, low: 15, condition: "☀️ Sunny", rain: "0%" },
            { day: "Tuesday", high: 22, low: 14, condition: "⛅ Partly Cloudy", rain: "10%" },
            { day: "Wednesday", high: 21, low: 13, condition: "🌧️ Showers", rain: "40%" },
            { day: "Thursday", high: 23, low: 15, condition: "☀️ Sunny", rain: "0%" },
            { day: "Friday", high: 25, low: 16, condition: "☀️ Sunny", rain: "0%" },
            { day: "Saturday", high: 24, low: 15, condition: "⛅ Cloudy", rain: "20%" },
            { day: "Sunday", high: 22, low: 14, condition: "🌧️ Light Rain", rain: "30%" },
          ],
          bestTime: `The best time to visit ${searchQuery} is during transitional seasons for mild temperatures and pleasant outdoor walks.`,
          bestSeason: "Spring / Autumn",
          tempRange: "14-25°C",
          rainfall: "Low / Moderate",
          packingEssentials: ["Comfortable outfits", "Versatile layering items", "Sunscreen & Sunglasses", "Sturdy walking shoes"],
          packingOptional: ["Travel umbrella", "Emergency medical kit", "Camera gear", "Light cardigan"],
        };
        setCurrentWeather(generalMock);
        toast.success(`Weather details generated for ${searchQuery}!`);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchWeather();
    }
  };

  const handleAddToTrip = () => {
    navigate(`/planner?destination=${encodeURIComponent(currentWeather.city)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-8 h-8 text-cyan-500" />
            Weather Forecast
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 bg-white">
              <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Search Location</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Destination</label>
                  <Input
                    placeholder="Enter city or destination"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Travel Dates</label>
                  <Input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => handleSearchWeather()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Fetching..." : "Search Weather"}
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start"
                    onClick={handleAddToTrip}
                  >
                    Add to Trip
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start"
                    onClick={() => navigate(`/chat-assistant?topic=packing%20tips%20for%20${encodeURIComponent(currentWeather.city)}`)}
                  >
                    Get Packing Tips
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Weather Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <Card className="border-0 shadow-lg p-16 flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Fetching real-time weather forecasts...</p>
              </Card>
            ) : (
              <div className="space-y-8 animate-fadeIn">
                {/* Current Weather */}
                <Card className="border-0 shadow-lg p-8 bg-gradient-to-br from-cyan-50 to-blue-50">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-6">
                    <div>
                      <h2 className="text-4xl font-bold text-slate-900 mb-2">{currentWeather.city}, {currentWeather.country}</h2>
                      <p className="text-slate-600 font-medium">Current Weather Forecast</p>
                    </div>
                    <div className="text-left sm:text-right flex items-center gap-4">
                      <span className="text-5xl">{currentWeather.icon}</span>
                      <div>
                        <p className="text-5xl sm:text-6xl font-bold text-slate-900">{currentWeather.temp}°C</p>
                        <p className="text-slate-600 font-semibold">{currentWeather.condition}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-slate-600 font-medium">Humidity</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{currentWeather.humidity}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Wind className="w-5 h-5 text-cyan-500" />
                        <p className="text-sm text-slate-600 font-medium">Wind Speed</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{currentWeather.windSpeed} km/h</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-purple-500" />
                        <p className="text-sm text-slate-600 font-medium">Visibility</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{currentWeather.visibility} km</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <p className="text-sm text-slate-600 font-medium">UV Index</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{currentWeather.uvIndex}/10</p>
                    </div>
                  </div>
                </Card>

                {/* 7-Day Forecast */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">7-Day Forecast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentWeather.forecast.map((day) => (
                      <Card key={day.day} className="border-0 shadow-md p-6 text-center bg-white flex flex-col justify-between">
                        <p className="font-bold text-slate-800 mb-3">{day.day}</p>
                        <p className="text-4xl mb-4">{day.condition.split(" ")[0]}</p>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-slate-600">
                            <span className="font-bold text-slate-900">{day.high}°C</span> / {day.low}°C
                          </p>
                          <p className="text-xs text-slate-500 font-medium">Rain: {day.rain}</p>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold bg-slate-50 py-1 rounded">{day.condition.split(" ").slice(1).join(" ")}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Best Time to Visit */}
                <Card className="border-0 shadow-lg p-8 bg-gradient-to-br from-green-50 to-slate-50">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Best Time to Visit</h3>
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    {currentWeather.bestTime}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                      <p className="text-sm text-slate-500 mb-2 font-medium">Best Season</p>
                      <p className="font-bold text-slate-900">{currentWeather.bestSeason}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                      <p className="text-sm text-slate-500 mb-2 font-medium">Temperature Range</p>
                      <p className="font-bold text-slate-900">{currentWeather.tempRange}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                      <p className="text-sm text-slate-500 mb-2 font-medium">Rainfall Level</p>
                      <p className="font-bold text-slate-900">{currentWeather.rainfall}</p>
                    </div>
                  </div>
                </Card>

                {/* Packing Recommendations */}
                <Card className="border-0 shadow-lg p-8 bg-white">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Packing Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-teal-600 mb-4">✓ Essentials Pack</h4>
                      <ul className="space-y-3 text-slate-700">
                        {currentWeather.packingEssentials.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <span className="text-teal-600 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 mb-4">• Optional / Useful Pack</h4>
                      <ul className="space-y-3 text-slate-700">
                        {currentWeather.packingOptional.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <span className="text-slate-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
