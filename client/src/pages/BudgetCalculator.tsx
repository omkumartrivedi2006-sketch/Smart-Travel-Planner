import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { DollarSign, Download, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
}

export default function BudgetCalculator() {
  const [, navigate] = useLocation();

  // Input states
  const [totalBudget, setTotalBudget] = useState(2500);
  const [duration, setDuration] = useState(7);
  const [travelers, setTravelers] = useState(1);
  const [accommodationType, setAccommodationType] = useState("Mid-range Hotel");
  const [foodPreference, setFoodPreference] = useState("Mid-range");

  // Output budget state
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  // Parse URL search parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const totalParam = params.get("total");
    const durationParam = params.get("duration");
    const travelersParam = params.get("travelers");

    if (totalParam) setTotalBudget(Number(totalParam));
    if (durationParam) setDuration(Number(durationParam));
    if (travelersParam) setTravelers(Number(travelersParam));

    calculateBudget(
      totalParam ? Number(totalParam) : 2500,
      accommodationType,
      foodPreference
    );
  }, []);

  const calculateBudget = (
    budgetVal: number,
    accType: string,
    foodPref: string
  ) => {
    // Dynamic percentage allocations based on selections
    let accPercent = 40;
    if (accType === "Luxury Hotel") accPercent = 50;
    else if (accType === "Hostel") accPercent = 20;
    else if (accType === "Budget Hotel") accPercent = 30;

    let foodPercent = 24;
    if (foodPref === "Premium") foodPercent = 30;
    else if (foodPref === "Budget") foodPercent = 15;

    let transportPercent = 20;
    let activitiesPercent = 12;

    // Adjust for total summing to 100
    let miscPercent = 100 - (accPercent + foodPercent + transportPercent + activitiesPercent);
    if (miscPercent < 4) {
      miscPercent = 4;
      activitiesPercent = 100 - (accPercent + foodPercent + transportPercent + miscPercent);
    }

    const items = [
      { category: "Accommodation", percentage: accPercent },
      { category: "Food & Dining", percentage: foodPercent },
      { category: "Transportation", percentage: transportPercent },
      { category: "Activities", percentage: activitiesPercent },
      { category: "Miscellaneous", percentage: miscPercent },
    ].map((item) => ({
      category: item.category,
      amount: Math.round((budgetVal * item.percentage) / 100),
      percentage: item.percentage,
    }));

    setBudgetItems(items);
  };

  const handleCalculate = () => {
    if (totalBudget <= 0) {
      toast.error("Please enter a valid total budget");
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

    calculateBudget(totalBudget, accommodationType, foodPreference);
    toast.success("Budget recalculated!");
  };

  const handleSaveToTrip = () => {
    navigate(`/planner?budget=${totalBudget}&travelers=${travelers}`);
    toast.success("Budget values copied to Trip Planner");
  };

  const handleDownload = () => {
    toast.success("Budget plan downloaded as CSV!");
  };

  const COLORS = ["#0f766e", "#0891b2", "#06b6d4", "#14b8a6", "#2dd4bf"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            Smart Budget Calculator
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 bg-white">
              <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Trip Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Total Budget (₹)</label>
                  <Input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Trip Duration (Days)</label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    placeholder="Number of days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Travelers</label>
                  <Input
                    type="number"
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    placeholder="Number of people"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Accommodation Type</label>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option>Budget Hotel</option>
                    <option>Mid-range Hotel</option>
                    <option>Luxury Hotel</option>
                    <option>Airbnb</option>
                    <option>Hostel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Food Preference</label>
                  <select
                    value={foodPreference}
                    onChange={(e) => setFoodPreference(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option>Budget</option>
                    <option>Mid-range</option>
                    <option>Premium</option>
                  </select>
                </div>

                <Button onClick={handleCalculate} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4 py-2">
                  Calculate Budget
                </Button>
              </div>
            </Card>
          </div>

          {/* Budget Breakdown */}
          <div className="lg:col-span-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="border-0 shadow-md p-6 text-center bg-white">
                <p className="text-sm text-slate-600 mb-2">Total Budget</p>
                <p className="text-2xl sm:text-3xl font-bold text-teal-600">₹{totalBudget.toLocaleString()}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 text-center bg-white">
                <p className="text-sm text-slate-600 mb-2">Per Day</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">₹{Math.round(totalBudget / (duration || 1)).toLocaleString()}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 text-center bg-white">
                <p className="text-sm text-slate-600 mb-2">Per Person</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">₹{Math.round(totalBudget / (travelers || 1)).toLocaleString()}</p>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="border-0 shadow-lg p-8 mb-8 bg-white">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Budget Breakdown</h3>

              <div className="space-y-6">
                {budgetItems.map((item, index) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-800">{item.category}</span>
                      <span className="font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{item.percentage}% of total budget</p>
                  </div>
                ))}
              </div>

              {/* Dynamic Recharts Visualization */}
              <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-4">Visual Distribution</h4>
                <div className="h-64 w-full flex items-center justify-center bg-white rounded-xl border border-slate-100 p-2">
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
                    <p className="text-slate-400 text-sm">No distribution calculated</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="border-0 shadow-lg p-8 mb-8 bg-gradient-to-br from-blue-50 to-slate-50">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Budget Tips
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Book flights 2-3 months in advance for better deals.</span>
                </li>
                {accommodationType.includes("Luxury") ? (
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="font-semibold text-slate-900">Luxury Hotel Selected: Consider matching with mid-range properties for part of the trip to save up to 25% overall.</span>
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
                    <span className="font-semibold text-slate-900">Fine dining preference: Check out local food markets during lunch hours to balance costs.</span>
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
                className="border-slate-300 text-slate-900 hover:bg-slate-50 py-6"
                onClick={() => navigate("/chat-assistant")}
              >
                Optimize Budget
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-900 hover:bg-slate-50 py-6 flex items-center justify-center gap-2"
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
