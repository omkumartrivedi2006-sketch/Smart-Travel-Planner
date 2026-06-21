import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Cloud, Droplets, Wind, Eye, Sparkles, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

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
  forecast: { day: string; high: number; low: number; condition: string; rain: string; icon?: string }[];
  bestTime: string;
  bestSeason: string;
  tempRange: string;
  rainfall: string;
  packingEssentials: string[];
  packingOptional: string[];
}

const getDayName = (dateStr: string) => {
  if (!dateStr) return "Today";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayIndex = new Date(dateStr).getDay();
  return isNaN(dayIndex) ? "Today" : days[dayIndex];
};

const getWeatherIcon = (cond: string) => {
  const c = cond.toLowerCase();
  if (c.includes("sun") || c.includes("clear")) return "☀️";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "🌧️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("wind") || c.includes("breeze")) return "💨";
  return "⛅";
};

export default function WeatherForecast() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("Goa");
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [travelDate, setTravelDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Parse URL search parameters on mount or fetch default Goa weather
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destParam = params.get("destination");
    if (destParam) {
      setSearchQuery(destParam);
      handleSearchWeather(destParam);
    } else {
      handleSearchWeather("Goa");
    }
  }, []);

  const handleSearchWeather = async (queryStr?: string) => {
    const target = (queryStr || searchQuery).trim();
    if (!target) {
      toast.error("Please enter a city or destination");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/weather/${encodeURIComponent(target)}`);
        if (res && res.data && res.data.weather) {
          const weather = res.data.weather;
          const mapped: WeatherData = {
            city: res.data.destination,
            country: res.data.country,
            temp: Math.round(weather.temperature),
            condition: weather.condition,
            icon: weather.icon || getWeatherIcon(weather.condition),
            humidity: weather.humidity || 60,
            windSpeed: weather.windSpeed || 10,
            visibility: weather.visibility || 10,
            uvIndex: weather.uvIndex || 6,
            forecast: (weather.forecast || []).map((f: any) => ({
              day: getDayName(f.date),
              high: Math.round(f.temperature + 2),
              low: Math.round(f.temperature - 2),
              condition: f.condition,
              icon: f.icon || getWeatherIcon(f.condition),
              rain: f.condition.toLowerCase().includes("rain") ? "70%" : f.condition.toLowerCase().includes("snow") ? "50%" : "10%",
            })),
          bestTime: `The best time to visit ${res.data.destination} is during transitional months or dry seasons when temperatures are pleasant.`,
          bestSeason: weather.temperature < 15 ? "Winter Sports / Snowy Season" : "Dry / Mild Season",
          tempRange: `${Math.round(weather.temperature - 6)}-${Math.round(weather.temperature + 6)}°C`,
          rainfall: weather.condition.toLowerCase().includes("rain") ? "High" : "Low / Moderate",
          packingEssentials: [
            "Breathable cotton clothing or warm layers",
            "Sunscreen (SPF 50+) & Polarized sunglasses",
            "Comfortable city walking sneakers",
            "Hat or travel cap"
          ],
          packingOptional: [
            "Compact pocket umbrella",
            "Light rain jacket / windbreaker",
            "Travel power bank",
            "Insect repellent"
          ]
        };
        
        setCurrentWeather(mapped);
        toast.success(`Weather details updated for ${mapped.city}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search weather. Please make sure the destination exists in our records.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchWeather();
    }
  };

  const handleAddToTrip = () => {
    if (currentWeather) {
      navigate(`/planner?destination=${encodeURIComponent(currentWeather.city)}`);
    }
  };

  if (!currentWeather && !isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <p className="text-lg text-muted-foreground font-medium mb-4">No weather details loaded.</p>
        <Button onClick={() => handleSearchWeather("Goa")} className="bg-teal-600 hover:bg-teal-700 text-white">
          Load Default Location
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground mb-4">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Cloud className="w-8 h-8 text-cyan-500 animate-pulse" />
              Weather Forecast
            </h1>
          </div>
          {toggleTheme && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-muted"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-border shadow-lg p-6 bg-card text-card-foreground">
              <h3 className="font-bold text-card-foreground mb-6 border-b border-border pb-3">Search Location</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Destination</label>
                  <Input
                    placeholder="Enter city or destination"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="bg-background text-foreground border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-2">Travel Dates</label>
                  <Input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="bg-background text-foreground border-border"
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

              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="font-bold text-card-foreground mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-muted justify-start"
                    onClick={handleAddToTrip}
                    disabled={!currentWeather}
                  >
                    Add to Trip
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-muted justify-start"
                    onClick={() => {
                      if (currentWeather) {
                        navigate(`/chat-assistant?topic=packing%20tips%20for%20${encodeURIComponent(currentWeather.city)}`);
                      }
                    }}
                    disabled={!currentWeather}
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
              <Card className="border border-border shadow-lg p-16 flex flex-col items-center justify-center bg-card text-card-foreground">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Fetching real-time weather forecasts...</p>
              </Card>
            ) : currentWeather ? (
              <div className="space-y-8 animate-fadeIn">
                {/* Current Weather */}
                <Card className="border border-cyan-100 dark:border-cyan-900/40 shadow-lg p-8 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/40 dark:to-blue-950/40">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-6">
                    <div>
                      <h2 className="text-4xl font-bold text-foreground mb-2">{currentWeather.city}, {currentWeather.country}</h2>
                      <p className="text-muted-foreground font-medium">Current Weather Forecast</p>
                    </div>
                    <div className="text-left sm:text-right flex items-center gap-4">
                      {currentWeather.icon.startsWith("http") ? (
                        <img src={currentWeather.icon} alt={currentWeather.condition} className="w-16 h-16 object-contain" />
                      ) : (
                        <span className="text-5xl">{currentWeather.icon}</span>
                      )}
                      <div>
                        <p className="text-5xl sm:text-6xl font-bold text-foreground">{currentWeather.temp}°C</p>
                        <p className="text-muted-foreground font-semibold">{currentWeather.condition}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-muted-foreground font-medium">Humidity</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{currentWeather.humidity}%</p>
                    </div>
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Wind className="w-5 h-5 text-cyan-500" />
                        <p className="text-sm text-muted-foreground font-medium">Wind Speed</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{currentWeather.windSpeed} km/h</p>
                    </div>
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-purple-500" />
                        <p className="text-sm text-muted-foreground font-medium">Visibility</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{currentWeather.visibility} km</p>
                    </div>
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        <p className="text-sm text-muted-foreground font-medium">UV Index</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{currentWeather.uvIndex}/10</p>
                    </div>
                  </div>
                </Card>

                {/* 7-Day Forecast */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">7-Day Forecast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentWeather.forecast.map((day) => (
                      <Card key={day.day} className="border border-border shadow-md p-6 text-center bg-card text-card-foreground flex flex-col justify-between">
                        <p className="font-bold text-foreground mb-3">{day.day}</p>
                        <div className="h-10 flex items-center justify-center mb-4">
                          {day.icon && day.icon.startsWith("http") ? (
                            <img src={day.icon} alt={day.condition} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="text-3xl">{day.icon || "⛅"}</span>
                          )}
                        </div>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">{day.high}°C</span> / {day.low}°C
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">Rain: {day.rain}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold bg-muted py-1 rounded">{day.condition}</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Best Time to Visit */}
                <Card className="border border-green-100 dark:border-green-900/20 shadow-lg p-8 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Best Time to Visit</h3>
                  <p className="text-foreground/90 mb-6 leading-relaxed">
                    {currentWeather.bestTime}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Best Season</p>
                      <p className="font-bold text-foreground">{currentWeather.bestSeason}</p>
                    </div>
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Temperature Range</p>
                      <p className="font-bold text-foreground">{currentWeather.tempRange}</p>
                    </div>
                    <div className="bg-card text-card-foreground p-4 rounded-lg shadow-sm border border-border">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Rainfall Level</p>
                      <p className="font-bold text-foreground">{currentWeather.rainfall}</p>
                    </div>
                  </div>
                </Card>

                {/* Packing Recommendations */}
                <Card className="border border-border shadow-lg p-8 bg-card text-card-foreground">
                  <h3 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">Packing Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-primary mb-4">✓ Essentials Pack</h4>
                      <ul className="space-y-3 text-foreground/90">
                        {currentWeather.packingEssentials.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <span className="text-primary font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-4">• Optional / Useful Pack</h4>
                      <ul className="space-y-3 text-foreground/90">
                        {currentWeather.packingOptional.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start">
                            <span className="text-muted-foreground font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="border border-border shadow-lg p-16 flex flex-col items-center justify-center bg-card text-card-foreground text-muted-foreground">
                No weather forecast data found. Try searching for a registered destination (e.g. Goa, Kashmir, Paris).
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
