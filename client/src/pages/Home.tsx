import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import {
  MapPin,
  Plane,
  DollarSign,
  Cloud,
  Map,
  MessageCircle,
  Search,
  Star,
  TrendingUp,
  Compass,
  User,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch, clearSession } from "@/lib/api";

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [popularDestinations, setPopularDestinations] = useState<any[]>([]);

  // Load session status and popular destinations
  useEffect(() => {
    const session = localStorage.getItem("session_user");
    if (session) {
      try {
        setSessionUser(JSON.parse(session));
      } catch (e) {
        console.error(e);
      }
    }

    async function loadPopular() {
      try {
        const res = await apiFetch("/api/destinations?limit=3&sort=-rating");
        if (res && res.data && res.data.destinations) {
          const mapped = res.data.destinations.map((d: any) => ({
            id: d._id,
            name: `${d.name}, ${d.country}`,
            image: d.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            category: d.category,
            budget: d.averageCost < 50 ? "Budget" : d.averageCost <= 150 ? "Mid-range" : "Premium",
          }));
          setPopularDestinations(mapped);
        }
      } catch (e) {
        console.error("Failed to fetch popular destinations", e);
      }
    }
    loadPopular();
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search destination");
      return;
    }
    navigate(`/destinations?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (e) {
      console.error("Logout request failed:", e);
    }
    clearSession();
    setSessionUser(null);
    toast.success("Logged out successfully");
  };

  const features = [
    {
      icon: Search,
      title: "Search Destinations",
      description: "Browse and filter destinations by category, budget, and more",
      path: "/destinations",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Plane,
      title: "Plan Trip",
      description: "Create and manage your travel itineraries",
      path: "/planner",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: DollarSign,
      title: "Budget Calculator",
      description: "Smart budgeting for accommodation, food, and activities",
      path: "/budget-calculator",
      color: "from-green-500 to-green-600",
    },
    {
      icon: TrendingUp,
      title: "AI Recommendations",
      description: "Get personalized destination suggestions powered by AI",
      path: "/ai-recommendations",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Cloud,
      title: "Weather Forecast",
      description: "Check weather and get packing recommendations",
      path: "/weather-forecast",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: Map,
      title: "Route Planner",
      description: "Plan routes with interactive maps and directions",
      path: "/route-planner",
      color: "from-red-500 to-red-600",
    },
    {
      icon: MessageCircle,
      title: "Chat Assistant",
      description: "Get real-time travel assistance from AI chatbot",
      path: "/chat-assistant",
      color: "from-indigo-500 to-indigo-600",
    },
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
              <Compass className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Smart Travel Planner</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/destinations")}
              className="text-slate-600 hover:text-teal-600"
            >
              Explore
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/saved-trips")}
              className="text-slate-600 hover:text-teal-600"
            >
              My Trips
            </Button>
            
            {sessionUser ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/profile")}
                  className="text-teal-600 hover:text-teal-700 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-teal-600" />
                  Hi, {sessionUser.name.split(" ")[0]}
                </Button>
                {sessionUser.role === "admin" && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/admin")}
                    className="text-purple-600 hover:text-purple-700 border border-purple-200"
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-slate-600 hover:text-teal-600"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Explore Confidently
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              AI-powered travel planning that adapts to your budget, interests, and style. Discover your next adventure with intelligent recommendations.
            </p>
            
            {/* Hero Search Box */}
            <div className="flex bg-white rounded-lg p-1.5 shadow-2xl mb-8 max-w-lg items-center">
              <Input
                type="text"
                placeholder="Search country or city (e.g. Bali, Spain, Switzerland)..."
                className="border-0 bg-transparent text-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none flex-1 pl-3 text-sm sm:text-base border-none shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-md flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate("/ai-recommendations")}
              >
                Get Recommendations
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/destinations")}
              >
                Browse Destinations
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-slate-900 mb-12">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white hover:-translate-y-1"
                onClick={() => navigate(feature.path)}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <h3 className="text-3xl font-bold text-slate-900">Popular Destinations</h3>
          <Button
            variant="outline"
            onClick={() => navigate("/destinations")}
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularDestinations.map((dest) => (
            <Card
              key={dest.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white"
              onClick={() => navigate(`/destinations/${dest.id}`)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800";
                  }}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-slate-900">
                  {dest.category}
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-bold text-slate-900 mb-2">{dest.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-semibold">{dest.budget}</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-orange-400 text-orange-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Plan Your Next Adventure?</h3>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Start exploring destinations, get AI recommendations, and plan your perfect trip today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-white text-teal-600 hover:bg-slate-100 font-semibold"
              onClick={() => navigate("/planner")}
            >
              Start Planning
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 hover:text-white"
              onClick={() => navigate("/chat-assistant")}
            >
              Chat with AI
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h5 className="font-bold mb-4 text-slate-200">Features</h5>
              <ul className="space-y-2 text-sm text-slate-400 font-medium">
                <li><a href="#" onClick={() => navigate("/destinations")} className="hover:text-white">Destinations</a></li>
                <li><a href="#" onClick={() => navigate("/planner")} className="hover:text-white">Trip Planner</a></li>
                <li><a href="#" onClick={() => navigate("/ai-recommendations")} className="hover:text-white">AI Recommendations</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 text-slate-200">Tools</h5>
              <ul className="space-y-2 text-sm text-slate-400 font-medium">
                <li><a href="#" onClick={() => navigate("/budget-calculator")} className="hover:text-white">Budget Calculator</a></li>
                <li><a href="#" onClick={() => navigate("/weather-forecast")} className="hover:text-white">Weather Forecast</a></li>
                <li><a href="#" onClick={() => navigate("/route-planner")} className="hover:text-white">Route Planner</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 text-slate-200">Account</h5>
              <ul className="space-y-2 text-sm text-slate-400 font-medium">
                <li><a href="#" onClick={() => navigate("/login")} className="hover:text-white">Login</a></li>
                <li><a href="#" onClick={() => navigate("/register")} className="hover:text-white">Sign Up</a></li>
                <li><a href="#" onClick={() => navigate("/profile")} className="hover:text-white">Profile</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 text-slate-200">Support</h5>
              <ul className="space-y-2 text-sm text-slate-400 font-medium">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" onClick={() => navigate("/chat-assistant")} className="hover:text-white">Chat Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500 font-semibold">
            <p>&copy; 2026 Smart Travel Planner. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
