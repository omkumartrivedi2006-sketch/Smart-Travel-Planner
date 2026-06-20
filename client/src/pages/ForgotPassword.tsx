import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Sun, Moon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("Password reset link sent to " + email);
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex items-center justify-center p-4 relative">
      {toggleTheme && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="absolute top-4 right-4 text-foreground hover:bg-muted"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
      )}

      <div className="w-full max-w-md">
        <Card className="border border-border bg-card text-card-foreground shadow-2xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
              <Logo className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-foreground mb-2">Reset Password</h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border-border text-foreground"
              />
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2" disabled={isLoading}>
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Remember your password?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }} className="text-teal-600 hover:text-teal-700 font-semibold underline">
                Sign in
              </a>
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-4 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Card>
      </div>
    </div>
  );
}
