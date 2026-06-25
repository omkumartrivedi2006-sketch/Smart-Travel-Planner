import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Filter, Star, MapPin, Sun, Moon, X, Clock, TrendingUp, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { WORLD_CITIES, getPopularDestinations, type WorldCity } from "@/data/worldCities";
import { fuzzySearch, getSuggestions } from "@/lib/fuzzySearch";
import { useLocationData } from "@/contexts/LocationContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalizedDestination {
  id: string;
  name: string;
  country: string;
  categories: string[];
  budget: "Budget" | "Mid-range" | "Premium";
  rating: number;
  image: string;
  description: string;
  source: "db" | "local";
  latitude?: number;
  longitude?: number;
}

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

// ─── Category config — UI labels map to lowercase category tags ───────────────

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

const BUDGET_FILTERS = ["Budget", "Mid-range", "Premium"] as const;

const RECENT_SEARCHES_KEY = "stp_recent_searches";
const MAX_RECENT = 5;

// ─── Helper utilities ─────────────────────────────────────────────────────────

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (!query.trim()) return;
  const prev = getRecentSearches().filter((s) => s !== query);
  const next = [query, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function removeRecentSearch(query: string) {
  const next = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function getBudgetFromCost(cost: number): "Budget" | "Mid-range" | "Premium" {
  if (cost < 50) return "Budget";
  if (cost <= 150) return "Mid-range";
  return "Premium";
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-9 bg-muted rounded-lg mt-4" />
      </div>
    </div>
  );
}

// ─── Destination Card ─────────────────────────────────────────────────────────

function DestinationCard({
  dest,
  onClick,
  index,
}: {
  dest: NormalizedDestination;
  onClick: () => void;
  index: number;
}) {
  const { location: userLoc } = useLocationData();
  const [imgError, setImgError] = useState(false);

  const distanceText = useMemo(() => {
    if (!userLoc || dest.latitude === undefined || dest.longitude === undefined) return null;
    const dist = calculateDistance(userLoc.latitude, userLoc.longitude, dest.latitude, dest.longitude);
    return `${Math.round(dist).toLocaleString()} km`;
  }, [userLoc, dest.latitude, dest.longitude]);

  return (
    <div
      onClick={onClick}
      className="group rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-border hover:-translate-y-1"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imgError ? "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800" : dest.image}
          alt={dest.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)}
        />
        {/* Category badge */}
        <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[60%]">
          {dest.categories.slice(0, 2).map((cat) => {
            const cf = CATEGORY_FILTERS.find((c) => c.value === cat);
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
              dest.budget === "Budget"
                ? "bg-emerald-500/90 text-white"
                : dest.budget === "Mid-range"
                ? "bg-amber-500/90 text-white"
                : "bg-purple-500/90 text-white"
            }`}
          >
            {dest.budget}
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
            <span className="text-sm font-semibold text-card-foreground">{dest.rating.toFixed(1)}</span>
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
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{dest.description}</p>
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm transition-all duration-200 hover:shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function Destinations() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);

  // Data state
  const [dbDestinations, setDbDestinations] = useState<NormalizedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Parse URL search param ───────────────────────────────────────────────
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const searchParam = queryParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
      setDebouncedQuery(searchParam);
    }
  }, []);

  // ─── Debounce search query ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Fetch DB destinations ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await apiFetch("/api/destinations?limit=200");
        if (res?.data?.destinations) {
          const mapped: NormalizedDestination[] = res.data.destinations.map((d: any) => ({
            id: d._id,
            name: d.name,
            country: d.country,
            categories: Array.isArray(d.categories) && d.categories.length > 0
              ? d.categories
              : [d.category?.toLowerCase() || "city"],
            budget: getBudgetFromCost(d.averageCost),
            rating: d.rating || 4.5,
            image: d.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            description: d.description || "",
            source: "db" as const,
            latitude: d.latitude,
            longitude: d.longitude,
          }));
          setDbDestinations(mapped);
        }
      } catch {
        // DB unavailable — gracefully fall back to local dataset only
        toast.info("Using offline destination data.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDestinations();
  }, []);

  // ─── Merged dataset (DB takes priority; local fills gaps) ─────────────────
  const allDestinations = useMemo<NormalizedDestination[]>(() => {
    const dbNames = new Set(dbDestinations.map((d) => d.name.toLowerCase()));

    const localMapped: NormalizedDestination[] = WORLD_CITIES
      .filter((c) => !dbNames.has(c.name.toLowerCase()))
      .map((c) => ({
        id: c.id,
        name: c.name,
        country: c.country,
        categories: c.categories,
        budget: c.budget,
        rating: c.rating,
        image: c.image,
        description: c.description,
        source: "local" as const,
      }));

    return [...dbDestinations, ...localMapped];
  }, [dbDestinations]);

  // ─── Autocomplete suggestions ──────────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    return getSuggestions(
      searchQuery,
      allDestinations,
      (d) => d.name,
      (d) => d.country,
      8
    );
  }, [searchQuery, allDestinations]);

  // ─── Filtered destinations ─────────────────────────────────────────────────
  const filteredDestinations = useMemo(() => {
    let results: NormalizedDestination[];

    if (debouncedQuery.trim().length >= 1) {
      // Use fuzzy search to get ranked results
      const searchResults = fuzzySearch(
        debouncedQuery,
        allDestinations,
        (d) => d.name,
        (d) => d.country,
        200
      );
      results = searchResults.map((r) => r.item);
    } else {
      results = allDestinations;
    }

    // Apply category filter
    if (selectedCats.length > 0) {
      results = results.filter((dest) =>
        dest.categories.some((cat) => selectedCats.includes(cat))
      );
    }

    // Apply budget filter
    if (selectedBudgets.length > 0) {
      results = results.filter((dest) => selectedBudgets.includes(dest.budget));
    }

    return results;
  }, [debouncedQuery, selectedCats, selectedBudgets, allDestinations]);

  // ─── "Did you mean?" suggestions for empty results ────────────────────────
  const didYouMean = useMemo(() => {
    if (filteredDestinations.length > 0 || !debouncedQuery.trim()) return [];
    // Ignore filters — search the full dataset for fuzzy matches
    return fuzzySearch(debouncedQuery, allDestinations, (d) => d.name, (d) => d.country, 3).map(
      (r) => r.item
    );
  }, [filteredDestinations.length, debouncedQuery, allDestinations]);

  // ─── Popular destinations for empty state ─────────────────────────────────
  const popularDestinations = useMemo<NormalizedDestination[]>(() => {
    const pop = getPopularDestinations(8);
    return pop.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      categories: c.categories,
      budget: c.budget,
      rating: c.rating,
      image: c.image,
      description: c.description,
      source: "local" as const,
    }));
  }, []);

  // ─── Click-outside to close suggestions ───────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSuggestionIndex(-1);
    setShowSuggestions(true);
  }, []);

  const handleSelectSuggestion = useCallback(
    (name: string) => {
      setSearchQuery(name);
      setDebouncedQuery(name);
      setShowSuggestions(false);
      addRecentSearch(name);
      setRecentSearches(getRecentSearches());
    },
    []
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setRecentSearches(getRecentSearches());
    }
    setShowSuggestions(false);
  }, [searchQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (suggestionIndex >= 0 && suggestions[suggestionIndex]) {
          handleSelectSuggestion(suggestions[suggestionIndex].item.name);
        } else {
          handleSearchSubmit();
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setSuggestionIndex(-1);
      }
    },
    [showSuggestions, suggestions, suggestionIndex, handleSelectSuggestion, handleSearchSubmit]
  );

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const toggleBudget = useCallback((budget: string) => {
    setSelectedBudgets((prev) =>
      prev.includes(budget) ? prev.filter((b) => b !== budget) : [...prev, budget]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedCats([]);
    setSelectedBudgets([]);
  }, []);

  const navigateToDestination = useCallback(
    (dest: NormalizedDestination) => {
      if (dest.source === "db") {
        navigate(`/destinations/${dest.id}`);
      } else {
        // For local destinations not in DB, navigate to a search-friendly URL
        navigate(`/destinations?search=${encodeURIComponent(dest.name)}`);
      }
    },
    [navigate]
  );

  const hasActiveFilters = selectedCats.length > 0 || selectedBudgets.length > 0 || searchQuery !== "";
  const showEmptyState = !isLoading && filteredDestinations.length === 0;
  const showResults = !isLoading && filteredDestinations.length > 0;
  const showPopular = !isLoading && !debouncedQuery && selectedCats.length === 0 && selectedBudgets.length === 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-500 hover:text-teal-600 -ml-2 mb-1">
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Explore <span className="text-teal-600">Destinations</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">
              {allDestinations.length.toLocaleString()}+ destinations
            </span>
            <LocationNavbarButton />
            {toggleTheme && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* ── Search Bar ── */}
        <div ref={searchRef} className="relative mb-6 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder='Search any city worldwide — try "Vad", "Lon", "Mumb"...'
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-10 h-12 text-sm rounded-xl border-border bg-card text-card-foreground shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setDebouncedQuery(""); setShowSuggestions(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearchSubmit}
              className="h-12 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <Search className="w-4 h-4" />
            </Button>
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters((f) => !f)}
              className="h-12 px-4 rounded-xl lg:hidden border-border bg-card text-card-foreground relative"
            >
              <Filter className="w-4 h-4" />
              {(selectedCats.length > 0 || selectedBudgets.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {selectedCats.length + selectedBudgets.length}
                </span>
              )}
            </Button>
          </div>

          {/* ── Autocomplete Dropdown ── */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card text-card-foreground rounded-xl shadow-xl border border-border overflow-hidden z-50 max-h-96 overflow-y-auto">
              {/* Recent searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Recent
                    </span>
                    <button
                      onClick={() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecentSearches([]); }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted text-sm text-foreground transition-colors"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {s}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(s);
                          setRecentSearches(getRecentSearches());
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                  <div className="border-t border-border" />
                </div>
              )}

              {/* Search suggestions */}
              {searchQuery.length >= 2 && suggestions.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Suggestions
                    </span>
                  </div>
                  {suggestions.map((s, idx) => (
                    <button
                      key={s.item.id}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        idx === suggestionIndex
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onMouseEnter={() => setSuggestionIndex(idx)}
                      onClick={() => handleSelectSuggestion(s.item.name)}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-left">
                        <span
                          dangerouslySetInnerHTML={{ __html: s.highlightedName }}
                          className="[&>mark]:bg-primary/20 [&>mark]:text-primary [&>mark]:rounded [&>mark]:px-0.5 font-medium"
                        />
                        <span className="text-xs text-muted-foreground ml-2">{s.item.country}</span>
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{s.matchType}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No suggestions message */}
              {searchQuery.length >= 2 && suggestions.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No suggestions for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Active filter chips ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4 max-w-2xl mx-auto">
            {searchQuery && (
              <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 border border-primary/20">
                🔍 "{searchQuery}"
                <button onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}>
                  <X className="w-3 h-3 ml-1 hover:text-primary/80" />
                </button>
              </span>
            )}
            {selectedCats.map((cat) => {
              const cf = CATEGORY_FILTERS.find((c) => c.value === cat);
              return (
                <span key={cat} className="bg-secondary/10 text-secondary text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 border border-secondary/20">
                  {cf?.emoji} {cf?.label || cat}
                  <button onClick={() => toggleCategory(cat)}>
                    <X className="w-3 h-3 ml-1 hover:text-secondary/80" />
                  </button>
                </span>
              );
            })}
            {selectedBudgets.map((b) => (
              <span key={b} className="bg-accent/10 text-accent-foreground dark:text-accent text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 border border-accent/20">
                💰 {b}
                <button onClick={() => toggleBudget(b)}>
                  <X className="w-3 h-3 ml-1 hover:opacity-80" />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline font-semibold"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Sidebar Filters ── */}
          <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
            <Card className="border border-border shadow-sm p-5 sticky top-24 bg-card text-card-foreground rounded-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-primary" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Category filters */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORY_FILTERS.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => toggleCategory(cat.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                          selectedCats.includes(cat.value)
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/40 text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget filters */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Budget
                  </label>
                  <div className="space-y-2">
                    {BUDGET_FILTERS.map((budget) => (
                      <label
                        key={budget}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBudgets.includes(budget)}
                          onChange={() => toggleBudget(budget)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-border bg-card"
                        />
                        <span className={`text-sm transition-colors ${
                          selectedBudgets.includes(budget)
                            ? "text-primary font-medium"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}>
                          {budget === "Budget" ? "💚 " : budget === "Mid-range" ? "🟡 " : "💜 "}
                          {budget}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-3">
            {/* Results count */}
            {!isLoading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {showPopular ? (
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Popular destinations
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">
                        {filteredDestinations.length.toLocaleString()}
                      </span>{" "}
                      destination{filteredDestinations.length !== 1 ? "s" : ""} found
                      {debouncedQuery && (
                        <span className="text-muted-foreground"> for "{debouncedQuery}"</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Popular Destinations (when no search/filter active) */}
            {showPopular && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {popularDestinations.map((dest, i) => (
                    <DestinationCard
                      key={dest.id}
                      dest={dest}
                      onClick={() => navigateToDestination(dest)}
                      index={i}
                    />
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground text-sm mb-4">
                    Search or filter to explore all {allDestinations.length.toLocaleString()}+ destinations worldwide
                  </p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {showResults && !showPopular && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredDestinations.map((dest, i) => (
                  <DestinationCard
                    key={dest.id}
                    dest={dest}
                    onClick={() => navigateToDestination(dest)}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {showEmptyState && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 border border-border">
                  <AlertCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No destinations found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  We couldn't find destinations matching{" "}
                  {debouncedQuery && <strong>"{debouncedQuery}"</strong>}
                  {selectedCats.length > 0 && ` with the selected categories`}.
                </p>

                {/* Did you mean? */}
                {didYouMean.length > 0 && (
                  <div className="mb-8">
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1 justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Did you mean?
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {didYouMean.map((dest) => (
                        <button
                          key={dest.id}
                          onClick={() => handleSelectSuggestion(dest.name)}
                          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors border border-primary/20"
                        >
                          📍 {dest.name}, {dest.country}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={clearFilters}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6"
                >
                  Reset all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
