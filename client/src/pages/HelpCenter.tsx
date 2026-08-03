import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  ChevronDown,
  Sparkles,
  MapPin,
  IndianRupee,
  Compass,
  User,
  Shield,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";
import { Footer } from "@/components/Footer";

// FAQ Data Structure
interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "getting-started",
    question: "How does Smart Travel Planner work?",
    answer: "Smart Travel Planner uses AI algorithms combined with real-time location data, destination catalogs, and budgeting algorithms to generate personalized itineraries, budget forecasts, weather insights, and route maps tailored to your exact travel preferences."
  },
  {
    id: "faq-2",
    category: "getting-started",
    question: "Is Smart Travel Planner free to use?",
    answer: "Yes! Core features including destination search, AI recommendations, itinerary creation, budget calculation, and live AI chat support are completely free to use."
  },
  {
    id: "faq-3",
    category: "planning",
    question: "Can I customize my generated trip itineraries?",
    answer: "Absolutely. Once an itinerary is generated, you can modify activities, adjust daily budgets, add custom notes, and re-order places on your interactive route map."
  },
  {
    id: "faq-4",
    category: "planning",
    question: "How do I save and export my planned trips?",
    answer: "Navigate to 'My Trips' or click 'Save Trip' within any generated itinerary. You can view all saved trips anytime from your user dashboard and access them across devices."
  },
  {
    id: "faq-5",
    category: "ai-features",
    question: "How does the AI Assistant generate recommendations?",
    answer: "Our AI model analyzes your preferred budget, interests (such as nature, heritage, food, beach, or city life), travel duration, and current location to rank and suggest destinations with high matching confidence."
  },
  {
    id: "faq-6",
    category: "ai-features",
    question: "What is the Chat Assistant and how can it help me?",
    answer: "The 24/7 AI Chat Assistant acts as your personal travel concierge. You can ask it for local hidden gems, packing tips, emergency advice, cultural etiquette, or instant itinerary tweaks."
  },
  {
    id: "faq-7",
    category: "budget",
    question: "How accurate is the Budget Calculator?",
    answer: "The Budget Calculator calculates real-time estimates based on average accommodation costs, meal prices, transport estimates, and activity fees for each destination. It splits expenses into categories (Stay, Food, Transport, Misc) for maximum transparency."
  },
  {
    id: "faq-8",
    category: "budget",
    question: "Can I budget for group trips or family travels?",
    answer: "Yes, you can input the total number of travelers in the Budget Calculator and AI Recommendation tools to adjust total per-head and collective costs."
  },
  {
    id: "faq-9",
    category: "account",
    question: "How do I update my profile or password?",
    answer: "Go to your User Profile page by clicking on your avatar in the top navbar. From there, you can update your profile picture, personal preferences, and change your account password."
  },
  {
    id: "faq-10",
    category: "weather",
    question: "How does Weather Forecast integration help my trip?",
    answer: "Our Weather Forecast tool fetches multi-day forecasts for your destination and provides smart packing recommendations (e.g. rain gear, sunscreen, light layers) based on upcoming temperature and precipitation."
  }
];

const HELP_CATEGORIES = [
  { id: "all", name: "All Topics", icon: BookOpen, color: "text-teal-500 bg-teal-500/10" },
  { id: "getting-started", name: "Getting Started", icon: Compass, color: "text-blue-500 bg-blue-500/10" },
  { id: "planning", name: "Trip Planning", icon: MapPin, color: "text-purple-500 bg-purple-500/10" },
  { id: "ai-features", name: "AI Features & Chat", icon: Sparkles, color: "text-amber-500 bg-amber-500/10" },
  { id: "budget", name: "Budgeting & Costs", icon: IndianRupee, color: "text-emerald-500 bg-emerald-500/10" },
  { id: "account", name: "Account & Profile", icon: User, color: "text-rose-500 bg-rose-500/10" },
  { id: "weather", name: "Weather & Routes", icon: Shield, color: "text-cyan-500 bg-cyan-500/10" }
];

export default function HelpCenter() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");
  const [sessionUser, setSessionUser] = useState<any>(() => {
    try {
      const s = localStorage.getItem("session_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between">
      <div>
        {/* Header Navigation */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <Logo className="w-10 h-10 text-primary animate-pulse" />
              <h1 className="text-2xl font-bold text-foreground">Smart Travel Planner</h1>
            </div>

            <nav className="flex items-center gap-4">
              <LocationNavbarButton />
              <Button
                variant="ghost"
                onClick={() => navigate("/destinations")}
                className="text-foreground/70 hover:text-teal-600 dark:text-foreground/80 dark:hover:text-teal-400"
              >
                Explore
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/saved-trips")}
                className="text-foreground/70 hover:text-teal-600 dark:text-foreground/80 dark:hover:text-teal-400"
              >
                My Trips
              </Button>

              {sessionUser ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/profile")}
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  {sessionUser.name || "Profile"}
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Login
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground/70 hover:text-foreground"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </Button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-teal-900/20 via-background to-background py-16 px-4 border-b border-border/50">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <HelpCircle className="w-4 h-4" />
              Support & Documentation
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              How can we help you today?
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Search our knowledge base for instant answers on itinerary planning, AI recommendations, budget estimates, and user settings.
            </p>

            {/* Live Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles, FAQs, keywords (e.g. 'budget', 'export', 'AI')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 text-base rounded-2xl bg-card border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Category Filter Chips */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Explore Topics
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {HELP_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card hover:bg-accent text-foreground border-border"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? "text-primary-foreground" : ""}`} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQs Accordion Grid */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredFaqs.length} relevant answer{filteredFaqs.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="text-lg font-bold text-foreground mb-1">No matching articles found</h4>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  We couldn't find any help topic matching "{searchQuery}". Try searching with another keyword or contact support.
                </p>
                <Button
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                  variant="outline"
                  className="rounded-xl"
                >
                  Reset Search & Filters
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <Card
                      key={faq.id}
                      className={`transition-all duration-200 border ${
                        isOpen ? "border-teal-500/50 shadow-md bg-card" : "border-border hover:border-teal-500/30 bg-card"
                      }`}
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-base sm:text-lg focus:outline-none"
                      >
                        <span className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-muted-foreground text-sm sm:text-base leading-relaxed border-t border-border/50">
                          {faq.answer}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Support CTA Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6 bg-gradient-to-br from-teal-500/10 via-card to-card border-teal-500/30">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Still need personalized help?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Send a message to our support team and receive a response within 2 hours.
                  </p>
                  <Button
                    onClick={() => navigate("/contact-us")}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center gap-2"
                  >
                    Contact Support Team
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/30">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Instant AI Assistant</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Get real-time answers for travel itineraries, packing advice, and local recommendations.
                  </p>
                  <Button
                    onClick={() => navigate("/chat-assistant")}
                    variant="outline"
                    className="border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-xl flex items-center gap-2"
                  >
                    Open AI Chat Assistant
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
