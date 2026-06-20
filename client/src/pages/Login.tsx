import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Compass } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email address is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Save session in localStorage for demo
    const isMockAdmin = email.toLowerCase().includes("admin");
    const sessionUser = {
      email,
      name: isMockAdmin ? "Admin User" : "John Doe",
      role: isMockAdmin ? "admin" : "user",
      rememberMe,
    };
    localStorage.setItem("session_user", JSON.stringify(sessionUser));

    toast.success("Signed in successfully!");
    
    // Connect user flow - redirect admins to Admin Dashboard, regular users to Home/Profile
    setTimeout(() => {
      if (isMockAdmin) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
              <Compass className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-center text-slate-600 mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" onClick={() => navigate("/forgot-password")} className="text-sm text-teal-600 hover:text-teal-700">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Don't have an account?{" "}
              <a href="#" onClick={() => navigate("/register")} className="text-teal-600 hover:text-teal-700 font-semibold">
                Sign up
              </a>
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Card>
      </div>
    </div>
  );
}
