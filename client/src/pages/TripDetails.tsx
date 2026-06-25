import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Calendar, IndianRupee, MapPin, Download, Share2, Edit2, ShieldAlert, Loader2, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { jsPDF } from "jspdf";

interface Trip {
  _id: string;
  destination: {
    _id: string;
    name: string;
    description: string;
    country: string;
    category: string;
  };
  startDate: string;
  endDate: string;
  travelers: number;
  hotelPreference: string;
  transportPreference: string;
  travelType: string;
  budget?: {
    _id: string;
    hotelCost: number;
    foodCost: number;
    transportCost: number;
    activitiesCost: number;
    miscellaneousCost: number;
    totalEstimate: number;
  };
  itinerary?: {
    day: number;
    activities: {
      time: string;
      activity: string;
      description: string;
      cost: number;
    }[];
  }[];
}

export default function TripDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const id = params.id;
  const { theme, toggleTheme } = useTheme();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadTripDetails() {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await apiFetch(`/api/trips/${id}`);
        if (res && res.data && res.data.trip) {
          const tripData = res.data.trip;
          setTrip(tripData);
          
          // Fetch live weather for the destination
          if (tripData.destination?.name) {
            try {
              const weatherRes = await apiFetch(`/api/weather/${encodeURIComponent(tripData.destination.name)}`);
              if (weatherRes && weatherRes.data && weatherRes.data.weather && weatherRes.data.weather.forecast) {
                setWeatherForecast(weatherRes.data.weather.forecast);
              }
            } catch (wErr) {
              console.error("Failed to load weather for trip destination", wErr);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch trip details", err);
        toast.error("Could not fetch trip details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTripDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <Loader2 className="w-16 h-16 text-teal-650 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground animate-pulse">Loading Trip Details...</h2>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Trip Not Found</h2>
        <p className="text-muted-foreground mb-6">The trip details you are looking for do not exist or you lack permission to view them.</p>
        <Button onClick={() => navigate("/saved-trips")} className="bg-teal-600 hover:bg-teal-700 text-white">
          Back to My Trips
        </Button>
      </div>
    );
  }

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const numericBudget = trip.budget?.totalEstimate || 0;

  // Budget Breakdown values
  const budgetBreakdown = [
    { category: "Accommodation", amount: trip.budget?.hotelCost || 0, color: "bg-teal-600" },
    { category: "Food & Dining", amount: trip.budget?.foodCost || 0, color: "bg-teal-500" },
    { category: "Transportation", amount: trip.budget?.transportCost || 0, color: "bg-cyan-500" },
    { category: "Activities", amount: trip.budget?.activitiesCost || 0, color: "bg-emerald-500" },
    { category: "Miscellaneous", amount: trip.budget?.miscellaneousCost || 0, color: "bg-slate-400" },
  ].map(item => ({
    ...item,
    percentage: numericBudget > 0 ? Math.round((item.amount / numericBudget) * 100) : 0,
    amountStr: `₹${Math.round(item.amount).toLocaleString()}`,
  }));

  const handleExport = async () => {
    if (!trip) return;
    setIsExporting(true);
    toast.info("Generating PDF, please wait...");
    
    try {
      // Create new jsPDF instance (A4 size: 210 x 297 mm)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      let yPos = 20;

      // Draw header and footer
      const drawHeaderFooter = (pageNum: number) => {
        // Header line & text
        doc.setDrawColor(13, 148, 136); // Teal primary
        doc.setLineWidth(0.8);
        doc.line(margin, 15, pageWidth - margin, 15);
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(13, 148, 136);
        doc.text("SMART TRAVEL PLANNER", margin, 12);
        
        // Footer line & text
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Generated Plan - ${new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}`, margin, pageHeight - 10);
        doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      };

      // Set up page 1
      let currentPage = 1;
      drawHeaderFooter(currentPage);

      // Document Title
      yPos = 28;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text("TRIP ITINERARY", margin, yPos);

      // Destination Name
      yPos += 9;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text(`${trip.destination.name.toUpperCase()}, ${trip.destination.country.toUpperCase()}`, margin, yPos);

      // Horizontal separator line
      yPos += 5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      // Summary details block
      yPos += 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Trip Summary", margin, yPos);

      yPos += 7;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // Slate-700
      
      const startStr = new Date(trip.startDate).toLocaleDateString("en-US", { dateStyle: "medium" });
      const endStr = new Date(trip.endDate).toLocaleDateString("en-US", { dateStyle: "medium" });
      
      doc.text(`Dates: ${startStr} - ${endStr} (${durationDays} Days)`, margin, yPos);
      doc.text(`Travelers: ${trip.travelers || 1} Person(s) (${trip.travelType || "Solo"})`, margin + 85, yPos);
      
      yPos += 5.5;
      doc.text(`Hotel Rating: ${trip.hotelPreference || "Mid-range"}`, margin, yPos);
      doc.text(`Transport Preference: ${trip.transportPreference || "Car"}`, margin + 85, yPos);

      // Budget Breakdown section
      yPos += 11;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Estimated Budget Details (INR)", margin, yPos);

      // Draw budget breakdown card
      yPos += 6;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 38, 2, 2, "FD");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600

      const colA = margin + 6;
      const colB = margin + 86;
      let textY = yPos + 7;

      doc.text(`Accommodation: INR Rs. ${(trip.budget?.hotelCost || 0).toLocaleString()}`, colA, textY);
      doc.text(`Food & Dining: INR Rs. ${(trip.budget?.foodCost || 0).toLocaleString()}`, colB, textY);

      textY += 6;
      doc.text(`Transportation: INR Rs. ${(trip.budget?.transportCost || 0).toLocaleString()}`, colA, textY);
      doc.text(`Activities & Tours: INR Rs. ${(trip.budget?.activitiesCost || 0).toLocaleString()}`, colB, textY);

      textY += 6;
      doc.text(`Miscellaneous: INR Rs. ${(trip.budget?.miscellaneousCost || 0).toLocaleString()}`, colA, textY);

      // Total Estimate
      textY += 9;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text(`Total Budget Estimate: INR Rs. ${numericBudget.toLocaleString()}`, colA, textY);

      yPos += 48;

      // Day-wise Itinerary
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Day-by-Day Itinerary", margin, yPos);
      
      yPos += 8;

      if (trip.itinerary && trip.itinerary.length > 0) {
        trip.itinerary.forEach((dayData, index) => {
          const currentDay = new Date(start);
          currentDay.setDate(start.getDate() + index);
          const dayName = currentDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          
          // Page break check before starting a new Day
          if (yPos > pageHeight - 40) {
            doc.addPage();
            currentPage++;
            drawHeaderFooter(currentPage);
            yPos = 25;
          }

          // Day Header
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(13, 148, 136);
          doc.text(`Day ${dayData.day || index + 1} - ${dayName}`, margin, yPos);
          
          yPos += 5.5;

          if (dayData.activities && dayData.activities.length > 0) {
            dayData.activities.forEach((act: any) => {
              const timeText = act.time || "Flexible";
              const actName = act.activity || "";
              const costText = act.cost > 0 ? ` (Est. Cost: INR Rs. ${act.cost})` : "";
              const actHeader = `${timeText} - ${actName}${costText}`;
              const desc = act.description || "";

              // Split description text to fit PDF width bounds
              const splitDesc = doc.splitTextToSize(desc, pageWidth - 2 * margin - 10);
              
              // Calculate estimated space required for this activity
              const requiredHeight = 4.5 + (splitDesc.length * 4) + 3;

              // Page break check for activity block
              if (yPos > pageHeight - requiredHeight - 15) {
                doc.addPage();
                currentPage++;
                drawHeaderFooter(currentPage);
                yPos = 25;

                // Continuity day header
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(10.5);
                doc.setTextColor(13, 148, 136);
                doc.text(`Day ${dayData.day || index + 1} - ${dayName} (Continued)`, margin, yPos);
                yPos += 5.5;
              }

              // Draw time & activity title
              doc.setFont("Helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(51, 65, 85);
              doc.text(actHeader, margin + 4, yPos);

              // Draw a small vertical indicator line
              doc.setDrawColor(204, 251, 241); // teal-100
              doc.setLineWidth(0.6);
              doc.line(margin + 1, yPos - 3, margin + 1, yPos + splitDesc.length * 4);

              yPos += 4.5;

              // Draw description text
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(100, 116, 139);
              splitDesc.forEach((line: string) => {
                doc.text(line, margin + 4, yPos);
                yPos += 4;
              });

              yPos += 2; // minor gap between activities
            });
          } else {
            doc.setFont("Helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text("No activities scheduled for this day.", margin + 4, yPos);
            yPos += 6;
          }

          yPos += 5; // spacing between days
        });
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text("No itinerary activities found for this trip.", margin, yPos);
      }

      // Download file to device
      const cleanDestName = trip.destination.name.replace(/\s+/g, "_");
      doc.save(`Trip_Plan_${cleanDestName}.pdf`);
      toast.success("Itinerary exported as PDF successfully!");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link to this trip itinerary copied to clipboard!");
  };

  const handleEdit = () => {
    navigate(`/planner?destination=${encodeURIComponent(trip.destination.name)}&budget=${numericBudget}&travelers=${trip.travelers}`);
  };

  const now = new Date();
  const tripStatus = end < now ? "Completed" : "Upcoming";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/saved-trips")} className="text-muted-foreground mb-2 flex items-center gap-1">
              ← Back to My Trips
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Trip Details</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Trip Header */}
            <Card className="border border-border shadow-lg p-8 mb-8 bg-card text-card-foreground">
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-bold text-foreground mb-2">Trip to {trip.destination.name}</h2>
                  <p className="text-lg text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {trip.destination.name}, {trip.destination.country || ""}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  tripStatus === "Upcoming"
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-green-500/10 text-green-600"
                }`}>
                  {tripStatus}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{durationDays} Days</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Budget</p>
                  <p className="text-xl sm:text-2xl font-bold text-teal-600">₹{numericBudget.toLocaleString()}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Travelers</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{trip.travelers || 1} Person{trip.travelers > 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
                  onClick={handleEdit}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Trip
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted min-w-[100px]">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  onClick={handleExport} 
                  variant="outline" 
                  disabled={isExporting}
                  className="flex-1 border-border text-foreground hover:bg-muted min-w-[100px]"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </div>
            </Card>

            {/* Itinerary */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Itinerary</h3>
              <div className="space-y-4">
                {trip.itinerary && trip.itinerary.length > 0 ? (
                  trip.itinerary.map((dayData, index) => {
                    const currentDay = new Date(start);
                    currentDay.setDate(start.getDate() + index);
                    const dayName = currentDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    
                    return (
                      <Card key={index} className="border border-border shadow-md p-6 bg-card text-card-foreground">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                          <h4 className="text-lg font-bold text-foreground">Day {dayData.day || index + 1}</h4>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-teal-600" />
                            {dayName}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {dayData.activities && dayData.activities.map((act: any, actIdx: number) => (
                            <div key={actIdx} className="flex items-start gap-3 border-l-2 border-teal-500 pl-3 py-1">
                              <div className="min-w-[70px] text-xs font-semibold text-muted-foreground">{act.time}</div>
                              <div>
                                <h5 className="font-bold text-foreground text-sm">{act.activity}</h5>
                                <p className="text-muted-foreground text-xs mt-1">{act.description}</p>
                                {act.cost > 0 && (
                                  <span className="inline-block bg-teal-500/10 text-teal-500 text-[10px] font-semibold px-2 py-0.5 rounded mt-1">
                                    Est. Cost: ₹{act.cost}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="border border-border shadow-md p-6 text-center bg-card text-muted-foreground">
                    No itinerary activities found for this trip.
                  </Card>
                )}
              </div>
            </div>

            {/* Budget Breakdown */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Budget Breakdown</h3>
              <Card className="border border-border shadow-md p-6 bg-card text-card-foreground">
                <div className="space-y-4">
                  {budgetBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{item.category}</span>
                        <span className="font-bold text-foreground">{item.amountStr}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Weather */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Weather Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {weatherForecast && weatherForecast.length > 0 ? (
                  weatherForecast.map((dayForecast, index) => {
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const d = new Date(dayForecast.date);
                    const dayLabel = days[d.getDay()];
                    
                    let icon = "☀️";
                    const cond = dayForecast.condition.toLowerCase();
                    if (cond.includes("rain") || cond.includes("shower") || cond.includes("drizzle")) {
                      icon = "🌧️";
                    } else if (cond.includes("cloud") || cond.includes("overcast")) {
                      icon = "☁️";
                    } else if (cond.includes("snow")) {
                      icon = "❄️";
                    } else if (cond.includes("wind") || cond.includes("breez")) {
                      icon = "💨";
                    } else if (cond.includes("fog") || cond.includes("mist")) {
                      icon = "🌫️";
                    }

                    return (
                      <Card key={index} className="border border-border shadow-md p-4 text-center bg-card text-card-foreground">
                        <p className="font-semibold text-foreground mb-1">{dayLabel}</p>
                        <p className="text-xs text-muted-foreground mb-2">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        <p className="text-3xl mb-2">{icon}</p>
                        <p className="font-bold text-foreground">{dayForecast.temperature}°C</p>
                        <p className="text-[10px] text-muted-foreground mt-1 capitalize">{dayForecast.condition}</p>
                      </Card>
                    );
                  })
                ) : (
                  ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                    <Card key={day} className="border border-border shadow-md p-4 text-center bg-card text-card-foreground">
                      <p className="font-semibold text-foreground mb-2">{day}</p>
                      <p className="text-3xl mb-2">☀️</p>
                      <p className="font-bold text-foreground">28°C</p>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate(`/budget-calculator?destination=${encodeURIComponent(trip.destination.name)}&duration=${durationDays}&travelers=${trip.travelers}`)}
              >
                Recalculate Budget
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate(`/route-planner?end=${encodeURIComponent(trip.destination.name)}`)}
              >
                View Route
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted py-6"
                onClick={() => navigate("/chat-assistant")}
              >
                Get Help
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border border-border shadow-lg p-6 sticky top-24 bg-card text-card-foreground">
              <h4 className="font-bold text-foreground mb-6">Trip Summary</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                  <p className="font-semibold text-foreground">{new Date(trip.startDate).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">End Date</p>
                  <p className="font-semibold text-foreground">{new Date(trip.endDate).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
                  <p className="text-2xl font-bold text-teal-600">₹{numericBudget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Spent</p>
                  <p className="text-xl font-bold text-foreground">₹0</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                  <p className="text-xl font-bold text-green-600">₹{numericBudget.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border space-y-3">
                <Button onClick={handleEdit} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Edit Trip Details
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full border-border text-foreground hover:bg-muted">
                  Share Trip Itinerary
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
