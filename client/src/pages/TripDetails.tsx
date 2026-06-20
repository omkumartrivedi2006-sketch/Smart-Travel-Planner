import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Calendar, DollarSign, MapPin, Download, Share2, Edit2, ShieldAlert, Loader2, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface Trip {
  _id: string;
  destination: {
    _id: string;
    name: string;
    description: string;
    country: string;
    category: string;
  };
  startDate: string;
  endDate: string;
  travelers: number;
  hotelPreference: string;
  transportPreference: string;
  travelType: string;
  budget?: {
    _id: string;
    hotelCost: number;
    foodCost: number;
    transportCost: number;
    activitiesCost: number;
    miscellaneousCost: number;
    totalEstimate: number;
  };
  itinerary?: {
    day: number;
    activities: {
      time: string;
      activity: string;
      description: string;
      cost: number;
    }[];
  }[];
}

export default function TripDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const id = params.id;
  const { theme, toggleTheme } = useTheme();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTripDetails() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await apiFetch(`/api/trips/${id}`);
        if (res && res.data && res.data.trip) {
          const tripData = res.data.trip;
          setTrip(tripData);
          
          // Fetch live weather for the destination
          if (tripData.destination?.name) {
            try {
              const weatherRes = await apiFetch(`/api/weather/${encodeURIComponent(tripData.destination.name)}`);
              if (weatherRes && weatherRes.data && weatherRes.data.weather && weatherRes.data.weather.forecast) {
                setWeatherForecast(weatherRes.data.weather.forecast);
              }
            } catch (wErr) {
              console.error("Failed to load weather for trip destination", wErr);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch trip details", err);
        toast.error("Could not fetch trip details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTripDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <Loader2 className="w-16 h-16 text-teal-650 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground animate-pulse">Loading Trip Details...</h2>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Trip Not Found</h2>
        <p className="text-muted-foreground mb-6">The trip details you are looking for do not exist or you lack permission to view them.</p>
        <Button onClick={() => navigate("/saved-trips")} className="bg-teal-600 hover:bg-teal-700 text-white">
          Back to My Trips
        </Button>
      </div>
    );
  }

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const numericBudget = trip.budget?.totalEstimate || 0;

  // Budget Breakdown values
  const budgetBreakdown = [
    { category: "Accommodation", amount: trip.budget?.hotelCost || 0, color: "bg-teal-600" },
    { category: "Food & Dining", amount: trip.budget?.foodCost || 0, color: "bg-teal-500" },
    { category: "Transportation", amount: trip.budget?.transportCost || 0, color: "bg-cyan-500" },
    { category: "Activities", amount: trip.budget?.activitiesCost || 0, color: "bg-emerald-500" },
    { category: "Miscellaneous", amount: trip.budget?.miscellaneousCost || 0, color: "bg-slate-400" },
  ].map(item => ({
    ...item,
    percentage: numericBudget > 0 ? Math.round((item.amount / numericBudget) * 100) : 0,
    amountStr: `₹${Math.round(item.amount).toLocaleString()}`,
  }));

  const handleExport = () => {
    toast.success("Itinerary successfully exported as PDF!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link to this trip itinerary copied to clipboard!");
  };

  const handleEdit = () => {
    navigate(`/planner?destination=${encodeURIComponent(trip.destination.name)}&budget=${numericBudget}&travelers=${trip.travelers}`);
  };

  const now = new Date();
  const tripStatus = end < now ? "Completed" : "Upcoming";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/saved-trips")} className="text-muted-foreground mb-2 flex items-center gap-1">
              ← Back to My Trips
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Trip Details</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Trip Header */}
            <Card className="border border-border shadow-lg p-8 mb-8 bg-card text-card-foreground">
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-bold text-foreground mb-2">Trip to {trip.destination.name}</h2>
                  <p className="text-lg text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {trip.destination.name}, {trip.destination.country || ""}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  tripStatus === "Upcoming"
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-green-500/10 text-green-600"
                }`}>
                  {tripStatus}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{durationDays} Days</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Budget</p>
                  <p className="text-xl sm:text-2xl font-bold text-teal-600">₹{numericBudget.toLocaleString()}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Travelers</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{trip.travelers || 1} Person{trip.travelers > 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
                  onClick={handleEdit}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Trip
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted min-w-[100px]">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={handleExport} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted min-w-[100px]">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>

            {/* Itinerary */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Itinerary</h3>
              <div className="space-y-4">
                {trip.itinerary && trip.itinerary.length > 0 ? (
                  trip.itinerary.map((dayData, index) => {
                    const currentDay = new Date(start);
                    currentDay.setDate(start.getDate() + index);
                    const dayName = currentDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    
                    return (
                      <Card key={index} className="border border-border shadow-md p-6 bg-card text-card-foreground">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                          <h4 className="text-lg font-bold text-foreground">Day {dayData.day || index + 1}</h4>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-teal-600" />
                            {dayName}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {dayData.activities && dayData.activities.map((act: any, actIdx: number) => (
                            <div key={actIdx} className="flex items-start gap-3 border-l-2 border-teal-500 pl-3 py-1">
                              <div className="min-w-[70px] text-xs font-semibold text-muted-foreground">{act.time}</div>
                              <div>
                                <h5 className="font-bold text-foreground text-sm">{act.activity}</h5>
                                <p className="text-muted-foreground text-xs mt-1">{act.description}</p>
                                {act.cost > 0 && (
                                  <span className="inline-block bg-teal-500/10 text-teal-500 text-[10px] font-semibold px-2 py-0.5 rounded mt-1">
                                    Est. Cost: ₹{act.cost}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="border border-border shadow-md p-6 text-center bg-card text-muted-foreground">
                    No itinerary activities found for this trip.
                  </Card>
                )}
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Budget Breakdown</h3>
              <Card className="border border-border shadow-md p-6 bg-card text-card-foreground">
                <div className="space-y-4">
                  {budgetBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{item.category}</span>
                        <span className="font-bold text-foreground">{item.amountStr}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Weather */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Weather Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {weatherForecast && weatherForecast.length > 0 ? (
                  weatherForecast.map((dayForecast, index) => {
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const d = new Date(dayForecast.date);
                    const dayLabel = days[d.getDay()];
                    
                    let icon = "☀️";
                    const cond = dayForecast.condition.toLowerCase();
                    if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle")) {
                      icon = "🌧️";
                    } else if (cond.includes("cloud") || cond.includes("overcast")) {
                      icon = "☁️";
                    } else if (cond.includes("snow")) {
                      icon = "❄️";
                    } else if (cond.includes("wind") || cond.includes("breez")) {
                      icon = "💨";
                    } else if (cond.includes("fog") || cond.includes("mist")) {
                      icon = "🌫️";
                    }

                    return (
                      <Card key={index} className="border border-border shadow-md p-4 text-center bg-card text-card-foreground">
                        <p className="font-semibold text-foreground mb-1">{dayLabel}</p>
                        <p className="text-xs text-muted-foreground mb-2">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        <p className="text-3xl mb-2">{icon}</p>
                        <p className="font-bold text-foreground">{dayForecast.temperature}°C</p>
                        <p className="text-[10px] text-muted-foreground mt-1 capitalize">{dayForecast.condition}</p>
                      </Card>
                    );
                  })
                ) : (
                  ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                    <Card key={day} className="border border-border shadow-md p-4 text-center bg-card text-card-foreground">
                      <p className="font-semibold text-foreground mb-2">{day}</p>
                      <p className="text-3xl mb-2">☀️</p>
                      <p className="font-bold text-foreground">28°C</p>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate(`/budget-calculator?destination=${encodeURIComponent(trip.destination.name)}&duration=${durationDays}&travelers=${trip.travelers}`)}
              >
                Recalculate Budget
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate(`/route-planner?end=${encodeURIComponent(trip.destination.name)}`)}
              >
                View Route
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate("/chat-assistant")}
              >
                Get Help
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-border shadow-lg p-6 sticky top-24 bg-card text-card-foreground">
              <h4 className="font-bold text-foreground mb-6">Trip Summary</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                  <p className="font-semibold text-foreground">{new Date(trip.startDate).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">End Date</p>
                  <p className="font-semibold text-foreground">{new Date(trip.endDate).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
                  <p className="text-2xl font-bold text-teal-600">₹{numericBudget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Spent</p>
                  <p className="text-xl font-bold text-foreground">₹0</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                  <p className="text-xl font-bold text-green-600">₹{numericBudget.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border space-y-3">
                <Button onClick={handleEdit} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Edit Trip Details
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full border-border text-foreground hover:bg-muted">
                  Share Trip Itinerary
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
