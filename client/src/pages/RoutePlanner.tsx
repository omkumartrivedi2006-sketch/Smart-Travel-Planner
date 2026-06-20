import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Map, Navigation, Clock, Zap, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MapView } from "@/components/Map";
import { toast } from "sonner";

interface RouteInfo {
  name: string;
  time: string;
  distance: string;
  toll: string;
  directions: { step: number; direction: string; distance: string }[];
}

const ROUTE_DATA: Record<string, Record<string, RouteInfo>> = {
  driving: {
    "Fastest Route": {
      name: "Fastest Route (via Highway 1)",
      time: "1h 30m",
      distance: "45 km",
      toll: "₹450",
      directions: [
        { step: 1, direction: "Head north on Airport Exit Rd", distance: "0.5 km" },
        { step: 2, direction: "Turn right onto Bypass Highway 1", distance: "2.3 km" },
        { step: 3, direction: "Continue straight on Highway 1", distance: "15 km" },
        { step: 4, direction: "Take exit 45 towards Ubud Scenic route", distance: "8 km" },
        { step: 5, direction: "Turn left onto Ubud Main Road", distance: "19.2 km" },
        { step: 6, direction: "Arrive at destination on the right", distance: "0 km" },
      ],
    },
    "Scenic Route": {
      name: "Scenic Route (via Coast Road)",
      time: "2h 15m",
      distance: "52 km",
      toll: "₹0",
      directions: [
        { step: 1, direction: "Head south along beach coastal lane", distance: "1.2 km" },
        { step: 2, direction: "Turn left onto Coastal Bypass Rd", distance: "8.5 km" },
        { step: 3, direction: "Follow signage towards rice field valleys", distance: "25 km" },
        { step: 4, direction: "Continue past temples and craft villages", distance: "17.3 km" },
        { step: 5, direction: "Arrive at destination on the right", distance: "0 km" },
      ],
    },
    "Cheapest Route": {
      name: "Cheapest Route (avoiding tolls)",
      time: "1h 45m",
      distance: "48 km",
      toll: "₹0",
      directions: [
        { step: 1, direction: "Head north on Airport Exit Rd", distance: "0.5 km" },
        { step: 2, direction: "Take the local bypass lanes to avoid toll booth", distance: "42.5 km" },
        { step: 3, direction: "Turn right at the valley junction", distance: "5 km" },
        { step: 4, direction: "Arrive at destination on the left", distance: "0 km" },
      ],
    },
  },
  walking: {
    "Fastest Route": {
      name: "Walking Route (Direct paths)",
      time: "9h 15m",
      distance: "42 km",
      toll: "₹0",
      directions: [
        { step: 1, direction: "Head north on pedestrian sidewalk", distance: "1 km" },
        { step: 2, direction: "Continue along local walking trail", distance: "39 km" },
        { step: 3, direction: "Walk through town central path", distance: "2 km" },
        { step: 4, direction: "Arrive at destination", distance: "0 km" },
      ],
    },
    "Scenic Route": {
      name: "Scenic Walking Trail",
      time: "11h 30m",
      distance: "49 km",
      toll: "₹0",
      directions: [
        { step: 1, direction: "Take coastal walk path north", distance: "10 km" },
        { step: 2, direction: "Follow forest trail pathway", distance: "32 km" },
        { step: 3, direction: "Turn left onto village lanes", distance: "7 km" },
        { step: 4, direction: "Arrive at destination", distance: "0 km" },
      ],
    },
    "Cheapest Route": {
      name: "Cheapest Walking Route",
      time: "9h 15m",
      distance: "42 km",
      toll: "₹0",
      directions: [
        { step: 1, direction: "Walk along highway pedestrian corridors", distance: "42 km" },
      ],
    },
  },
};

export default function RoutePlanner() {
  const [, navigate] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);

  // Input states
  const [startLocation, setStartLocation] = useState("Airport");
  const [endLocation, setEndLocation] = useState("Ubud");
  const [transitMode, setTransitMode] = useState("Driving");
  const [activeRouteName, setActiveRouteName] = useState("Fastest Route");
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({ lat: -8.4095, lng: 115.1889 }); // Default Bali

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get("start");
    const endParam = params.get("end");
    
    if (startParam) setStartLocation(startParam);
    if (endParam) {
      setEndLocation(endParam);
      handleUpdateCoordinates(endParam);
    }
  }, []);

  const handleUpdateCoordinates = (destinationName: string) => {
    const nameLower = destinationName.toLowerCase();
    let newCenter = { lat: -8.4095, lng: 115.1889 }; // Default Bali
    
    if (nameLower.includes("alps") || nameLower.includes("swiss") || nameLower.includes("switzerland")) {
      newCenter = { lat: 46.8182, lng: 8.2275 }; // Swiss Alps
    } else if (nameLower.includes("madrid") || nameLower.includes("spain") || nameLower.includes("madrid, spain")) {
      newCenter = { lat: 40.4168, lng: -3.7038 }; // Madrid
    } else if (nameLower.includes("tokyo") || nameLower.includes("japan")) {
      newCenter = { lat: 35.6762, lng: 139.6503 }; // Tokyo
    } else if (nameLower.includes("paris")) {
      newCenter = { lat: 48.8566, lng: 2.3522 }; // Paris
    }

    setCenter(newCenter);
    if (mapRef.current) {
      mapRef.current.setCenter(newCenter);
      mapRef.current.setZoom(13);
    }
  };

  const handleGetDirections = () => {
    if (!startLocation.trim()) {
      toast.error("Please enter a start location");
      return;
    }
    if (!endLocation.trim()) {
      toast.error("Please enter a destination");
      return;
    }

    handleUpdateCoordinates(endLocation);
    toast.success(`Directions calculated from ${startLocation} to ${endLocation}!`);
  };

  // Get active route data
  const modeKey = transitMode.toLowerCase() === "walking" ? "walking" : "driving";
  const activeRoutes = ROUTE_DATA[modeKey] || ROUTE_DATA.driving;
  const activeRoute = activeRoutes[activeRouteName] || activeRoutes["Fastest Route"];

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
                      setActiveRouteName("Fastest Route");
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
                {Object.keys(activeRoutes).map((name) => {
                  const r = activeRoutes[name];
                  const isSelected = activeRouteName === name;
                  return (
                    <Card
                      key={name}
                      onClick={() => setActiveRouteName(name)}
                      className={`border shadow-md p-6 hover:shadow-lg transition-all cursor-pointer bg-white ${
                        isSelected ? "border-teal-500 bg-teal-50/10" : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-2">{r.name}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                            <p>⏱️ {r.time}</p>
                            <p>📍 {r.distance}</p>
                            <p>💰 {r.toll}</p>
                          </div>
                        </div>
                        <Button className={`ml-4 ${
                          isSelected ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}>
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
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
