import { useState } from "react";
import { useLocation } from "wouter";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
  User,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";
import { Footer } from "@/components/Footer";

export default function ContactUs() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    urgency: "Normal",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [sessionUser] = useState<any>(() => {
    try {
      const s = localStorage.getItem("session_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call processing
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Thank you! Your message has been sent successfully.");
    }, 1000);
  };

  const handleResetForm = () => {
    setFormData({
      name: sessionUser?.name || "",
      email: sessionUser?.email || "",
      category: "General Inquiry",
      urgency: "Normal",
      subject: "",
      message: ""
    });
    setIsSubmitted(false);
  };

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
              <Mail className="w-4 h-4" />
              Get In Touch
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              We're Here to Help
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Have questions about your trip, feedback on our AI planner, or need technical assistance? Fill out the form below or connect with us directly.
            </p>
          </div>
        </section>

        {/* Main Content Layout */}
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Form Column */}
            <div className="lg:col-span-7">
              <Card className="p-6 sm:p-8 bg-card border-border shadow-lg shadow-teal-500/5">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-1">Send Us a Message</h2>
                  <p className="text-muted-foreground text-sm">
                    Fill out the details and our support team will respond promptly.
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Message Received!</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Thank you for reaching out. We have logged your request under <strong>{formData.category}</strong>. Expect an email reply at <strong>{formData.email}</strong> shortly.
                    </p>
                    <Button
                      onClick={handleResetForm}
                      className="mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="rounded-xl border-border focus:border-primary"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="rounded-xl border-border focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Inquiry Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Itinerary Assistance">Itinerary Assistance</option>
                          <option value="Feedback & Bug Report">Feedback & Bug Report</option>
                          <option value="Business & Partnership">Business & Partnership</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Urgency Level
                        </label>
                        <select
                          value={formData.urgency}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="Normal">Normal Response</option>
                          <option value="High">High Priority</option>
                          <option value="Urgent">Urgent (Upcoming Trip)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Subject <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Brief summary of your question or issue..."
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="rounded-xl border-border focus:border-primary"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Detailed Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Provide details about your trip, destinations, or questions..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-y"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
                    >
                      {isSubmitting ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Support Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Direct Contact Info & Support Channels Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Contact Info Cards */}
              <Card className="p-6 bg-card border-border shadow-md">
                <h3 className="text-lg font-bold text-foreground mb-4 pb-3 border-b border-border flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Direct Contact Info
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Email Support</p>
                      <a href="mailto:support@smarttravelplanner.com" className="text-sm font-medium text-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                        support@smarttravelplanner.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Toll-Free Phone</p>
                      <p className="text-sm font-medium text-foreground">+1 (800) 555-TRIP</p>
                      <p className="text-xs text-muted-foreground">+91 1800-SMART-TRAVEL (India)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Headquarters</p>
                      <p className="text-sm font-medium text-foreground">Smart Travel Technologies Inc.</p>
                      <p className="text-xs text-muted-foreground">Tech Hub Plaza, San Francisco & Bangalore</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Response Time</p>
                      <p className="text-sm font-medium text-foreground">Average reply within 2 hours</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">24/7 AI Support Available</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Assistant Shortcuts */}
              <Card className="p-6 bg-gradient-to-br from-teal-900/10 via-card to-card border-teal-500/20 space-y-4">
                <h4 className="text-base font-bold text-foreground">Need Immediate Guidance?</h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/help-center")}
                    variant="outline"
                    className="w-full justify-start gap-2.5 rounded-xl text-left font-medium border-border hover:border-teal-500/50"
                  >
                    <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Browse Help Center & FAQs
                  </Button>

                  <Button
                    onClick={() => navigate("/chat-assistant")}
                    variant="outline"
                    className="w-full justify-start gap-2.5 rounded-xl text-left font-medium border-border hover:border-purple-500/50"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Chat with 24/7 Travel AI Concierge
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
