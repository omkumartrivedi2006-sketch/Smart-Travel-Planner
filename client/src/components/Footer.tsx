import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { HelpCircle, Mail, MessageSquare, Compass, Shield, Heart } from "lucide-react";

export function Footer() {
  const [, navigate] = useLocation();

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
      <div className="container mx-auto px-4">
        {/* Top brand header inside footer */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 mb-8 border-b border-slate-800 gap-4">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            <Logo className="w-9 h-9 text-teal-400 group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-xl font-bold text-white tracking-wide">Smart Travel Planner</span>
              <p className="text-xs text-slate-400">AI-Powered Travel Intelligence & Itinerary Planner</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleNav("/help-center")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              Help Center
            </button>
            <button
              onClick={handleNav("/contact-us")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-xs text-teal-300 hover:text-teal-200 transition-colors border border-teal-500/30"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              Contact Us
            </button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h5 className="font-bold mb-4 text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-400" />
              Features
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400 font-medium">
              <li>
                <a href="/destinations" onClick={handleNav("/destinations")} className="hover:text-teal-300 transition-colors">
                  Explore Destinations
                </a>
              </li>
              <li>
                <a href="/planner" onClick={handleNav("/planner")} className="hover:text-teal-300 transition-colors">
                  Trip Planner
                </a>
              </li>
              <li>
                <a href="/ai-recommendations" onClick={handleNav("/ai-recommendations")} className="hover:text-teal-300 transition-colors">
                  AI Recommendations
                </a>
              </li>
              <li>
                <a href="/saved-trips" onClick={handleNav("/saved-trips")} className="hover:text-teal-300 transition-colors">
                  Saved Trips
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-4 text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-400" />
              Tools
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400 font-medium">
              <li>
                <a href="/budget-calculator" onClick={handleNav("/budget-calculator")} className="hover:text-teal-300 transition-colors">
                  Budget Calculator
                </a>
              </li>
              <li>
                <a href="/weather-forecast" onClick={handleNav("/weather-forecast")} className="hover:text-teal-300 transition-colors">
                  Weather Forecast
                </a>
              </li>
              <li>
                <a href="/route-planner" onClick={handleNav("/route-planner")} className="hover:text-teal-300 transition-colors">
                  Route Planner
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-4 text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              Account
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400 font-medium">
              <li>
                <a href="/login" onClick={handleNav("/login")} className="hover:text-teal-300 transition-colors">
                  Account Login
                </a>
              </li>
              <li>
                <a href="/register" onClick={handleNav("/register")} className="hover:text-teal-300 transition-colors">
                  Sign Up & Register
                </a>
              </li>
              <li>
                <a href="/profile" onClick={handleNav("/profile")} className="hover:text-teal-300 transition-colors">
                  User Profile
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold mb-4 text-slate-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              Support & Help
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400 font-medium">
              <li>
                <a href="/help-center" onClick={handleNav("/help-center")} className="hover:text-teal-300 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  Help Center & FAQs
                </a>
              </li>
              <li>
                <a href="/contact-us" onClick={handleNav("/contact-us")} className="hover:text-teal-300 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  Contact Support
                </a>
              </li>
              <li>
                <a href="/chat-assistant" onClick={handleNav("/chat-assistant")} className="hover:text-teal-300 transition-colors">
                  24/7 AI Chat Assistant
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and disclaimer */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-4">
          <p>© 2026 Smart Travel Planner. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for travelers worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
