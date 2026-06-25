import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ChevronRight, Check, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocationData } from "@/contexts/LocationContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

export default function TripPlanner() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { location: userLoc } = useLocationData();
  const [step, setStep] = useState(1);

  // Form states
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("2500");
  const [budgetLevel, setBudgetLevel] = useState("Mid-range");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelers, setTravelers] = useState("2");
  const [travelerType, setTravelerType] = useState("Couple");
  const [accommodation, setAccommodation] = useState("Hotel");
  const [destinationsList, setDestinationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch destinations and parse URL search parameters on mount
  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await apiFetch("/api/destinations?limit=100");
        if (res && res.data && res.data.destinations) {
          setDestinationsList(res.data.destinations);
          
          const params = new URLSearchParams(window.location.search);
          const destParam = params.get("destination");
          const budgetParam = params.get("budget");
          const travelersParam = params.get("travelers");
          const destIdParam = params.get("destinationId");

          if (destParam) setDestination(destParam);
          if (destIdParam) setDestinationId(destIdParam);
          if (budgetParam) setBudget(budgetParam);
          if (travelersParam) setTravelers(travelersParam);
        }
      } catch (e) {
        console.error("Failed to load destinations list", e);
      }
    }
    loadDestinations();
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!destination.trim()) {
        toast.error("Please enter or select a destination");
        return;
      }
      
      // Try to find matching destination record
      const endClean = destination.trim().toLowerCase();
      const matched = destinationsList.find(
        (d) => d.name.toLowerCase() === endClean || d.country.toLowerCase() === endClean
      ) || destinationsList.find(
        (d) => d.name.toLowerCase().includes(endClean) || d.country.toLowerCase().includes(endClean)
      );

      if (matched) {
        setDestinationId(matched._id);
        setDestination(matched.name);
      } else {
        toast.error("Please select a registered destination from our records (e.g. Goa, Bali, Madrid, etc.)");
        return;
      }
    } else if (step === 2) {
      if (!startDate) {
        toast.error("Please select a start date");
        return;
      }
      if (!endDate) {
        toast.error("Please select an end date");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        toast.error("End date must be after start date");
        return;
      }
    } else if (step === 3) {
      if (!budget || Number(budget) <= 0) {
        toast.error("Please enter a valid budget amount");
        return;
      }
    } else if (step === 5) {
      if (!travelers || Number(travelers) <= 0) {
        toast.error("Number of travelers must be 1 or more");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleSaveTrip = async () => {
    if (!accommodation) {
      toast.error("Please select accommodation type");
      return;
    }
    if (!destinationId) {
      toast.error("Please select a valid destination");
      return;
    }

    setIsLoading(true);
    try {
      // Map preferences to backend enums
      let hotelPref: "budget" | "mid-range" | "luxury" = "mid-range";
      const bLvl = budgetLevel.toLowerCase();
      if (bLvl === "budget") {
        hotelPref = "budget";
      } else if (bLvl === "premium" || bLvl === "luxury") {
        hotelPref = "luxury";
      }

      const matchedDest = destinationsList.find((d) => d._id === destinationId);
      const isInternational = matchedDest ? matchedDest.country.toLowerCase() !== "india" : false;
      const transPref: "car" | "train" | "flight" = isInternational ? "flight" : "car";

      await apiFetch("/api/trips", {
        method: "POST",
        body: JSON.stringify({
          destinationId,
          startDate,
          endDate,
          travelers: Number(travelers),
          hotelPreference: hotelPref,
          transportPreference: transPref,
          travelType: travelerType.toLowerCase(),
          originLatitude: userLoc?.latitude,
          originLongitude: userLoc?.longitude,
        }),
      });

      toast.success("Trip planned and saved successfully!");
      setTimeout(() => {
        navigate("/saved-trips");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to save trip. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground mb-4">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Plan Your Trip</h1>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      s <= step
                        ? "bg-teal-600 text-white shadow-md"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 6 && (
                    <div
                      className={`h-1 w-12 mx-2 transition-all rounded-full ${
                        s < step ? "bg-teal-600" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Steps */}
          <Card className="border border-border shadow-xl p-8 bg-card">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Select Destination</h2>
                  <p className="text-muted-foreground mb-4">Where would you like to go?</p>
                </div>
                <Input
                  placeholder="Enter destination name..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-4">
                  {destinationsList.slice(0, 4).map((dest) => {
                    const isSelected = destinationId === dest._id;
                    return (
                      <Card
                        key={dest._id}
                        className={`border shadow-md p-4 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-border hover:border-muted-foreground/40 hover:shadow-lg bg-card"
                        }`}
                        onClick={() => {
                          setDestination(dest.name);
                          setDestinationId(dest._id);
                        }}
                      >
                        <p className="font-semibold text-card-foreground">{dest.name}</p>
                        {isSelected && <Check className="w-5 h-5 text-teal-600" />}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Travel Dates</h2>
                  <p className="text-muted-foreground mb-4">When do you want to travel?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Budget</h2>
                  <p className="text-muted-foreground mb-4">What's your total budget?</p>
                </div>
                <Input
                  type="number"
                  placeholder="Enter budget amount"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Budget", def: "1200" },
                    { label: "Mid-range", def: "2500" },
                    { label: "Premium", def: "5000" },
                  ].map((tier) => {
                    const isSelected = budgetLevel === tier.label;
                    return (
                      <Card
                        key={tier.label}
                        className={`border shadow-md p-4 cursor-pointer text-center transition-all ${
                          isSelected
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-border hover:border-muted-foreground/40 hover:shadow-lg bg-card"
                        }`}
                        onClick={() => {
                          setBudgetLevel(tier.label);
                          setBudget(tier.def);
                        }}
                      >
                        <p className="font-semibold text-card-foreground">{tier.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">₹{tier.def}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Interests</h2>
                  <p className="text-muted-foreground mb-4">What are you interested in?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Adventure", "Food", "Culture", "Shopping", "Beach", "Nature"].map((interest) => {
                    const isChecked = selectedInterests.includes(interest);
                    return (
                      <label
                        key={interest}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleInterest(interest)}
                          className="w-4 h-4 text-teal-600 rounded border-border focus:ring-teal-500"
                        />
                        <span className="text-foreground font-medium">{interest}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Travelers</h2>
                  <p className="text-muted-foreground mb-4">How many people are traveling?</p>
                </div>
                <Input
                  type="number"
                  placeholder="Number of travelers"
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                />
                <div className="space-y-3">
                  {["Solo", "Couple", "Family", "Friends"].map((type) => {
                    const isSelected = travelerType === type;
                    return (
                      <Card
                        key={type}
                        className={`border shadow-md p-4 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-border hover:border-muted-foreground/40 hover:shadow-lg bg-card"
                        }`}
                        onClick={() => {
                          setTravelerType(type);
                          if (type === "Solo") setTravelers("1");
                          else if (type === "Couple") setTravelers("2");
                          else if (type === "Family") setTravelers("4");
                          else if (type === "Friends") setTravelers("5");
                        }}
                      >
                        <p className="font-semibold text-card-foreground">{type}</p>
                        {isSelected && <Check className="w-5 h-5 text-teal-600" />}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">Accommodation</h2>
                  <p className="text-muted-foreground mb-4">What type of accommodation?</p>
                </div>
                <div className="space-y-3">
                  {["Hotel", "Hostel", "Airbnb", "Resort", "Guesthouse"].map((type) => {
                    const isSelected = accommodation === type;
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accommodation"
                          checked={isSelected}
                          onChange={() => setAccommodation(type)}
                          className="w-4 h-4 text-teal-600 border-border focus:ring-teal-500"
                        />
                        <span className="text-foreground font-medium">{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8 pt-8 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex-1 border-border hover:bg-muted text-foreground"
              >
                Previous
              </Button>
              {step < 6 ? (
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleNext}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleSaveTrip}
                >
                  Save Trip
                </Button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted text-xs px-1 sm:text-sm"
                onClick={() => navigate("/ai-recommendations")}
              >
                Get AI Help
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted text-xs px-1 sm:text-sm"
                onClick={() => navigate(`/budget-calculator?total=${budget}&duration=7`)}
              >
                Calculate Budget
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted text-xs px-1 sm:text-sm"
                onClick={() => navigate(`/weather-forecast?destination=${encodeURIComponent(destination || "Bali")}`)}
              >
                Check Weather
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
