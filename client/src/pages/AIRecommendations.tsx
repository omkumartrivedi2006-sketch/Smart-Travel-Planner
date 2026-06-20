import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Star, MapPin, TrendingUp, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface RecItem {
  _id: string;
  name: string;
  country: string;
  category: string;
  description: string;
  averageCost: number;
  image?: string;
  rating: number;
}

export default function AIRecommendations() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [budget, setBudget] = useState(2500);
  const [duration, setDuration] = useState(7);
  const [travelStyle, setTravelStyle] = useState("Comfort");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [destinationsList, setDestinationsList] = useState<RecItem[]>([]);
  const [results, setResults] = useState<(RecItem & { score: number; reason: string })[]>([]);

  // Fetch real destinations and parse query parameters
  useEffect(() => {
    async function fetchDestinations() {
      try {
        setIsLoading(true);
        const res = await apiFetch("/api/destinations?limit=100");
        if (res && res.data && res.data.destinations) {
          const list = res.data.destinations;
          setDestinationsList(list);

          const queryParams = new URLSearchParams(window.location.search);
          const interestsParam = queryParams.get("interests");
          const initialInterests = interestsParam ? [interestsParam] : [];
          if (interestsParam) {
            setSelectedInterests([interestsParam]);
          }

          // Initial recommendations
          generateRecommendations(list, budget, travelStyle, initialInterests);
        }
      } catch (e) {
        console.error("Failed to load destinations", e);
        toast.error("Failed to fetch destinations from backend.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDestinations();
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const generateRecommendations = (
    pool: RecItem[],
    currentBudget: number,
    style: string,
    interests: string[]
  ) => {
    const list = pool.map((item) => {
      let score = 70; // Base score

      // 1. Budget checking
      // Map budget style thresholds
      // cost < 50 = "Budget", 50-150 = "Comfort/Mid-range", >150 = "Luxury/Premium"
      const cost = item.averageCost;
      let destStyle = "Budget";
      if (cost >= 50 && cost <= 150) {
        destStyle = "Comfort";
      } else if (cost > 150) {
        destStyle = "Luxury";
      }

      if (destStyle.toLowerCase() === style.toLowerCase()) {
        score += 15;
      } else {
        score -= 10;
      }

      // Convert daily budget limit from slider (in INR) to USD approx (divide by 80)
      const dailyLimitUsd = (currentBudget / (duration || 7)) / 80;
      if (dailyLimitUsd >= cost) {
        score += 10;
      } else {
        score -= 20; // daily limit is too low for this destination
      }

      // 2. Category interest check
      if (interests.length > 0) {
        const hasMatchingInterest = interests.some(interest => 
          item.category.toLowerCase().includes(interest.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(interest.toLowerCase()))
        );
        if (hasMatchingInterest) {
          score += 15;
        } else {
          score -= 10;
        }
      }

      // Cap score between 35 and 99
      score = Math.max(35, Math.min(99, score));

      const reason = `${item.description} It matches your ${style.toLowerCase()} style preferences, fits your budget constraints, and offers excellent ${item.category.toLowerCase()} sights.`;

      return {
        ...item,
        score,
        reason,
      };
    }).sort((a, b) => b.score - a.score);

    setResults(list);
  };

  const handleGetRecommendations = () => {
    setIsLoading(true);
    setTimeout(() => {
      generateRecommendations(destinationsList, budget, travelStyle, selectedInterests);
      setIsLoading(false);
      toast.success("AI Recommendations generated!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground mb-2 flex items-center gap-1">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
              AI Recommendations
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
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
              <h3 className="font-bold text-foreground mb-6 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Preferences
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-foreground/80">Total Budget</label>
                    <span className="text-sm font-bold text-teal-600">₹{budget}</span>
                  </div>
                  <Slider
                    value={[budget]}
                    onValueChange={(val) => setBudget(val[0])}
                    min={500}
                    max={20000}
                    step={250}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>₹500</span>
                    <span>₹20,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-3">Travel Style</label>
                  <div className="space-y-2">
                    {["Budget", "Comfort", "Luxury"].map((style) => (
                      <label key={style} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="style"
                          checked={travelStyle === style}
                          onChange={() => setTravelStyle(style)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-border"
                        />
                        <span className="text-sm text-muted-foreground">{style}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-3">Interests</label>
                  <div className="space-y-2">
                    {["Beach", "Mountain", "City", "Heritage", "Nature", "Adventure"].map((interest) => (
                      <label key={interest} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInterests.includes(interest)}
                          onChange={() => toggleInterest(interest)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-border"
                        />
                        <span className="text-sm text-muted-foreground">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGetRecommendations}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Analyzing..." : "Get Recommendations"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Recommendations list */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2].map((idx) => (
                  <Card key={idx} className="border-0 shadow-lg overflow-hidden bg-card p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-48 sm:h-[220px]">
                      <div className="bg-muted animate-pulse h-full w-full col-span-1" />
                      <div className="col-span-2 p-6 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
                          <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-16 w-full bg-muted/55 rounded animate-pulse" />
                        <div className="flex gap-3">
                          <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
                          <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : results.length === 0 ? (
              <Card className="border-0 shadow-md p-10 text-center bg-card text-muted-foreground">
                No destinations match your criteria. Try widening your budget or selecting fewer interests.
              </Card>
            ) : (
              <div className="space-y-6">
                {results.map((rec) => (
                  <Card
                    key={rec._id}
                    className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-card text-card-foreground"
                    onClick={() => navigate(`/destinations/${rec._id}`)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {/* Image */}
                      <div className="md:col-span-1 h-48 md:h-auto overflow-hidden bg-muted relative">
                        {rec.image ? (
                          <img
                            src={rec.image}
                            alt={rec.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-teal-600 bg-teal-500/10">
                            <MapPin className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1 text-foreground">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {rec.rating || 4.5}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="md:col-span-2 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4 gap-2">
                            <div>
                              <h3 className="text-2xl font-bold text-foreground mb-2">{rec.name}</h3>
                              <p className="text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-teal-600" />
                                {rec.country} • {rec.category} Category
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-1.5 mb-1 justify-end">
                                <TrendingUp className="w-5 h-5 text-orange-500" />
                                <span className="text-3xl font-bold text-orange-500">{rec.score}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground font-semibold">Match Score</p>
                            </div>
                          </div>

                          <div className="bg-muted p-4 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-foreground/80 mb-1">Why This Destination?</p>
                            <p className="text-foreground/80 text-sm leading-relaxed">{rec.reason}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/destinations/${rec._id}`);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/planner?destination=${encodeURIComponent(rec.name)}&budget=${budget}&travelers=2&destinationId=${rec._id}`);
                            }}
                          >
                            Plan Trip
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Chat Integration */}
            <Card className="border-0 shadow-lg p-8 mt-8 bg-gradient-to-br from-teal-500/10 to-muted/30">
              <h3 className="text-2xl font-bold text-foreground mb-4">Need More Help?</h3>
              <p className="text-foreground/80 mb-6">
                Chat with our AI assistant to get personalized recommendations based on your specific preferences.
              </p>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => navigate("/chat-assistant")}
              >
                Chat with AI
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
