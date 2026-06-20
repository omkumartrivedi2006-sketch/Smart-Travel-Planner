import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Edit2, Trash2, Share2, Calendar, DollarSign, MapPin } from "lucide-react";
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
  },
];

export default function SavedTrips() {
  const [, navigate] = useLocation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState("All");

  // Load trips from localStorage on mount, fall back to default trips
  useEffect(() => {
    const saved = localStorage.getItem("saved_trips");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTrips(parsed);
      } catch (e) {
        console.error("Failed to parse saved trips", e);
        setTrips(DEFAULT_TRIPS);
      }
    } else {
      setTrips(DEFAULT_TRIPS);
      localStorage.setItem("saved_trips", JSON.stringify(DEFAULT_TRIPS));
    }
  }, []);

  const handleDeleteTrip = (id: number, name: string) => {
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);
    localStorage.setItem("saved_trips", JSON.stringify(updated));
    toast.success(`Deleted trip "${name}" successfully`);
  };

  const handleShareTrip = (name: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/trips/${name.replace(/\s+/g, "-").toLowerCase()}`);
    toast.success(`Shareable link for "${name}" copied to clipboard!`);
  };

  const handleEditTrip = (trip: Trip) => {
    const cleanBudget = trip.budget.replace(/[^0-9]/g, "");
    navigate(`/planner?destination=${encodeURIComponent(trip.destination)}&budget=${cleanBudget}`);
  };

  // Filter trips based on state tab selection
  const filteredTrips = trips.filter((trip) => {
    if (filter === "All") return true;
    return trip.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => navigate("/planner")}
            >
              + Create New Trip
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {trips.length === 0 ? (
          <Card className="border-0 shadow-lg p-12 text-center bg-white">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No trips yet</h2>
            <p className="text-slate-600 mb-6">Start planning your first adventure!</p>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => navigate("/planner")}
            >
              Plan Your First Trip
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {["All", "Upcoming", "Completed", "Archived"].map((f) => {
                const isActive = filter === f;
                return (
                  <Button
                    key={f}
                    onClick={() => setFilter(f)}
                    variant={isActive ? "default" : "outline"}
                    className={isActive ? "bg-teal-600 hover:bg-teal-700 text-white" : "border-slate-300 text-slate-700"}
                  >
                    {f}
                  </Button>
                );
              })}
            </div>

            {/* Trips List */}
            {filteredTrips.length === 0 ? (
              <Card className="border-0 shadow-md p-10 text-center bg-white">
                <p className="text-slate-600">No {filter.toLowerCase()} trips found.</p>
              </Card>
            ) : (
              filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="border-0 shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer bg-white"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    {/* Trip Info */}
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{trip.name}</h3>
                      <p className="text-slate-600 flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        {trip.destination}
                      </p>
                      <p className="text-slate-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Budget & Status */}
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Budget</p>
                      <p className="text-xl font-bold text-teal-600 flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {trip.budget}
                      </p>
                      <div className="mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trip.status === "Upcoming"
                            ? "bg-blue-100 text-blue-700"
                            : trip.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end md:justify-start" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Edit Trip"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => handleEditTrip(trip)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Share Trip"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        onClick={() => handleShareTrip(trip.name)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Delete Trip"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleDeleteTrip(trip.id, trip.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
