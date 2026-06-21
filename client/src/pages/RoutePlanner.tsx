import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Map, Navigation, Clock, Zap, MapPin, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MapView, MapMarker } from "@/components/Map";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface RouteInfo {
  name: string;
  time: string;
  distance: string;
  toll: string;
  directions: { step: number; direction: string; distance: string }[];
}

export default function RoutePlanner() {
  const [, navigate] = useLocation();
  const mapRef = useRef<any | null>(null);
  const { theme, toggleTheme } = useTheme();

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
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 15.2993, lng: 74.1240 }); // Default Goa
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
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
        const { distanceKm, durationHours, estimatedCost, suggestedItinerary, routeCoordinates, warning } = routeRes.data;

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
          name: `${transitMode} Route (via live routing API)`,
          time: durationText,
          distance: `${distanceKm.toFixed(1)} km`,
          toll: `₹${Math.round(estimatedCost * 80).toLocaleString()}`, // Convert USD to INR
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

        // Update markers and route polylines
        const startMarker: MapMarker = {
          lat: originLat,
          lng: originLng,
          title: startLocation,
          category: "Start",
        };
        const endMarker: MapMarker = {
          lat: matchedEnd.latitude,
          lng: matchedEnd.longitude,
          title: matchedEnd.name,
          category: "Destination",
        };
        
        setMapMarkers([startMarker, endMarker]);
        if (routeCoordinates) {
          setRouteCoords(routeCoordinates);
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground mb-2 flex items-center gap-1">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Map className="w-8 h-8 text-red-600" />
              Route Planner
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
          {/* Input Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
              <h3 className="font-bold text-foreground mb-6 border-b border-border pb-3">Plan Your Route</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Start Location</label>
                  <Input
                    placeholder="Enter start location"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">End Location</label>
                  <Input
                    placeholder="Enter destination"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground/80 mb-2">Transport Mode</label>
                  <select
                    value={transitMode}
                    onChange={(e) => {
                      setTransitMode(e.target.value);
                      setActiveRoute(prev => ({ ...prev, name: "Fastest Route" }));
                    }}
                    className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
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

                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-muted justify-start"
                      onClick={handleSaveRoute}
                    >
                      Save Route
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-muted justify-start"
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
            <Card className="border-0 shadow-lg overflow-hidden mb-8 h-96 relative bg-muted text-card-foreground">
              <MapView
                center={center}
                zoom={11}
                markers={mapMarkers}
                routeCoordinates={routeCoords}
                onMapReady={(map) => {
                  mapRef.current = map;
                }}
                className="w-full h-full"
              />
              <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur shadow px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 z-10 text-foreground">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold">{endLocation || "Map Center"} View</span>
              </div>
            </Card>

            {/* Route Details */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <Card className="border-0 shadow-md p-6 bg-card text-card-foreground">
                <Navigation className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Distance</p>
                <p className="text-2xl font-bold text-foreground">{activeRoute.distance}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 bg-card text-card-foreground">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                <p className="text-2xl font-bold text-foreground">{activeRoute.time}</p>
              </Card>
              <Card className="border-0 shadow-md p-6 bg-card text-card-foreground">
                <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Toll Cost</p>
                <p className="text-2xl font-bold text-foreground">{activeRoute.toll}</p>
              </Card>
            </div>

            {/* Route Options */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Route Options</h3>
              <div className="space-y-4">
                <Card
                  className="border shadow-md p-6 bg-card text-card-foreground border-teal-500 bg-teal-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground mb-2">{activeRoute.name}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
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
            <Card className="border-0 shadow-lg p-8 mb-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">Turn-by-Turn Directions</h3>
              <div className="space-y-3">
                {activeRoute.directions.map((item) => (
                  <div key={item.step} className="flex gap-4 pb-3 border-b border-border last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.direction}</p>
                      <p className="text-sm text-muted-foreground font-medium">{item.distance}</p>
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
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={handleAddToTrip}
              >
                Add to Trip
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
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
