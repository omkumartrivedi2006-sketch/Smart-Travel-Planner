import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Search, Filter, Star, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function Destinations() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Parse query parameters and fetch database destinations
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const searchParam = queryParams.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    async function loadDestinations() {
      try {
        const res = await apiFetch("/api/destinations?limit=100");
        if (res && res.data && res.data.destinations) {
          const mapped = res.data.destinations.map((d: any) => ({
            id: d._id,
            name: d.name,
            country: d.country,
            category: d.category,
            budget: d.averageCost < 50 ? "Budget" : d.averageCost <= 150 ? "Mid-range" : "Premium",
            rating: d.rating || 4.5,
            image: d.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
          }));
          setDestinationsList(mapped);
        }
      } catch (err: any) {
        toast.error("Failed to load destinations: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadDestinations();
  }, []);

  // Real-time dynamic filtering using useMemo for performance optimization
  const filteredDestinations = useMemo(() => {
    return destinationsList.filter((dest) => {
      const matchesSearch =
        dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCats.length === 0 || selectedCats.includes(dest.category);

      const matchesBudget =
        selectedBudgets.length === 0 || selectedBudgets.includes(dest.budget);

      return matchesSearch && matchesCategory && matchesBudget;
    });
  }, [searchQuery, selectedCats, selectedBudgets, destinationsList]);

  const toggleCategory = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleBudget = (budget: string) => {
    setSelectedBudgets((prev) =>
      prev.includes(budget)
        ? prev.filter((b) => b !== budget)
        : [...prev, budget]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCats([]);
    setSelectedBudgets([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Explore Destinations</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md p-6 sticky top-24 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>
                {(selectedCats.length > 0 || selectedBudgets.length > 0 || searchQuery !== "") && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Category</label>
                  <div className="space-y-2">
                    {["Beach", "Adventure", "Cultural", "Food", "Shopping"].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCats.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-600">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Budget</label>
                  <div className="space-y-2">
                    {["Budget", "Mid-range", "Premium"].map((budget) => (
                      <label key={budget} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBudgets.includes(budget)}
                          onChange={() => toggleBudget(budget)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-600">{budget}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-8 flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search destinations by name, country, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* Results Status */}
            <div className="mb-4 text-sm text-slate-600 font-medium">
              Showing {filteredDestinations.length} destination{filteredDestinations.length === 1 ? "" : "s"}
            </div>

            {/* Destinations Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-lg text-slate-600 font-medium animate-pulse">Loading destinations...</p>
              </div>
            ) : filteredDestinations.length === 0 ? (
              <Card className="border-0 shadow-lg p-12 text-center bg-white">
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Destinations Found</h3>
                <p className="text-slate-600 mb-6">We couldn't find any destinations matching your current filters.</p>
                <Button onClick={clearFilters} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Reset Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredDestinations.map((dest) => (
                  <Card
                    key={dest.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white"
                    onClick={() => navigate(`/destinations/${dest.id}`)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-slate-900">
                        {dest.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{dest.name}</h4>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {dest.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-teal-600">{dest.budget}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                          <span className="text-sm font-semibold">{dest.rating}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/destinations/${dest.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
