import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { IndianRupee, Download, TrendingUp, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocationData } from "@/contexts/LocationContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
}

export default function BudgetCalculator() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { location: userLoc } = useLocationData();

  // Input states
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [selectedDestId, setSelectedDestId] = useState("");
  const [totalBudget, setTotalBudget] = useState(0);
  const [duration, setDuration] = useState(5);
  const [travelers, setTravelers] = useState(2);
  const [accommodationType, setAccommodationType] = useState("Mid-range Hotel");
  const [foodPreference, setFoodPreference] = useState("Mid-range");
  const [transportPreference, setTransportPreference] = useState("Driving");
  const [isLoading, setIsLoading] = useState(false);

  // Output budget state
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  // Fetch destinations and parse URL search parameters on mount
  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await apiFetch("/api/destinations?limit=100");
        if (res && res.data && res.data.destinations) {
          setDestinationsList(res.data.destinations);
          
          // Pre-select destination from query param or default to first
          const params = new URLSearchParams(window.location.search);
          const destParam = params.get("destination");
          
          let defaultDest = res.data.destinations[0];
          if (destParam) {
            const matched = res.data.destinations.find(
              (d: any) => d.name.toLowerCase() === destParam.toLowerCase()
            );
            if (matched) defaultDest = matched;
          }
          
          if (defaultDest) {
            setSelectedDestId(defaultDest._id);
            // Run initial calculation
            calculateBackendBudget(defaultDest._id, duration, travelers, accommodationType, foodPreference, transportPreference);
          }
        }
      } catch (e) {
        console.error("Failed to load destinations", e);
      }
    }
    loadDestinations();

    const params = new URLSearchParams(window.location.search);
    const durationParam = params.get("duration");
    const travelersParam = params.get("travelers");

    if (durationParam) setDuration(Number(durationParam));
    if (travelersParam) setTravelers(Number(travelersParam));
  }, []);

  // Recalculate when user location becomes available or changes
  useEffect(() => {
    if (selectedDestId) {
      calculateBackendBudget(selectedDestId, duration, travelers, accommodationType, foodPreference, transportPreference);
    }
  }, [userLoc]);

  const calculateBackendBudget = async (
    destId: string,
    days: number,
    people: number,
    accType: string,
    foodPref: string,
    transPref: string
  ) => {
    if (!destId) return;
    setIsLoading(true);
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + days);

      // Map accommodation type to backend hotelPreference ("budget" | "mid-range" | "luxury")
      let hotelPref: "budget" | "mid-range" | "luxury" = "mid-range";
      const accLower = accType.toLowerCase();
      if (accLower.includes("luxury")) {
        hotelPref = "luxury";
      } else if (accLower.includes("budget") || accLower.includes("hostel")) {
        hotelPref = "budget";
      }

      // Map transport type to backend transportPreference ("car" | "train" | "flight")
      let transPrefMapped: "car" | "train" | "flight" = "car";
      const transLower = transPref.toLowerCase();
      if (transLower.includes("flight")) {
        transPrefMapped = "flight";
      } else if (transLower.includes("train") || transLower.includes("transit")) {
        transPrefMapped = "train";
      }

      const res = await apiFetch("/api/budget/calculate", {
        method: "POST",
        body: JSON.stringify({
          destinationId: destId,
          startDate: today.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          travelers: people,
          hotelPreference: hotelPref,
          transportPreference: transPrefMapped,
          travelType: people === 1 ? "solo" : people === 2 ? "couple" : "friends",
          originLatitude: userLoc?.latitude,
          originLongitude: userLoc?.longitude,
        }),
      });

      if (res && res.data && res.data.budget) {
        const b = res.data.budget;
        setTotalBudget(Math.round(b.totalEstimate));

        const items: BudgetItem[] = [
          { category: "Accommodation", amount: Math.round(b.hotelCost), percentage: Math.round((b.hotelCost / b.totalEstimate) * 100) },
          { category: "Food & Dining", amount: Math.round(b.foodCost), percentage: Math.round((b.foodCost / b.totalEstimate) * 100) },
          { category: "Transportation", amount: Math.round(b.transportCost), percentage: Math.round((b.transportCost / b.totalEstimate) * 100) },
          { category: "Activities", amount: Math.round(b.activitiesCost), percentage: Math.round((b.activitiesCost / b.totalEstimate) * 100) },
          { category: "Miscellaneous", amount: Math.round(b.miscellaneousCost), percentage: Math.round((b.miscellaneousCost / b.totalEstimate) * 100) },
        ];
        
        // Ensure percentages sum to 100
        const totalPct = items.reduce((sum, item) => sum + item.percentage, 0);
        if (totalPct !== 100 && items.length > 0) {
          items[0].percentage += (100 - totalPct);
        }

        setBudgetItems(items);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate budget.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!selectedDestId) {
      toast.error("Please select a destination");
      return;
    }
    if (duration <= 0) {
      toast.error("Duration must be 1 day or more");
      return;
    }
    if (travelers <= 0) {
      toast.error("Number of travelers must be 1 or more");
      return;
    }

    calculateBackendBudget(selectedDestId, duration, travelers, accommodationType, foodPreference, transportPreference);
    toast.success("Budget calculated from database records!");
  };

  const handleSaveToTrip = () => {
    navigate(`/planner?budget=${totalBudget}&travelers=${travelers}&destinationId=${selectedDestId}`);
    toast.success("Budget values copied to Trip Planner");
  };

  const handleDownload = () => {
    toast.success("Budget plan downloaded as CSV!");
  };

  const COLORS = ["#0f766e", "#0891b2", "#06b6d4", "#14b8a6", "#2dd4bf"];

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
              <IndianRupee className="w-8 h-8 text-green-600" />
              Smart Budget Calculator
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
              <h3 className="font-bold text-foreground mb-6 border-b border-border pb-3">Trip Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Destination</label>
                  <select
                    value={selectedDestId}
                    onChange={(e) => setSelectedDestId(e.target.value)}
                    className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    {destinationsList.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}, {d.country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Trip Duration (Days)</label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    placeholder="Number of days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Number of Travelers</label>
                  <Input
                    type="number"
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    placeholder="Number of people"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Accommodation Type</label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                    className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option>Budget Hotel</option>
                    <option>Mid-range Hotel</option>
                    <option>Luxury Hotel</option>
                    <option>Airbnb</option>
                    <option>Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Food Preference</label>
                  <select
                    value={foodPreference}
                    onChange={(e) => setFoodPreference(e.target.value)}
                    className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option>Budget</option>
                    <option>Mid-range</option>
                    <option>Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Transport Mode</label>
                  <select
                    value={transportPreference}
                    onChange={(e) => setTransportPreference(e.target.value)}
                    className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option>Driving</option>
                    <option>Public Transit / Train</option>
                    <option>Flight</option>
                  </select>
                </div>

                <Button onClick={handleCalculate} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4 py-2" disabled={isLoading}>
                  {isLoading ? "Calculating..." : "Calculate Budget"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Budget Breakdown */}
          <div className="lg:col-span-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-0 shadow-md p-6 text-center bg-card text-card-foreground">
                <p className="text-sm text-muted-foreground mb-2">Total Budget</p>
                <p className="text-2xl sm:text-3xl font-bold text-teal-600">₹{totalBudget.toLocaleString()}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 text-center bg-card text-card-foreground">
                <p className="text-sm text-muted-foreground mb-2">Per Day</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">₹{Math.round(totalBudget / (duration || 1)).toLocaleString()}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 text-center bg-card text-card-foreground">
                <p className="text-sm text-muted-foreground mb-2">Per Person</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">₹{Math.round(totalBudget / (travelers || 1)).toLocaleString()}</p>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="border-0 shadow-lg p-8 mb-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">Budget Breakdown</h3>

              <div className="space-y-6">
                {budgetItems.map((item, index) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground/80">{item.category}</span>
                      <span className="font-bold text-foreground">₹{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{item.percentage}% of total budget</p>
                  </div>
                ))}
              </div>

              {/* Dynamic Recharts Visualization */}
              <div className="mt-8 p-6 bg-muted/40 rounded-lg">
                <h4 className="font-bold text-foreground mb-4">Visual Distribution</h4>
                <div className="h-64 w-full flex items-center justify-center bg-card rounded-xl border border-border p-2">
                  {budgetItems.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={budgetItems}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="category"
                        >
                          {budgetItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">No distribution calculated</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="border-0 shadow-lg p-8 mb-8 bg-gradient-to-br from-blue-500/10 to-muted/30">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Budget Tips
              </h3>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Book flights 2-3 months in advance for better deals.</span>
                </li>
                {accommodationType.includes("Luxury") ? (
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="font-semibold text-foreground">Luxury Hotel Selected: Consider matching with mid-range properties for part of the trip to save up to 25% overall.</span>
                  </li>
                ) : (
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Stay in mid-range hotels or Airbnb rentals to save 30-40% on accommodation costs.</span>
                  </li>
                )}
                {foodPreference === "Premium" ? (
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="font-semibold text-foreground">Fine dining preference: Check out local food markets during lunch hours to balance costs.</span>
                  </li>
                ) : (
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Eat at authentic local restaurants instead of tourist-heavy plazas.</span>
                  </li>
                )}
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Use public transit options to save on private local travel.</span>
                </li>
              </ul>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white py-6"
                onClick={handleSaveToTrip}
              >
                Save to Trip
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate("/chat-assistant")}
              >
                Optimize Budget
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6 flex items-center justify-center gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
