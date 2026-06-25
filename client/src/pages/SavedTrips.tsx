import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Edit2, Trash2, Share2, Calendar, MapPin, Loader2, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocationData } from "@/contexts/LocationContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

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
  const { theme, toggleTheme } = useTheme();
  const { location } = useLocationData();
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
          // Debugging log to identify malformed records
          console.log("Saved Trips:", res.data.trips);
          
          // Filter out null/undefined trip elements
          const validTrips = res.data.trips.filter(Boolean);
          
          // Process status for each trip dynamically
          const processed = validTrips.map((t: any) => {
            if (!t) return null;
            const now = new Date();
            const start = t.startDate ? new Date(t.startDate) : now;
            const end = t.endDate ? new Date(t.endDate) : now;
            let computedStatus = "Upcoming";
            if (end < now) {
              computedStatus = "Completed";
            }
            return {
              ...t,
              status: computedStatus,
            };
          }).filter(Boolean);
          
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
    if (!id) return;
    try {
      await apiFetch(`/api/trips/${id}`, {
        method: "DELETE",
      });
      setTrips(prev => prev.filter(t => t?._id !== id));
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
    if (!trip) return;
    const totalEstimate = trip.budget?.totalEstimate || 0;
    const destName = trip.destination?.name ?? "Unknown Destination";
    navigate(`/planner?destination=${encodeURIComponent(destName)}&budget=${totalEstimate}&travelers=${trip.travelers || 2}`);
  };

  // Filter trips based on state tab selection and guarantee null/invalid records are skipped
  const filteredTrips = trips
    .filter(Boolean)
    .filter((trip) => trip !== null)
    .filter((trip) => {
      if (filter === "All") return true;
      return (trip.status ?? "Upcoming").toLowerCase() === filter.toLowerCase();
    });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground mb-4">
              ← Back to Home
            </Button>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-foreground">My Trips</h1>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                onClick={() => navigate("/planner")}
              >
                + Create New Trip
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end mb-1">
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading your saved journeys...</p>
          </div>
        ) : trips.length === 0 ? (
          <Card className="border border-border shadow-lg p-12 text-center bg-card flex flex-col items-center justify-center">
            <MapPin className="w-16 h-16 text-teal-600 mb-4 animate-bounce shrink-0" />
            <h2 className="text-2xl font-bold text-card-foreground mb-2">No trips found</h2>
            <p className="text-muted-foreground mb-6">Create your first trip to start your next adventure!</p>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 text-base font-semibold"
              onClick={() => navigate("/planner")}
            >
              Plan a Trip
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
                    className={isActive ? "bg-teal-600 hover:bg-teal-700 text-white border-0" : "border-border text-foreground/70 hover:text-foreground hover:bg-muted dark:text-foreground/80"}
                  >
                    {f}
                  </Button>
                );
              })}
            </div>

            {/* Trips List */}
            {filteredTrips.length === 0 ? (
              <Card className="border border-border shadow-md p-10 text-center bg-card">
                <p className="text-muted-foreground">No {filter.toLowerCase()} trips found.</p>
              </Card>
            ) : (
              filteredTrips.map((trip) => {
                if (!trip) return null;
                const destName = trip.destination?.name ?? "Unknown Destination";
                const tripName = `Trip to ${destName}`;
                return (
                  <Card
                    key={trip._id}
                    className="border border-border shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer bg-card"
                    onClick={() => {
                      if (trip._id) {
                        navigate(`/trips/${trip._id}`);
                      }
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                      {/* Trip Info */}
                      <div className="md:col-span-2">
                        <h3 className="text-xl font-bold text-card-foreground mb-2">{tripName}</h3>
                        <p className="text-muted-foreground flex items-center gap-2 mb-2 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                          {destName}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2 text-xs">
                          <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                          {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "N/A"} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>

                      {/* Budget & Status */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Budget</p>
                        <p className="text-xl font-bold text-teal-650 flex items-center gap-1">
                          ₹{(trip.budget?.totalEstimate ?? 0).toLocaleString()}
                        </p>
                        <div className="mt-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            (trip.status ?? "Upcoming") === "Upcoming"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}>
                            {trip.status ?? "Upcoming"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end md:justify-start" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Edit Trip"
                          className="border-border text-foreground hover:bg-muted"
                          onClick={() => handleEditTrip(trip)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Share Trip"
                          className="border-border text-foreground hover:bg-muted"
                          onClick={() => handleShareTrip(tripName)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Delete Trip"
                          className="border-red-250 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300"
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
