import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Star, MapPin, Heart, Compass, Sun, Moon, Utensils, Hotel, Map, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { DestinationImage } from "@/components/DestinationImage";
import { MapView } from "@/components/Map";
import { useLocationData } from "@/contexts/LocationContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";
import { resolveDestinationImages } from "@/services/pexelsService";

interface Destination {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  continent: string;
  category: "Beach" | "Mountain" | "City" | "Heritage" | "Nature" | "Adventure";
  shortDescription: string;
  fullDescription: string;
  bestTimeToVisit: string;
  averageBudget: number; // in ₹
  durationRecommendation: string;
  weatherInformation: string;
  famousFor: string;
  topAttractions: string[];
  activities: string[];
  localCuisine: string[];
  transportationOptions: string[];
  nearestAirport: string;
  nearestRailwayStation: string;
  languagesSpoken: string[];
  currency: string;
  safetyInformation: string;
  travelTips: string;
  latitude: number;
  longitude: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  weather: { day: string; temp: string; icon: string }[];
}

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
  const id = params.id || params.slug;
  const { theme, toggleTheme } = useTheme();
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Attraction");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { location: userLoc } = useLocationData();
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    cost: string;
    mode: string;
  } | null>(null);

  useEffect(() => {
    if (!userLoc || !destination) return;

    const currentLoc = userLoc;
    const currentDest = destination;

    async function fetchRoute() {
      try {
        const lat1 = currentLoc.latitude;
        const lon1 = currentLoc.longitude;
        const lat2 = currentDest.latitude;
        const lon2 = currentDest.longitude;

        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = 6371 * c;

        let transMode = "car";
        if (dist > 800) {
          transMode = "flight";
        } else if (dist > 300) {
          transMode = "train";
        }

        const res = await apiFetch("/api/routes/calculate", {
          method: "POST",
          body: JSON.stringify({
            originLatitude: currentLoc.latitude,
            originLongitude: currentLoc.longitude,
            destinationId: currentDest.id,
            modeOfTransport: transMode,
          }),
        });

        if (res && res.data) {
          const d = res.data;
          setRouteCoords(d.routeCoordinates || []);
          
          let durationText = "";
          if (d.durationHours >= 1) {
            const hrs = Math.floor(d.durationHours);
            const mins = Math.round((d.durationHours - hrs) * 60);
            durationText = `${hrs}h ${mins}m`;
          } else {
            durationText = `${Math.round(d.durationHours * 60)}m`;
          }

          setRouteInfo({
            distance: `${d.distanceKm.toFixed(0)} km`,
            duration: durationText,
            cost: `₹${Math.round(d.estimatedCost).toLocaleString()}`,
            mode: transMode === "car" ? "Driving" : transMode === "train" ? "Train" : "Flight",
          });
        }
      } catch (err) {
        console.error("Failed to calculate route to destination:", err);
      }
    }

    fetchRoute();
  }, [userLoc, destination]);

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

        // Dynamic Pexels API image resolution for details page gallery
        let finalImages = d.images || [];
        let finalHero = d.image || "";

        const hasDbImages = finalImages && finalImages.length >= 3 && !finalImages[0].startsWith("data:image/svg+xml");

        if (!hasDbImages) {
          try {
            const result = await resolveDestinationImages(d._id, d.name, d.country, d.category, d.image, d.images);
            if (result.image) {
              finalHero = result.image;
              finalImages = result.images;
            }
          } catch (pexelsErr) {
            console.error("Failed to resolve gallery images from Pexels:", pexelsErr);
          }
        }

        // 2. Fetch Weather details (live cache)
        let weatherList: { day: string; temp: string; icon: string }[] = [];
        try {
          const weatherRes = await apiFetch(`/api/weather/${encodeURIComponent(d.name)}`);
          if (weatherRes && weatherRes.data && weatherRes.data.weather && weatherRes.data.weather.forecast) {
            weatherList = weatherRes.data.weather.forecast.map((f: any) => ({
              day: getDayName(f.date),
              temp: `${Math.round(f.temperature)}°`,
              icon: f.icon || getWeatherIcon(f.condition),
            }));
          }
        } catch (weatherErr) {
          console.error("Failed to load weather forecast", weatherErr);
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

        // 3. Fetch Real-time Places/Attractions from Geoapify
        try {
          const placesRes = await apiFetch(`/api/places/${encodeURIComponent(d.name)}`);
          if (placesRes && placesRes.data && placesRes.data.places) {
            setPlaces(placesRes.data.places);
          }
        } catch (placeErr) {
          console.error("Failed to load local places", placeErr);
        }

        // Map to UI model using all 28 fields
        const mappedDest: Destination = {
          id: d._id,
          name: d.name,
          city: d.city || d.name,
          state: d.state || d.country,
          country: d.country,
          continent: d.continent || "Asia",
          category: d.category,
          shortDescription: d.shortDescription || d.description || "",
          fullDescription: d.fullDescription || d.about || `Experience the best of ${d.name} in ${d.country}. Known as a top destination for ${d.category.toLowerCase()} travelers, offering outstanding activities and memorable sightseeing.`,
          bestTimeToVisit: d.bestTimeToVisit || "October - March",
          averageBudget: d.averageBudget || d.averageCost || 3000,
          durationRecommendation: d.durationRecommendation || "3-5 Days",
          weatherInformation: d.weatherInformation || "Lush climate.",
          famousFor: d.famousFor || `Renowned for its ${d.category.toLowerCase()} tourism.`,
          topAttractions: d.topAttractions || d.popularPlaces || [],
          activities: d.activities || [],
          localCuisine: d.localCuisine || [],
          transportationOptions: d.transportationOptions || ["Taxi", "Local Bus"],
          nearestAirport: d.nearestAirport || "Nearest Regional Airport",
          nearestRailwayStation: d.nearestRailwayStation || "Nearest Railway Station",
          languagesSpoken: d.languagesSpoken || ["English"],
          currency: d.currency || "Local Currency",
          safetyInformation: d.safetyInformation || "Stay safe and follow local guidelines.",
          travelTips: d.travelTips || "Carry local currency and maps.",
          latitude: d.latitude,
          longitude: d.longitude,
          images: finalImages && finalImages.length > 0 ? finalImages : [finalHero || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"],
          rating: d.rating || 4.5,
          reviewsCount: Math.floor(Math.random() * 1500) + 200,
          weather: weatherList,
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <p className="text-lg text-muted-foreground font-medium animate-pulse">Loading destination details...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Destination not found.</h1>
        <Button onClick={() => navigate("/destinations")} className="bg-teal-600 hover:bg-teal-700 text-white mt-4">
          Return to Browse.
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
    navigate(`/planner?destination=${encodeURIComponent(destination.name)}`);
  };

  // Compute budget category text for highlights
  const getBudgetCategoryText = (cost: number) => {
    if (cost <= 5000) return "Budget (₹0-5k)";
    if (cost <= 10000) return "Mid-range (₹5k-10k)";
    return "Premium (₹10k-25k)";
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/destinations")} className="text-muted-foreground mb-2 flex items-center gap-1">
              ← Back to Destinations
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Destination Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <LocationNavbarButton />
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Gallery Section */}
            <Card className="border border-border shadow-lg overflow-hidden mb-8 bg-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
                <div className="md:col-span-2 h-[350px] md:h-[400px]">
                  <DestinationImage
                    src={destination.images[0]}
                    alt={destination.name}
                    name={destination.name}
                    category={destination.category}
                    id={destination.id}
                    country={destination.country}
                    preload={true}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className={`grid gap-2 h-auto md:h-[400px] ${
                  destination.images.slice(1, 5).length > 2
                    ? "grid-cols-2"
                    : "grid-cols-2 md:grid-cols-1"
                }`}>
                  {(destination.images.slice(1, 5).length > 0 ? destination.images.slice(1, 5) : [
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                    "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a"
                  ].slice(0, 2)).map((imgUrl, idx) => (
                    <DestinationImage
                      key={idx}
                      src={imgUrl}
                      alt={`${destination.name} gallery ${idx + 1}`}
                      name={destination.name}
                      category={destination.category}
                      id={destination.id}
                      country={destination.country}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Destination Info */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-4xl font-bold text-foreground mb-2">{destination.name}</h2>
                  <p className="text-lg text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {destination.city}, {destination.state}, {destination.country}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-center sm:justify-end gap-2 mb-2">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    <span className="text-2xl font-bold">{destination.rating}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{destination.reviewsCount} reviews</p>
                </div>
              </div>

              {/* Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <Card className="border border-border bg-card text-card-foreground shadow-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="font-bold text-foreground text-sm uppercase">{destination.category}</p>
                </Card>
                <Card className="border border-border bg-card text-card-foreground shadow-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Best Time</p>
                  <p className="font-bold text-foreground text-sm">{destination.bestTimeToVisit}</p>
                </Card>
                <Card className="border border-border bg-card text-card-foreground shadow-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="font-bold text-foreground text-sm">{destination.durationRecommendation}</p>
                </Card>
                <Card className="border border-border bg-card text-card-foreground shadow-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg. Budget</p>
                  <p className="font-bold text-foreground text-sm">₹{destination.averageBudget.toLocaleString()}</p>
                </Card>
                <Card className="border border-border bg-card text-card-foreground shadow-md p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Tier</p>
                  <p className="font-bold text-foreground text-sm leading-tight">{getBudgetCategoryText(destination.averageBudget)}</p>
                </Card>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">About</h3>
              <p className="text-lg text-foreground/90 font-semibold leading-relaxed mb-4 border-l-4 border-teal-500 pl-4 bg-teal-500/5 py-3 rounded-r-lg">
                {destination.shortDescription}
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {destination.fullDescription}
              </p>
            </div>

            {/* Live Location Travel Calculation Card */}
            {userLoc && routeInfo && (
              <Card className="border border-teal-500/20 bg-teal-500/5 dark:bg-teal-400/5 shadow-md p-6 mb-8 rounded-xl animate-in slide-in-from-bottom duration-300">
                <h3 className="text-lg font-bold text-teal-800 dark:text-teal-400 flex items-center gap-2 mb-4">
                  <Navigation className="w-5 h-5 animate-pulse" />
                  Travel Info from {userLoc.city}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Distance</p>
                    <p className="text-lg font-bold text-foreground">{routeInfo.distance}</p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Travel Time</p>
                    <p className="text-lg font-bold text-foreground">{routeInfo.duration}</p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Cost</p>
                    <p className="text-lg font-bold text-foreground text-emerald-600 dark:text-emerald-400">{routeInfo.cost}</p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Recommended Mode</p>
                    <p className="text-lg font-bold text-foreground">{routeInfo.mode}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Local Sights Map */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Location Map</h3>
              <Card className="border border-border bg-card text-card-foreground shadow-lg overflow-hidden h-96 relative">
                <MapView
                  center={{ lat: destination.latitude, lng: destination.longitude }}
                  zoom={13}
                  markers={[
                    ...(userLoc ? [{
                      lat: userLoc.latitude,
                      lng: userLoc.longitude,
                      title: `My Location (${userLoc.city})`,
                      category: "Start",
                    }] : []),
                    {
                      lat: destination.latitude,
                      lng: destination.longitude,
                      title: destination.name,
                      category: "Destination",
                    },
                    ...places.map((p) => ({
                      lat: p.coordinates.lat,
                      lng: p.coordinates.lng,
                      title: p.name,
                      category: p.category,
                      address: p.address,
                      rating: p.rating,
                    })),
                  ]}
                  routeCoordinates={routeCoords}
                  className="w-full h-full"
                />
              </Card>
            </div>

            {/* Attractions & Activities Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Top Attractions</h3>
                <div className="space-y-3">
                  {destination.topAttractions.map((attraction, idx) => (
                    <Card key={idx} className="border border-border bg-card text-card-foreground shadow-sm p-4 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-foreground font-medium text-sm">{attraction}</span>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Activities & Experiences</h3>
                <div className="space-y-3">
                  {destination.activities.map((activity, idx) => (
                    <Card key={idx} className="border border-border bg-card text-card-foreground shadow-sm p-4 flex items-center gap-3">
                      <Compass className="w-5 h-5 text-teal-600 shrink-0" />
                      <span className="text-foreground font-medium text-sm">{activity}</span>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Food Section */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Utensils className="w-6 h-6 text-teal-600" />
                Local Cuisine & Dining
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {destination.localCuisine.map((food, idx) => (
                  <Card key={idx} className="border border-border bg-card text-card-foreground shadow-sm p-4 text-center hover:scale-[1.02] transition-transform">
                    <p className="font-bold text-foreground text-sm">{food}</p>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Must Try</span>
                  </Card>
                ))}
              </div>
            </div>

            {/* Transport Options */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">How to Reach & Get Around</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-border bg-card text-card-foreground shadow-sm p-6">
                  <h4 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
                    🛫 Key Hubs
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="bg-muted p-2 rounded-lg text-lg leading-none shrink-0">✈️</span>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Nearest Airport</p>
                        <p className="font-semibold text-foreground text-sm">{destination.nearestAirport}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-muted p-2 rounded-lg text-lg leading-none shrink-0">🚂</span>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Nearest Railway Station</p>
                        <p className="font-semibold text-foreground text-sm">{destination.nearestRailwayStation}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border border-border bg-card text-card-foreground shadow-sm p-6">
                  <h4 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
                    🚗 Getting Around
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {destination.transportationOptions.map((opt, idx) => (
                      <span key={idx} className="bg-teal-500/10 text-teal-650 dark:text-teal-400 font-semibold px-3 py-1 rounded-full text-[10px] uppercase">
                        {opt}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Local transport like taxis, auto-rickshaws, metro networks or rental cars are readily available for sightseeing and touring.
                  </p>
                </Card>
              </div>
            </div>

            {/* Weather Information & Forecast */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="md:col-span-1 border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  Climate Details
                </h3>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {destination.weatherInformation}
                </p>
              </Card>

              <Card className="md:col-span-2 border border-border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">5-Day Weather Forecast</h3>
                <div className="grid grid-cols-5 gap-2">
                  {destination.weather.map((day) => (
                    <div key={day.day} className="bg-muted/50 rounded-lg p-2.5 text-center border border-border/50">
                      <p className="text-[10px] font-bold text-foreground mb-1.5">{day.day}</p>
                      <div className="h-8 flex items-center justify-center mb-1.5">
                        {day.icon.startsWith("http") ? (
                          <img src={day.icon} alt={day.day} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-2xl leading-none">{day.icon}</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">{day.temp}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Real-time Local Sights & Places */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-foreground">Explore Local Places</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "Attraction", label: "Attractions", icon: Compass },
                    { id: "Hotel", label: "Hotels", icon: Hotel },
                    { id: "Food", label: "Food & Cafes", icon: Utensils },
                    { id: "Landmark", label: "Sights", icon: Map },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCategory === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        variant={isActive ? "default" : "outline"}
                        className={isActive ? "bg-teal-600 hover:bg-teal-700 text-white border-0" : "border-border text-foreground hover:bg-muted"}
                        onClick={() => setActiveCategory(tab.id)}
                      >
                        <Icon className="w-4 h-4 mr-2 animate-in duration-300" />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {places.length === 0 ? (
                <Card className="border border-border bg-card text-card-foreground shadow-sm p-8 text-center text-muted-foreground text-sm">
                  Searching for local places in {destination.name}... (Ensure Geoapify API key is set)
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {places
                    .filter((p) => {
                      if (activeCategory === "Food") {
                        return p.category === "Restaurant" || p.category === "Cafe";
                      }
                      return p.category === activeCategory;
                    })
                    .slice(0, 10)
                    .map((place) => (
                      <Card key={place.name} className="border border-border bg-card text-card-foreground shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-foreground text-sm leading-tight">{place.name}</h4>
                            {place.rating && (
                              <span className="text-amber-500 font-bold flex items-center gap-1 text-[10px] shrink-0 bg-amber-500/10 px-2 py-0.5 rounded">
                                ⭐ {place.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs leading-relaxed mb-4">{place.address}</p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold border-t border-border pt-3">
                          <span className="bg-teal-500/10 text-teal-650 px-2 py-0.5 rounded uppercase">
                            {place.category}
                          </span>
                          <span>
                            📍 {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  {places.filter((p) => {
                    if (activeCategory === "Food") {
                      return p.category === "Restaurant" || p.category === "Cafe";
                    }
                    return p.category === activeCategory;
                  }).length === 0 && (
                    <Card className="col-span-2 border border-border bg-card text-card-foreground shadow-sm p-8 text-center text-muted-foreground text-sm">
                      No local {activeCategory.toLowerCase()}s found in this radius.
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-border bg-card text-card-foreground shadow-lg p-6 sticky top-24">
              <div className="space-y-4">
                <Button onClick={handlePlanTrip} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg font-semibold shadow-md transition-all duration-200">
                  Plan Trip Here
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-teal-600 text-teal-600 hover:bg-teal-500/10 py-6 font-semibold"
                  onClick={() => navigate(`/route-planner?end=${encodeURIComponent(destination.name)}`)}
                >
                  View Route
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted py-6 font-semibold"
                  onClick={() => navigate(`/ai-recommendations?interests=${encodeURIComponent(destination.category)}`)}
                >
                  Get AI Recommendations
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className={`w-full py-6 flex items-center justify-center gap-2 font-semibold ${
                    isWishlisted 
                      ? "bg-red-500/10 border-red-300 text-red-500 hover:bg-red-500/20" 
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-border space-y-6">
                <div>
                  <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    🎯 Famous For
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {destination.famousFor}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-muted-foreground font-semibold">Currency</p>
                    <p className="font-semibold text-foreground">{destination.currency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Spoken Languages</p>
                    <p className="font-semibold text-foreground">{destination.languagesSpoken.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Continent</p>
                    <p className="font-semibold text-foreground">{destination.continent}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20 p-4 rounded-lg">
                    <h5 className="font-bold text-amber-600 dark:text-amber-400 text-xs mb-1">
                      ⚠️ Safety Guideline
                    </h5>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {destination.safetyInformation}
                    </p>
                  </div>

                  <div className="bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/20 p-4 rounded-lg">
                    <h5 className="font-bold text-blue-600 dark:text-blue-400 text-xs mb-1">
                      💡 Travel Tip
                    </h5>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {destination.travelTips}
                    </p>
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
