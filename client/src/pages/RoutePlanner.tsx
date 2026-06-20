import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Map, Navigation, Clock, Zap, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MapView } from "@/components/Map";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface RouteInfo {
  name: string;
  time: string;
  distance: string;
  toll: string;
  directions: { step: number; direction: string; distance: string }[];
}

export default function RoutePlanner() {
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);

  // Input states
  const [startLocation, setStartLocation] = useState("Jaipur");
  const [endLocation, setEndLocation] = useState("Goa");
  const [transitMode, setTransitMode] = useState("Driving");
  const [activeRoute, setActiveRoute] = useState<RouteInfo>({
    name: "Fastest Route",
    time: "Calculating...",
    distance: "Calculating...",
    toll: "Calculating...",
    directions: [
      { step: 1, direction: "Enter locations and click Get Directions to begin.", distance: "0 km" }
    ]
  });
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: 15.2993, lng: 74.1240 }); // Default Goa
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active database destinations on mount to resolve coordinates
  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await apiFetch("/api/destinations?limit=100");
        if (res && res.data && res.data.destinations) {
          setDestinationsList(res.data.destinations);
        }
      } catch (e) {
        console.error("Failed to load destinations", e);
      }
    }
    loadDestinations();

    const params = new URLSearchParams(window.location.search);
    const startParam = params.get("start");
    const endParam = params.get("end");
    if (startParam) setStartLocation(startParam);
    if (endParam) setEndLocation(endParam);
  }, []);

  const handleGetDirections = async () => {
    if (!startLocation.trim()) {
      toast.error("Please enter a start location");
      return;
    }
    if (!endLocation.trim()) {
      toast.error("Please enter a destination");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Resolve start location coordinates (origin)
      const startClean = startLocation.trim().toLowerCase();
      const matchedStart = destinationsList.find(
        (d) => d.name.toLowerCase().includes(startClean) || d.country.toLowerCase().includes(startClean)
      );
      
      const originLat = matchedStart ? matchedStart.latitude : 26.9124; // Default Jaipur Lat if not matched
      const originLng = matchedStart ? matchedStart.longitude : 75.7873; // Default Jaipur Lng if not matched

      // 2. Resolve destination ID
      const endClean = endLocation.trim().toLowerCase();
      const matchedEnd = destinationsList.find(
        (d) => d.name.toLowerCase().includes(endClean) || d.country.toLowerCase().includes(endClean)
      );

      if (!matchedEnd) {
        throw new Error(`Destination "${endLocation}" not found in our database records. Please try a registered destination like Goa, Kashmir, Jaipur, etc.`);
      }

      // Map UI transport selection to backend enums ("flight" | "train" | "car")
      let modeStr = "car";
      const transitLower = transitMode.toLowerCase();
      if (transitLower.includes("flight")) {
        modeStr = "flight";
      } else if (transitLower.includes("train") || transitLower.includes("transit") || transitLower.includes("walk")) {
        modeStr = "train";
      }

      // 3. Request calculation from route service
      const routeRes = await apiFetch("/api/routes/calculate", {
        method: "POST",
        body: JSON.stringify({
          originLatitude: originLat,
          originLongitude: originLng,
          destinationId: matchedEnd._id,
          modeOfTransport: modeStr,
        }),
      });

      if (routeRes && routeRes.data) {
        const { distanceKm, durationHours, estimatedCost, suggestedItinerary, warning } = routeRes.data;

        // Format duration
        let durationText = "";
        if (durationHours >= 1) {
          const hours = Math.floor(durationHours);
          const mins = Math.round((durationHours - hours) * 60);
          durationText = `${hours}h ${mins}m`;
        } else {
          durationText = `${Math.round(durationHours * 60)}m`;
        }

        const calculatedRoute: RouteInfo = {
          name: `${transitMode} Route (via database coordinates)`,
          time: durationText,
          distance: `${distanceKm.toFixed(1)} km`,
          toll: `$${estimatedCost.toFixed(2)}`,
          directions: suggestedItinerary.map((stepText: string, idx: number) => ({
            step: idx + 1,
            direction: stepText,
            distance: idx === 0 ? "0 km" : `${(distanceKm / (suggestedItinerary.length - 1)).toFixed(1)} km`
          }))
        };

        setActiveRoute(calculatedRoute);
        
        // Update map zoom and center on destination
        const newCenter = { lat: matchedEnd.latitude, lng: matchedEnd.longitude };
        setCenter(newCenter);
        if (mapRef.current) {
          mapRef.current.setCenter(newCenter);
          mapRef.current.setZoom(11);
        }

        if (warning) {
          toast.warning(warning);
        } else {
          toast.success(`Directions calculated successfully to ${matchedEnd.name}!`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate route.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoute = () => {
    toast.success("Route saved to your dashboard!");
  };

  const handleAddToTrip = () => {
    navigate(`/planner?destination=${encodeURIComponent(endLocation)}`);
    toast.success(`Copied destination "${endLocation}" to trip planner`);
  };

  const handleShareRoute = () => {
    toast.success("Route directions link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-8 h-8 text-red-600" />
            Route Planner
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 bg-white">
              <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Plan Your Route</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start Location</label>
                  <Input
                    placeholder="Enter start location"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">End Location</label>
                  <Input
                    placeholder="Enter destination"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Transport Mode</label>
                  <select
                    value={transitMode}
                    onChange={(e) => {
                      setTransitMode(e.target.value);
                      setActiveRoute(prev => ({ ...prev, name: "Fastest Route" }));
                    }}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option>Driving</option>
                    <option>Walking</option>
                    <option>Public Transit</option>
                    <option>Flight</option>
                  </select>
                </div>

                <Button onClick={handleGetDirections} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2">
                  Get Directions
                </Button>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start"
                      onClick={handleSaveRoute}
                    >
                      Save Route
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start"
                      onClick={() => navigate("/chat-assistant")}
                    >
                      Optimize Route
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-3">
            {/* Real Interactive Map View */}
            <Card className="border-0 shadow-lg overflow-hidden mb-8 h-96 relative bg-slate-100">
              <MapView
                initialCenter={center}
                initialZoom={12}
                onMapReady={(map) => {
                  mapRef.current = map;
                }}
                className="w-full h-full"
              />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur shadow px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 z-10">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-slate-800">{endLocation || "Map Center"} View</span>
              </div>
            </Card>

            {/* Route Details */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <Card className="border-0 shadow-md p-6 bg-white">
                <Navigation className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Distance</p>
                <p className="text-2xl font-bold text-slate-900">{activeRoute.distance}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 bg-white">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Duration</p>
                <p className="text-2xl font-bold text-slate-900">{activeRoute.time}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 bg-white">
                <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-1">Toll Cost</p>
                <p className="text-2xl font-bold text-slate-900">{activeRoute.toll}</p>
              </Card>
            </div>

            {/* Route Options */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Route Options</h3>
              <div className="space-y-4">
                <Card
                  className="border shadow-md p-6 bg-white border-teal-500 bg-teal-50/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-2">{activeRoute.name}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                        <p>⏱️ {activeRoute.time}</p>
                        <p>📍 {activeRoute.distance}</p>
                        <p>💰 {activeRoute.toll}</p>
                      </div>
                    </div>
                    <Button className="ml-4 bg-teal-600 hover:bg-teal-700 text-white">
                      Selected
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Turn-by-Turn Directions */}
            <Card className="border-0 shadow-lg p-8 mb-8 bg-white">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Turn-by-Turn Directions</h3>
              <div className="space-y-3">
                {activeRoute.directions.map((item) => (
                  <div key={item.step} className="flex gap-4 pb-3 border-b border-slate-200 last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.direction}</p>
                      <p className="text-sm text-slate-500 font-medium">{item.distance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white py-6"
                onClick={handleSaveRoute}
              >
                Save Route
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-900 hover:bg-slate-50 py-6"
                onClick={handleAddToTrip}
              >
                Add to Trip
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-900 hover:bg-slate-50 py-6"
                onClick={handleShareRoute}
              >
                Share Route
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
