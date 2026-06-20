import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Star, MapPin, Heart, Compass } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Destination {
  id: string;
  name: string;
  country: string;
  category: string;
  style: string;
  rating: number;
  reviewsCount: number;
  budgetLevel: string;
  bestTime: string;
  avgTemp: string;
  image: string;
  about: string;
  aboutExtra: string;
  attractions: string[];
  weather: { day: string; temp: string; icon: string }[];
  currency: string;
  language: string;
  visa: string;
}

const getCurrency = (country: string) => {
  const c = country.toLowerCase();
  if (c.includes("india")) return "Indian Rupee (INR)";
  if (c.includes("switzerland") || c.includes("swiss")) return "Swiss Franc (CHF)";
  if (c.includes("spain") || c.includes("france") || c.includes("italy") || c.includes("netherlands") || c.includes("czech")) return "Euro (EUR)";
  if (c.includes("united kingdom") || c.includes("london")) return "British Pound (GBP)";
  if (c.includes("united states") || c.includes("usa") || c.includes("new york")) return "US Dollar (USD)";
  if (c.includes("japan")) return "Japanese Yen (JPY)";
  if (c.includes("singapore")) return "Singapore Dollar (SGD)";
  if (c.includes("indonesia") || c.includes("bali")) return "Indonesian Rupiah (IDR)";
  if (c.includes("thailand")) return "Thai Baht (THB)";
  if (c.includes("vietnam")) return "Vietnamese Dong (VND)";
  if (c.includes("united arab emirates") || c.includes("dubai")) return "UAE Dirham (AED)";
  return "Local Currency";
};

const getLanguage = (country: string) => {
  const c = country.toLowerCase();
  if (c.includes("india")) return "Hindi, English, Regional";
  if (c.includes("spain")) return "Spanish";
  if (c.includes("france")) return "French";
  if (c.includes("italy")) return "Italian";
  if (c.includes("japan")) return "Japanese";
  if (c.includes("indonesia") || c.includes("bali")) return "Indonesian, Balinese, English";
  if (c.includes("united arab emirates") || c.includes("dubai")) return "Arabic, English";
  return "English, Local Language";
};

const getVisa = (country: string) => {
  const c = country.toLowerCase();
  if (c.includes("india")) return "Visa on Arrival / eVisa";
  if (c.includes("spain") || c.includes("france") || c.includes("italy") || c.includes("switzerland") || c.includes("netherlands") || c.includes("czech")) return "Schengen Visa / Visa-Free";
  return "Visa on Arrival / Visa-Free";
};

const getDayName = (dateStr: string) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(dateStr).getDay()];
};

const getWeatherIcon = (cond: string) => {
  const c = cond.toLowerCase();
  if (c.includes("sun") || c.includes("clear")) return "☀️";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "🌧️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("wind") || c.includes("breeze")) return "💨";
  return "⛅";
};

export default function DestinationDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const id = params.id; // string ObjectId
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    async function loadDetails() {
      setIsLoading(true);
      try {
        // 1. Fetch Destination details
        const destRes = await apiFetch(`/api/destinations/${id}`);
        if (!destRes || !destRes.data || !destRes.data.destination) {
          throw new Error("Destination details not found");
        }
        
        const d = destRes.data.destination;

        // 2. Fetch Weather details (live cache)
        let weatherList: { day: string; temp: string; icon: string }[] = [];
        try {
          const weatherRes = await apiFetch(`/api/weather/${encodeURIComponent(d.name)}`);
          if (weatherRes && weatherRes.data && weatherRes.data.weather && weatherRes.data.weather.forecast) {
            weatherList = weatherRes.data.weather.forecast.map((f: any) => ({
              day: getDayName(f.date),
              temp: `${Math.round(f.temperature)}°`,
              icon: getWeatherIcon(f.condition),
            }));
          }
        } catch (weatherErr) {
          console.error("Failed to load weather forecast", weatherErr);
          // generate fallback forecast if weather API call fails
          const today = new Date();
          weatherList = Array.from({ length: 5 }).map((_, i) => {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i + 1);
            return {
              day: getDayName(nextDate.toISOString().split("T")[0]),
              temp: d.category === "Mountain" ? "5°" : "28°",
              icon: d.category === "Mountain" ? "❄️" : "☀️",
            };
          });
        }

        // Map to UI model
        const mappedDest: Destination = {
          id: d._id,
          name: d.name,
          country: d.country,
          category: d.category,
          style: d.category === "Beach" ? "Coastal" : d.category === "Mountain" ? "Alpine" : "Scenic",
          rating: d.rating || 4.5,
          reviewsCount: Math.floor(Math.random() * 1500) + 200,
          budgetLevel: d.averageCost < 50 ? "Budget-Friendly" : d.averageCost <= 150 ? "Mid-range" : "Premium",
          bestTime: d.bestTimeToVisit,
          avgTemp: d.category === "Mountain" ? "6°C" : "28°C",
          image: d.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
          about: d.description,
          aboutExtra: `Experience the best of ${d.name} in ${d.country}. Known as a top destination for ${d.category.toLowerCase()} travelers, offering outstanding activities and memorable sightseeing.`,
          attractions: d.activities && d.activities.length > 0 ? d.activities : ["Sightseeing", "Local Tours"],
          weather: weatherList,
          currency: getCurrency(d.country),
          language: getLanguage(d.country),
          visa: getVisa(d.country),
        };

        setDestination(mappedDest);

        // Check wishlist status from localStorage
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setIsWishlisted(wishlist.includes(mappedDest.name));
      } catch (err: any) {
        toast.error("Failed to load destination details: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-lg text-slate-600 font-medium animate-pulse">Loading destination details...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Destination Not Found</h2>
        <p className="text-slate-600 mb-6">The destination you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate("/destinations")} className="bg-teal-600 hover:bg-teal-700 text-white">
          Back to Destinations
        </Button>
      </div>
    );
  }

  const handleWishlistToggle = () => {
    const wishlist: string[] = JSON.parse(localStorage.getItem("wishlist") || "[]");
    let updatedWishlist: string[];

    if (isWishlisted) {
      updatedWishlist = wishlist.filter(item => item !== destination.name);
      toast.success(`${destination.name} removed from wishlist`);
    } else {
      updatedWishlist = [...wishlist, destination.name];
      toast.success(`${destination.name} added to wishlist!`);
    }

    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    setIsWishlisted(!isWishlisted);
  };

  const handlePlanTrip = () => {
    // Navigate to planner with pre-selected destination name
    navigate(`/planner?destination=${encodeURIComponent(destination.name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/destinations")} className="text-slate-600 mb-4">
            ← Back to Destinations
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Destination Details</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="border-0 shadow-lg overflow-hidden mb-8">
              <img
                src={destination.image}
                alt={destination.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800";
                }}
              />
            </Card>

            {/* Destination Info */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-2">{destination.name}</h2>
                  <p className="text-lg text-slate-600 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {destination.country} • {destination.category} • {destination.style}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-center sm:justify-end gap-2 mb-2">
                    <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
                    <span className="text-2xl font-bold">{destination.rating}</span>
                  </div>
                  <p className="text-sm text-slate-600">{destination.reviewsCount} reviews</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="border-0 shadow-md p-4 text-center">
                  <p className="text-sm text-slate-600 mb-1">Budget Level</p>
                  <p className="font-bold text-slate-900">{destination.budgetLevel}</p>
                </Card>
                <Card className="border-0 shadow-md p-4 text-center">
                  <p className="text-sm text-slate-600 mb-1">Best Time</p>
                  <p className="font-bold text-slate-900">{destination.bestTime}</p>
                </Card>
                <Card className="border-0 shadow-md p-4 text-center">
                  <p className="text-sm text-slate-600 mb-1">Avg. Temp</p>
                  <p className="font-bold text-slate-900">{destination.avgTemp}</p>
                </Card>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">About</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                {destination.about}
              </p>
              <p className="text-slate-700 leading-relaxed">
                {destination.aboutExtra}
              </p>
            </div>

            {/* Attractions */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Top Attractions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destination.attractions.map((attraction) => (
                  <Card key={attraction} className="border-0 shadow-md p-4 flex items-center gap-3">
                    <Compass className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <span className="text-slate-900 font-medium">{attraction}</span>
                  </Card>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Weather Forecast</h3>
              <div className="grid grid-cols-5 gap-2">
                {destination.weather.map((day) => (
                  <Card key={day.day} className="border-0 shadow-md p-4 text-center">
                    <p className="text-sm font-semibold text-slate-900 mb-2">{day.day}</p>
                    <p className="text-2xl mb-2">{day.icon}</p>
                    <p className="font-bold text-slate-900">{day.temp}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 sticky top-24">
              <div className="space-y-4">
                <Button onClick={handlePlanTrip} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg">
                  Plan Trip Here
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-teal-600 text-teal-600 hover:bg-teal-50 py-6"
                  onClick={() => navigate(`/route-planner?end=${encodeURIComponent(destination.name)}`)}
                >
                  View Route
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-900 hover:bg-slate-50 py-6"
                  onClick={() => navigate(`/ai-recommendations?interests=${encodeURIComponent(destination.category)}`)}
                >
                  Get AI Recommendations
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className={`w-full py-6 flex items-center justify-center gap-2 ${
                    isWishlisted 
                      ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100" 
                      : "border-slate-300 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} />
                  {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Quick Info</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-600">Currency</p>
                    <p className="font-semibold text-slate-900">{destination.currency}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Language</p>
                    <p className="font-semibold text-slate-900">{destination.language}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Visa</p>
                    <p className="font-semibold text-slate-900">{destination.visa}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
