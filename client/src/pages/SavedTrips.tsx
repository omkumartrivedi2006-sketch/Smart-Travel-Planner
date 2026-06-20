import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Edit2, Trash2, Share2, Calendar, DollarSign, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Trip {
  _id: string;
  destination: {
    _id: string;
    name: string;
    description?: string;
    country?: string;
  };
  startDate: string;
  endDate: string;
  travelers?: number;
  hotelPreference?: string;
  transportPreference?: string;
  travelType?: string;
  budget?: {
    _id: string;
    hotelCost: number;
    foodCost: number;
    transportCost: number;
    activitiesCost: number;
    miscellaneousCost: number;
    totalEstimate: number;
  };
  status?: string;
}

export default function SavedTrips() {
  const [, navigate] = useLocation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // Load trips from API
  useEffect(() => {
    async function fetchTrips() {
      try {
        setIsLoading(true);
        const res = await apiFetch("/api/trips");
        if (res && res.data && res.data.trips) {
          // Process status for each trip dynamically
          const processed = res.data.trips.map((t: any) => {
            const now = new Date();
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            let computedStatus = "Upcoming";
            if (end < now) {
              computedStatus = "Completed";
            }
            return {
              ...t,
              status: computedStatus,
            };
          });
          setTrips(processed);
        }
      } catch (err: any) {
        console.error("Failed to fetch trips", err);
        toast.error("Failed to load your trips. Make sure you are logged in.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (id: string, name: string) => {
    try {
      await apiFetch(`/api/trips/${id}`, {
        method: "DELETE",
      });
      setTrips(prev => prev.filter(t => t._id !== id));
      toast.success(`Deleted trip "${name}" successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete trip. Please try again.");
    }
  };

  const handleShareTrip = (name: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/trips/${name.replace(/\s+/g, "-").toLowerCase()}`);
    toast.success(`Shareable link for "${name}" copied to clipboard!`);
  };

  const handleEditTrip = (trip: Trip) => {
    const totalEstimate = trip.budget?.totalEstimate || 0;
    navigate(`/planner?destination=${encodeURIComponent(trip.destination.name)}&budget=${totalEstimate}&travelers=${trip.travelers || 2}`);
  };

  // Filter trips based on state tab selection
  const filteredTrips = trips.filter((trip) => {
    if (filter === "All") return true;
    return trip.status?.toLowerCase() === filter.toLowerCase();
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium animate-pulse">Loading your saved journeys...</p>
          </div>
        ) : trips.length === 0 ? (
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
              {["All", "Upcoming", "Completed"].map((f) => {
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
              filteredTrips.map((trip) => {
                const tripName = `Trip to ${trip.destination.name}`;
                return (
                  <Card
                    key={trip._id}
                    className="border-0 shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer bg-white"
                    onClick={() => navigate(`/trips/${trip._id}`)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                      {/* Trip Info */}
                      <div className="md:col-span-2">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{tripName}</h3>
                        <p className="text-slate-600 flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-teal-600" />
                          {trip.destination.name}
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
                          ₹{(trip.budget?.totalEstimate || 0).toLocaleString()}
                        </p>
                        <div className="mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            trip.status === "Upcoming"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
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
                          onClick={() => handleShareTrip(tripName)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Delete Trip"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={() => handleDeleteTrip(trip._id, tripName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
