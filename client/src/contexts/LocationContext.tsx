import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, ShieldAlert, Navigation, Search, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export type PermissionStatus = "prompt" | "granted" | "denied" | "skipped";

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: PermissionStatus;
  showPermissionModal: boolean;
  showManualSelectModal: boolean;
  askForLocationPermission: () => Promise<void>;
  setLocationManually: (cityName: string) => Promise<boolean>;
  skipPermission: () => void;
  setShowPermissionModal: (show: boolean) => void;
  setShowManualSelectModal: (show: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(() => {
    try {
      const stored = localStorage.getItem("stp_location");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(() => {
    const storedStatus = localStorage.getItem("stp_location_status");
    return (storedStatus as PermissionStatus) || "prompt";
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showManualSelectModal, setShowManualSelectModal] = useState(false);
  const [manualCityQuery, setManualCityQuery] = useState("");
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  // Trigger permission modal on first load if state is prompt
  useEffect(() => {
    if (permissionStatus === "prompt" && !location) {
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [permissionStatus, location]);

  const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; state: string; country: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!response.ok) throw new Error("Reverse geocoding request failed.");
      
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || "Unknown City";
        const state = addr.state || addr.region || "";
        const country = addr.country || "";
        return { city, state, country };
      }
    } catch (err) {
      console.error("Reverse geocoding failed: ", err);
    }
    return { city: "Unknown City", state: "", country: "" };
  };

  const askForLocationPermission = async (): Promise<void> => {
    if (!navigator.geolocation) {
      const errMsg = "Geolocation is not supported by your browser.";
      setError(errMsg);
      toast.error(errMsg);
      setPermissionStatus("denied");
      localStorage.setItem("stp_location_status", "denied");
      setShowManualSelectModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowPermissionModal(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          const locationData: LocationData = {
            latitude,
            longitude,
            ...address,
          };

          setLocation(locationData);
          setPermissionStatus("granted");
          localStorage.setItem("stp_location", JSON.stringify(locationData));
          localStorage.setItem("stp_location_status", "granted");
          setError(null);
          toast.success(`Location set to ${address.city}, ${address.country}!`);
        } catch (err: any) {
          setError(err.message || "Failed to resolve your address coordinates.");
          toast.error("Could not fetch location details. Try setting it manually.");
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        let errMsg = "Location permission denied.";
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = "Location access denied. Please select your current city manually.";
          setPermissionStatus("denied");
          localStorage.setItem("stp_location_status", "denied");
          setShowManualSelectModal(true);
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errMsg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          errMsg = "The request to get user location timed out.";
        }
        setError(errMsg);
        toast.error(errMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const setLocationManually = async (cityName: string): Promise<boolean> => {
    if (!cityName.trim()) {
      toast.error("Please enter a valid city name");
      return false;
    }

    setIsSearchingCity(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const match = data[0];
          const lat = parseFloat(match.lat);
          const lon = parseFloat(match.lon);

          const parts = match.display_name.split(",").map((s: string) => s.trim());
          const city = parts[0] || cityName;
          const country = parts[parts.length - 1] || "";
          const state = parts.length > 2 ? parts[parts.length - 3] : "";

          const locationData: LocationData = {
            latitude: lat,
            longitude: lon,
            city,
            state,
            country,
          };

          setLocation(locationData);
          setPermissionStatus("granted");
          localStorage.setItem("stp_location", JSON.stringify(locationData));
          localStorage.setItem("stp_location_status", "granted");
          setShowManualSelectModal(false);
          toast.success(`Location set manually to ${city}, ${country}!`);
          setIsSearchingCity(false);
          return true;
        }
      }
      
      const fallbackLocation: LocationData = {
        latitude: 28.6139,
        longitude: 77.2090,
        city: cityName,
        state: "",
        country: "India",
      };
      setLocation(fallbackLocation);
      setPermissionStatus("granted");
      localStorage.setItem("stp_location", JSON.stringify(fallbackLocation));
      localStorage.setItem("stp_location_status", "granted");
      setShowManualSelectModal(false);
      toast.success(`Location set manually to ${cityName}!`);
      setIsSearchingCity(false);
      return true;
    } catch (err) {
      console.error("Geocoding manual input failed:", err);
      toast.error("Failed to search city coordinates. Please try again.");
      setIsSearchingCity(false);
      return false;
    }
  };

  const skipPermission = () => {
    setPermissionStatus("skipped");
    localStorage.setItem("stp_location_status", "skipped");
    setShowPermissionModal(false);
    toast.info("Location selection skipped. Calculations will use default coordinates.");
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        permissionStatus,
        showPermissionModal,
        showManualSelectModal,
        askForLocationPermission,
        setLocationManually,
        skipPermission,
        setShowPermissionModal,
        setShowManualSelectModal,
      }}
    >
      {children}

      {/* Geolocation Request Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 text-foreground transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <MapPin className="w-8 h-8 animate-bounce" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-center mb-2">Enable Live Location</h3>
            <p className="text-sm text-center text-muted-foreground mb-6 leading-relaxed">
              We use your current location to provide accurate travel routes, budget estimates, and nearby travel recommendations.
            </p>

            <div className="space-y-2.5">
              <Button 
                onClick={askForLocationPermission} 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-5"
                disabled={isLoading}
              >
                {isLoading ? "Fetching position..." : "Grant Location Permission"}
              </Button>
              
              <div className="grid grid-cols-2 gap-2.5">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPermissionModal(false);
                    setShowManualSelectModal(true);
                  }}
                  className="border-border hover:bg-muted text-foreground/80 font-medium py-5"
                >
                  Select City Manually
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={skipPermission}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground font-medium py-5"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual City Selector Modal */}
      {showManualSelectModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 text-foreground transform transition-all animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Select Current City</h3>
                <p className="text-xs text-muted-foreground">Type your city name to calculate distances and budgets.</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const success = await setLocationManually(manualCityQuery);
                if (success) {
                  setManualCityQuery("");
                }
              }}
              className="space-y-4"
            >
              <div className="relative">
                <Input
                  placeholder="e.g. Ahmedabad, Mumbai, London"
                  value={manualCityQuery}
                  onChange={(e) => setManualCityQuery(e.target.value)}
                  className="border-border bg-background text-foreground pl-10 h-11"
                  required
                  autoFocus
                />
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
              </div>

              <div className="flex gap-2.5 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowManualSelectModal(false)}
                  className="text-muted-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6"
                  disabled={isSearchingCity}
                >
                  {isSearchingCity ? "Searching..." : "Set Location"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export function useLocationData() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationData must be used within LocationProvider");
  }
  return context;
}
