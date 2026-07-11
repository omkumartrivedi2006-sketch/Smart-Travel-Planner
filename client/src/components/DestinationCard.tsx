import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Star, MapPin, TrendingUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DestinationImage } from "@/components/DestinationImage";
import { useLocationData } from "@/contexts/LocationContext";
import { toast } from "sonner";

// --- Category emoji maps ---
const CATEGORY_FILTERS = [
  { label: "Beach", value: "beach", emoji: "🏖️" },
  { label: "Mountain", value: "mountain", emoji: "⛰️" },
  { label: "City", value: "city", emoji: "🏙️" },
  { label: "Heritage", value: "heritage", emoji: "🏛️" },
  { label: "Nature", value: "nature", emoji: "🌿" },
  { label: "Adventure", value: "adventure", emoji: "🧗" },
  { label: "Culture", value: "culture", emoji: "🎭" },
  { label: "Food", value: "food", emoji: "🍜" },
  { label: "Shopping", value: "shopping", emoji: "🛍️" },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface DestinationCardProps {
  dest: {
    id?: string | number;
    _id?: string | number;
    slug?: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    category?: string;
    categories?: string[];
    image?: string;
    images?: string[];
    description?: string;
    shortDescription?: string;
    rating?: number;
    averageCost?: number;
    averageBudget?: number;
    budget?: string;
    score?: number; // for AI recommendations
    reason?: string; // for AI recommendations
    budgetRange?: string; // for Chat responses
    bestTime?: string; // for Chat responses
    tags?: string[]; // for Chat responses
    latitude?: number;
    longitude?: number;
  };
  variant?: "home" | "search" | "ai" | "chat" | "wishlist";
  index?: number;
}

export function DestinationCard({ dest, variant = "search", index }: DestinationCardProps) {
  const [, navigate] = useLocation();
  const { location: userLoc } = useLocationData();
  const [isSaved, setIsSaved] = useState(false);

  // Sync wishlist status locally
  useEffect(() => {
    const checkSaved = () => {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setIsSaved(wishlist.includes(dest.name));
    };
    checkSaved();
    window.addEventListener("storage", checkSaved);
    return () => window.removeEventListener("storage", checkSaved);
  }, [dest.name]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    let next: string[];
    if (isSaved) {
      next = wishlist.filter((item: string) => item !== dest.name);
      toast.success(`${dest.name} removed from wishlist`);
    } else {
      next = [...wishlist, dest.name];
      toast.success(`${dest.name} added to wishlist!`);
    }
    localStorage.setItem("wishlist", JSON.stringify(next));
    window.dispatchEvent(new Event("storage"));
  };

  // Standardize the ID
  const destinationId = dest._id || dest.id;

  const handleNavigate = () => {
    navigate(`/destinations/${destinationId}`);
  };

  // Distance tracking (search variant)
  const distanceText = useMemo(() => {
    if (!userLoc || dest.latitude === undefined || dest.longitude === undefined) return null;
    const dist = calculateDistance(userLoc.latitude, userLoc.longitude, dest.latitude, dest.longitude);
    return `${Math.round(dist).toLocaleString()} km`;
  }, [userLoc, dest.latitude, dest.longitude]);

  // Image source normalization
  const imageSrc = dest.image || (dest.images && dest.images[0]) || "";

  // Category normalization
  const primaryCategory = dest.category || (dest.categories && dest.categories[0]) || "City";
  const allCategories = dest.categories || (dest.category ? [dest.category] : ["City"]);

  // Budget Tier calculation
  const budgetTier = useMemo(() => {
    if (dest.budget) return dest.budget;
    const cost = dest.averageBudget || dest.averageCost || 0;
    if (cost === 0) return "Mid-range";
    if (cost <= 5000) return "Budget";
    if (cost <= 10000) return "Mid-range";
    return "Premium";
  }, [dest.budget, dest.averageBudget, dest.averageCost]);

  // RENDER: Popular Destinations / Home Card
  if (variant === "home") {
    const displayName = dest.country && dest.name.includes(dest.country)
      ? dest.name
      : `${dest.name}${dest.country ? `, ${dest.country}` : ""}`;

    return (
      <Card
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-border bg-card group"
        onClick={handleNavigate}
      >
        <div className="relative h-48 overflow-hidden">
          <DestinationImage
            src={imageSrc}
            alt={dest.name}
            name={dest.name}
            category={primaryCategory}
            id={destinationId}
            country={dest.country}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-white">
            {primaryCategory}
          </div>
        </div>
        <div className="p-6">
          <h4 className="text-xl font-bold text-card-foreground mb-2">{displayName}</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-semibold">{budgetTier}</span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-orange-400 text-orange-400"
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // RENDER: Search Results / Browse Grid Card
  if (variant === "search") {
    return (
      <div
        onClick={handleNavigate}
        className="group rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-border hover:-translate-y-1"
        style={index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
      >
        <div className="relative h-48 overflow-hidden">
          <DestinationImage
            src={imageSrc}
            alt={dest.name}
            name={dest.name}
            category={primaryCategory}
            id={destinationId}
            country={dest.country}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Category badge */}
          <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[60%]">
            {allCategories.slice(0, 2).map((cat) => {
              const cf = CATEGORY_FILTERS.find((c) => c.value === cat.toLowerCase());
              return (
                <span
                  key={cat}
                  className="bg-background/90 backdrop-blur-sm text-foreground border border-border text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm"
                >
                  {cf ? `${cf.emoji} ${cf.label}` : cat}
                </span>
              );
            })}
          </div>
          {/* Budget badge */}
          <div className="absolute bottom-3 left-3">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                budgetTier === "Budget"
                  ? "bg-emerald-500/90 text-white"
                  : budgetTier === "Mid-range"
                  ? "bg-amber-500/90 text-white"
                  : "bg-purple-500/90 text-white"
              }`}
            >
              {budgetTier}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
              {dest.name}
            </h4>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-card-foreground">
                {(dest.rating || 4.5).toFixed(1)}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-between gap-1 mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
              {dest.country}
            </span>
            {distanceText && (
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded shrink-0 animate-in fade-in duration-350">
                📍 {distanceText}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            {dest.description || dest.shortDescription}
          </p>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm transition-all duration-200 hover:shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    );
  }

  // RENDER: AI recommendations Landscape Card
  if (variant === "ai") {
    return (
      <Card
        className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-card text-card-foreground"
        onClick={handleNavigate}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Image */}
          <div className="md:col-span-1 h-48 md:h-auto overflow-hidden bg-muted relative">
            <DestinationImage
              src={imageSrc}
              alt={dest.name}
              name={dest.name}
              category={primaryCategory}
              id={destinationId}
              country={dest.country}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1 text-foreground">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {dest.rating || 4.5}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-2 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4 gap-2">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{dest.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    {dest.country} • {primaryCategory} Category
                  </p>
                </div>
                {dest.score !== undefined && (
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 mb-1 justify-end">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      <span className="text-3xl font-bold text-orange-500">{dest.score}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">Match Score</p>
                  </div>
                )}
              </div>

              {dest.reason && (
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-foreground/80 mb-1">Why This Destination?</p>
                  <p className="text-foreground/80 text-sm leading-relaxed">{dest.reason}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate();
                }}
              >
                View Details
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/planner?destination=${encodeURIComponent(dest.name)}&budget=${dest.averageBudget || dest.averageCost || 7500}&travelers=2&destinationId=${destinationId}`);
                }}
              >
                Plan Trip
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // RENDER: Chat Assistant Mini Card
  if (variant === "chat") {
    return (
      <Card
        className="border border-border bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
        onClick={handleNavigate}
      >
        <div className="h-32 overflow-hidden relative">
          <DestinationImage
            src={imageSrc}
            alt={dest.name}
            name={dest.name}
            category={primaryCategory}
            id={destinationId}
            country={dest.country}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-foreground border border-border shadow-xs">
            {primaryCategory}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {dest.name}
            </h4>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {dest.rating || 4.5}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {dest.description || dest.shortDescription}
          </p>
          <div className="text-[11px] font-semibold text-muted-foreground bg-muted/65 p-2 rounded">
            <div>💰 Budget: <span className="text-primary font-bold">{dest.budgetRange || budgetTier}</span></div>
            <div>🌤️ Best Time: <span className="text-foreground">{dest.bestTime || "October - March"}</span></div>
          </div>
          {dest.tags && dest.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dest.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-xs h-8 mt-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/planner?destination=${encodeURIComponent(dest.name)}`);
            }}
          >
            Plan Trip Here
          </Button>
        </div>
      </Card>
    );
  }

  // RENDER: Saved Destinations / Wishlist Card
  if (variant === "wishlist") {
    return (
      <Card
        className="border border-border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all bg-card hover:bg-muted text-card-foreground"
        onClick={handleNavigate}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">{dest.name}</p>
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
        </div>
      </Card>
    );
  }

  return null;
}
