import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Star, MapPin, TrendingUp, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { DestinationImage } from "@/components/DestinationImage";
import { DestinationCard } from "@/components/DestinationCard";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

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
  const [budget, setBudget] = useState(7500);
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
      // Map budget style thresholds (in INR)
      const cost = item.averageCost;
      let destStyle = "Budget";
      if (cost > 5000 && cost <= 10000) {
        destStyle = "Comfort";
      } else if (cost > 10000) {
        destStyle = "Luxury";
      }

      if (destStyle.toLowerCase() === style.toLowerCase()) {
        score += 15;
      } else {
        score -= 10;
      }

      // Compare daily budget limit from slider (in INR) to daily cost of destination (in INR)
      const dailyLimit = currentBudget / (duration || 7);
      if (dailyLimit >= cost) {
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
                    max={25000}
                    step={250}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>₹500</span>
                    <span>₹25,000</span>
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
                  <DestinationCard
                    key={rec._id}
                    dest={rec}
                    variant="ai"
                  />
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
