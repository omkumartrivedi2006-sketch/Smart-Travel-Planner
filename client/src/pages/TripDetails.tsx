import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Calendar, DollarSign, MapPin, Download, Share2, Edit2, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Trip {
  id: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  status: string;
  travelers?: number;
  accommodation?: string;
  interests?: string[];
}

const DEFAULT_TRIPS: Trip[] = [
  {
    id: 1,
    name: "Bali Beach Getaway",
    destination: "Bali, Indonesia",
    startDate: "2026-07-15",
    endDate: "2026-07-22",
    budget: "₹2,500",
    status: "Upcoming",
    travelers: 2,
    accommodation: "Resort",
    interests: ["Beach", "Culture"],
  },
  {
    id: 2,
    name: "Swiss Alps Adventure",
    destination: "Swiss Alps",
    startDate: "2026-08-01",
    endDate: "2026-08-10",
    budget: "₹5,000",
    status: "Upcoming",
    travelers: 2,
    accommodation: "Hotel",
    interests: ["Adventure", "Nature"],
  },
  {
    id: 3,
    name: "Madrid City Break",
    destination: "Madrid, Spain",
    startDate: "2026-06-20",
    endDate: "2026-06-25",
    budget: "₹1,800",
    status: "Completed",
    travelers: 1,
    accommodation: "Airbnb",
    interests: ["Culture", "Food"],
  },
];

export default function TripDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const id = Number(params.id);

  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    // Load from localStorage or fall back
    const saved = localStorage.getItem("saved_trips");
    let tripsList = DEFAULT_TRIPS;
    if (saved) {
      try {
        tripsList = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    const foundTrip = tripsList.find((t) => t.id === id);
    if (foundTrip) {
      setTrip(foundTrip);
    }
  }, [id]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Trip Not Found</h2>
        <p className="text-slate-600 mb-6">The trip details you are looking for do not exist.</p>
        <Button onClick={() => navigate("/saved-trips")} className="bg-teal-600 hover:bg-teal-700 text-white">
          Back to My Trips
        </Button>
      </div>
    );
  }

  // Calculate duration
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  // Clean numeric budget
  const numericBudget = Number(trip.budget.replace(/[^0-9]/g, "")) || 1000;

  // Budget Breakdown values
  const budgetBreakdown = [
    { category: "Accommodation", percentage: 40, color: "bg-teal-600" },
    { category: "Food & Dining", percentage: 24, color: "bg-teal-500" },
    { category: "Transportation", percentage: 20, color: "bg-cyan-500" },
    { category: "Activities", percentage: 12, color: "bg-emerald-500" },
    { category: "Miscellaneous", percentage: 4, color: "bg-slate-400" },
  ].map(item => ({
    ...item,
    amount: `₹${Math.round((numericBudget * item.percentage) / 100).toLocaleString()}`,
  }));

  const handleExport = () => {
    toast.success("Itinerary successfully exported as PDF!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link to this trip itinerary copied to clipboard!");
  };

  const handleEdit = () => {
    navigate(`/planner?destination=${encodeURIComponent(trip.destination)}&budget=${numericBudget}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/saved-trips")} className="text-slate-600 mb-4">
            ← Back to My Trips
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Trip Details</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Trip Header */}
            <Card className="border-0 shadow-lg p-8 mb-8 bg-white">
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-2">{trip.name}</h2>
                  <p className="text-lg text-slate-600 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {trip.destination}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  trip.status === "Upcoming"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {trip.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Duration</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{durationDays} Days</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Budget</p>
                  <p className="text-xl sm:text-2xl font-bold text-teal-600">{trip.budget}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Travelers</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{trip.travelers || 1} Person{trip.travelers && trip.travelers > 1 ? "s" : ""}</p>
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
                <Button onClick={handleShare} variant="outline" className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 min-w-[100px]">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={handleExport} variant="outline" className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 min-w-[100px]">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>

            {/* Itinerary */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Itinerary</h3>
              <div className="space-y-4">
                {Array.from({ length: durationDays }).map((_, index) => {
                  const currentDay = new Date(start);
                  currentDay.setDate(start.getDate() + index);
                  const dayName = currentDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  
                  return (
                    <Card key={index} className="border-0 shadow-md p-6 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <h4 className="text-lg font-bold text-slate-900">Day {index + 1}</h4>
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-teal-600" />
                          {dayName}
                        </span>
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <p>☀️ **Morning**: Explore top spots in {trip.destination.split(",")[0]}</p>
                        <p>🍲 **Afternoon**: Enjoy local dining and cultural spots</p>
                        <p>🌙 **Evening**: Relax at your {trip.accommodation || "Hotel"} and prepare for tomorrow</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Budget Breakdown</h3>
              <Card className="border-0 shadow-md p-6 bg-white">
                <div className="space-y-4">
                  {budgetBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{item.category}</span>
                        <span className="font-bold text-slate-900">{item.amount}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
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
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Weather Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {["Mon", "Tue", "Wed", "Thu"].map((day) => (
                  <Card key={day} className="border-0 shadow-md p-4 text-center bg-white">
                    <p className="font-semibold text-slate-900 mb-2">{day}</p>
                    <p className="text-3xl mb-2">☀️</p>
                    <p className="font-bold text-slate-900">28°C</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 py-6"
                onClick={() => navigate(`/budget-calculator?total=${numericBudget}&duration=${durationDays}`)}
              >
                Recalculate Budget
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 py-6"
                onClick={() => navigate(`/route-planner?end=${encodeURIComponent(trip.destination)}`)}
              >
                View Route
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 py-6"
                onClick={() => navigate("/chat-assistant")}
              >
                Get Help
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 sticky top-24 bg-white">
              <h4 className="font-bold text-slate-900 mb-6">Trip Summary</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Start Date</p>
                  <p className="font-semibold text-slate-900">{new Date(trip.startDate).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">End Date</p>
                  <p className="font-semibold text-slate-900">{new Date(trip.endDate).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Budget</p>
                  <p className="text-2xl font-bold text-teal-600">{trip.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Spent</p>
                  <p className="text-xl font-bold text-slate-900">₹0</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Remaining</p>
                  <p className="text-xl font-bold text-green-600">{trip.budget}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200 space-y-3">
                <Button onClick={handleEdit} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Edit Trip Details
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
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
