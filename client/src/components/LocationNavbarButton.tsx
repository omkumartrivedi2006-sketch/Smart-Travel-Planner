import { MapPin, Loader2 } from "lucide-react";
import { useLocationData } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";

export function LocationNavbarButton() {
  const { 
    location, 
    isLoading, 
    setShowManualSelectModal, 
    askForLocationPermission,
    permissionStatus 
  } = useLocationData();

  if (isLoading) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 bg-teal-500/5 dark:bg-teal-400/5 rounded-full px-3 py-1.5" 
        disabled
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
        <span>Locating...</span>
      </Button>
    );
  }

  if (location) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowManualSelectModal(true)}
        className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20 hover:border-teal-500/40 rounded-full px-3 py-1.5 transition-all font-semibold"
        title={`Current Location: ${location.city}, ${location.country}. Click to change.`}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="truncate max-w-[120px]">{location.city}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (permissionStatus === "denied" || permissionStatus === "skipped") {
          setShowManualSelectModal(true);
        } else {
          askForLocationPermission();
        }
      }}
      className="flex items-center gap-1.5 text-xs border-teal-600/30 text-teal-600 dark:text-teal-400 dark:border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-full px-3 py-1.5 transition-all font-semibold"
      title="Click to share your location and enable distance calculations"
    >
      <MapPin className="w-3.5 h-3.5" />
      <span>Set Location</span>
    </Button>
  );
}
