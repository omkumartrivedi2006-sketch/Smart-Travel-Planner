import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Star, MapPin, Heart, Compass } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Mock Database for Destinations
interface Destination {
  id: number;
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

const DESTINATIONS_DB: Record<number, Destination> = {
  1: {
    id: 1,
    name: "Bali, Indonesia",
    country: "Indonesia",
    category: "Beach",
    style: "Tropical",
    rating: 4.8,
    reviewsCount: 1234,
    budgetLevel: "Budget-Friendly",
    bestTime: "Apr - Oct",
    avgTemp: "28°C",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
    about: "Bali is an Indonesian island known for its forested volcanic mountains, iconic rice paddies, beaches and coral reefs. The island is home to religious sites such as cliffside Uluwatu Temple. To the south, the beachside city of Denpasar is Bali's largest town, while Seminyak is an exclusive beach resort area with international restaurants and bars.",
    aboutExtra: "Whether you're seeking relaxation on pristine beaches, adventure in rice terraces, or cultural experiences in ancient temples, Bali offers something for every traveler.",
    attractions: ["Ubud Rice Terraces", "Tanah Lot Temple", "Seminyak Beach", "Mount Batur", "Sacred Monkey Forest", "Tegallalang Rice Paddies"],
    weather: [
      { day: "Mon", temp: "28°", icon: "☀️" },
      { day: "Tue", temp: "27°", icon: "⛅" },
      { day: "Wed", temp: "26°", icon: "🌧️" },
      { day: "Thu", temp: "28°", icon: "☀️" },
      { day: "Fri", temp: "29°", icon: "☀️" },
    ],
    currency: "Indonesian Rupiah (IDR)",
    language: "Indonesian, English",
    visa: "Visa on Arrival",
  },
  2: {
    id: 2,
    name: "Swiss Alps",
    country: "Switzerland",
    category: "Adventure",
    style: "Alpine",
    rating: 4.9,
    reviewsCount: 856,
    budgetLevel: "Premium",
    bestTime: "Dec - Apr / Jun - Sep",
    avgTemp: "5°C",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
    about: "The Swiss Alps are the alpine region of Switzerland, representing a major natural feature of the country. They are famous worldwide for winter skiing, summer hiking, mountaineering, and scenic cogwheel train journeys. The high peaks of the Matterhorn and Jungfrau attract millions of nature enthusiasts and adventure seekers annually.",
    aboutExtra: "From luxury ski resorts like Zermatt and St. Moritz to tranquil valley villages, the Swiss Alps offer unparalleled pristine alpine beauty, clean air, and world-class mountain sports.",
    attractions: ["The Matterhorn", "Jungfraujoch Peak", "Zermatt Ski Resort", "Lake Geneva Valley", "Interlaken Lakes", "Rhine Falls Climb"],
    weather: [
      { day: "Mon", temp: "6°", icon: "❄️" },
      { day: "Tue", temp: "5°", icon: "⛅" },
      { day: "Wed", temp: "3°", icon: "🌧️" },
      { day: "Thu", temp: "7°", icon: "☀️" },
      { day: "Fri", temp: "8°", icon: "☀️" },
    ],
    currency: "Swiss Franc (CHF)",
    language: "German, French, Italian",
    visa: "Schengen Visa Required",
  },
  3: {
    id: 3,
    name: "Madrid, Spain",
    country: "Spain",
    category: "Cultural",
    style: "Metropolitan",
    rating: 4.7,
    reviewsCount: 2104,
    budgetLevel: "Mid-range",
    bestTime: "Sep - Nov / Mar - May",
    avgTemp: "18°C",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
    about: "Madrid, Spain's central capital, is a city of elegant boulevards and expansive, manicured parks such as the Buen Retiro. It’s renowned for its rich repositories of European art, including the Prado Museum’s works by Goya, Velázquez and other Spanish masters. The heart of old Hapsburg Madrid is the portico-lined Plaza Mayor.",
    aboutExtra: "Famed for its lively street life, culinary excellence (tapas crawls), world-famous football culture, and late-night social energy, Madrid is a vibrant crossroad of Spanish tradition and modernity.",
    attractions: ["Royal Palace of Madrid", "Prado Museum", "Retiro Park", "Plaza Mayor", "Gran Vía Boulevard", "Mercado de San Miguel"],
    weather: [
      { day: "Mon", temp: "19°", icon: "☀️" },
      { day: "Tue", temp: "18°", icon: "☀️" },
      { day: "Wed", temp: "16°", icon: "⛅" },
      { day: "Thu", temp: "18°", icon: "☀️" },
      { day: "Fri", temp: "21°", icon: "☀️" },
    ],
    currency: "Euro (EUR)",
    language: "Spanish",
    visa: "Schengen Visa Required",
  },
};

export default function DestinationDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const id = Number(params.id);
  
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const dest = DESTINATIONS_DB[id];
    if (dest) {
      setDestination(dest);
      
      // Check wishlist status from localStorage
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setIsWishlisted(wishlist.includes(dest.name));
    }
  }, [id]);

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
