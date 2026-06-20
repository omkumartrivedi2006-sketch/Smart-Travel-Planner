import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ChevronRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function TripPlanner() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Form states
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("2500");
  const [budgetLevel, setBudgetLevel] = useState("Mid-range");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelers, setTravelers] = useState("1");
  const [travelerType, setTravelerType] = useState("Solo");
  const [accommodation, setAccommodation] = useState("Hotel");

  // Read query parameters on mount to prefill destination
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destParam = params.get("destination");
    const budgetParam = params.get("budget");
    
    if (destParam) {
      setDestination(destParam);
    }
    if (budgetParam) {
      setBudget(budgetParam);
    }
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    // Step validation checks
    if (step === 1) {
      if (!destination.trim()) {
        toast.error("Please enter or select a destination");
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

  const handleSaveTrip = () => {
    if (!accommodation) {
      toast.error("Please select accommodation type");
      return;
    }

    // Build the new trip object
    const newTrip = {
      id: Date.now(), // Unique ID using timestamp
      name: `${destination} ${selectedInterests.includes("Beach") ? "Getaway" : "Adventure"}`,
      destination: destination.includes(",") ? destination : `${destination}, Travel`,
      startDate,
      endDate,
      budget: `₹${Number(budget).toLocaleString()}`,
      status: "Upcoming",
      travelers: Number(travelers),
      travelerType,
      accommodation,
      interests: selectedInterests,
    };

    // Save to localStorage
    const savedTrips = JSON.parse(localStorage.getItem("saved_trips") || "[]");
    localStorage.setItem("saved_trips", JSON.stringify([...savedTrips, newTrip]));

    toast.success("Trip planned and saved successfully!");
    setTimeout(() => {
      navigate("/saved-trips");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Plan Your Trip</h1>
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
                        ? "bg-teal-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 6 && (
                    <div
                      className={`h-1 w-12 mx-2 transition-all ${
                        s < step ? "bg-teal-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Steps */}
          <Card className="border-0 shadow-xl p-8 bg-white">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Destination</h2>
                  <p className="text-slate-600 mb-4">Where would you like to go?</p>
                </div>
                <Input
                  placeholder="Enter destination name..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-4">
                  {["Bali, Indonesia", "Swiss Alps", "Madrid, Spain", "Tokyo, Japan"].map((dest) => {
                    const isSelected = destination === dest;
                    return (
                      <Card
                        key={dest}
                        className={`border shadow-md p-4 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/50"
                            : "border-slate-100 hover:border-slate-300 hover:shadow-lg"
                        }`}
                        onClick={() => setDestination(dest)}
                      >
                        <p className="font-semibold text-slate-900">{dest.split(",")[0]}</p>
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
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Travel Dates</h2>
                  <p className="text-slate-600 mb-4">When do you want to travel?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
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
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Budget</h2>
                  <p className="text-slate-600 mb-4">What's your total budget?</p>
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
                            ? "border-teal-500 bg-teal-50/50"
                            : "border-slate-100 hover:border-slate-300 hover:shadow-lg"
                        }`}
                        onClick={() => {
                          setBudgetLevel(tier.label);
                          setBudget(tier.def);
                        }}
                      >
                        <p className="font-semibold text-slate-900">{tier.label}</p>
                        <p className="text-xs text-slate-600 mt-1">₹{tier.def}</p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Interests</h2>
                  <p className="text-slate-600 mb-4">What are you interested in?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Adventure", "Food", "Culture", "Shopping", "Beach", "Nature"].map((interest) => {
                    const isChecked = selectedInterests.includes(interest);
                    return (
                      <label
                        key={interest}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? "border-teal-500 bg-teal-50/30"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleInterest(interest)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span className="text-slate-900 font-medium">{interest}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Travelers</h2>
                  <p className="text-slate-600 mb-4">How many people are traveling?</p>
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
                            ? "border-teal-500 bg-teal-50/50"
                            : "border-slate-100 hover:border-slate-300 hover:shadow-lg"
                        }`}
                        onClick={() => {
                          setTravelerType(type);
                          if (type === "Solo") setTravelers("1");
                          else if (type === "Couple") setTravelers("2");
                          else if (type === "Family") setTravelers("4");
                          else if (type === "Friends") setTravelers("5");
                        }}
                      >
                        <p className="font-semibold text-slate-900">{type}</p>
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
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Accommodation</h2>
                  <p className="text-slate-600 mb-4">What type of accommodation?</p>
                </div>
                <div className="space-y-3">
                  {["Hotel", "Hostel", "Airbnb", "Resort", "Guesthouse"].map((type) => {
                    const isSelected = accommodation === type;
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/30"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accommodation"
                          checked={isSelected}
                          onChange={() => setAccommodation(type)}
                          className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                        />
                        <span className="text-slate-900 font-medium">{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8 pt-8 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex-1 border-slate-300 hover:bg-slate-50 text-slate-700"
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
            <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 text-xs px-1 sm:text-sm"
                onClick={() => navigate("/ai-recommendations")}
              >
                Get AI Help
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 text-xs px-1 sm:text-sm"
                onClick={() => navigate(`/budget-calculator?total=${budget}&duration=7`)}
              >
                Calculate Budget
              </Button>
              <Button
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 text-xs px-1 sm:text-sm"
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
