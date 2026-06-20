import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground transition-colors duration-300 relative px-4">
      {/* Floating Theme Toggle */}
      {toggleTheme && (
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-foreground hover:bg-muted"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
      )}

      <Card className="w-full max-w-lg shadow-xl border border-border bg-card text-card-foreground">
        <CardContent className="pt-10 pb-10 text-center flex flex-col items-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/10 rounded-full animate-ping" />
              <Logo className="relative h-16 w-16 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-foreground mb-2 tracking-tight">404</h1>

          <h2 className="text-xl font-bold text-foreground mb-4">
            Destination Not Found
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed max-w-sm">
            Sorry, the page or travel route you are looking for doesn't exist on our map.
          </p>

          <div className="flex justify-center w-full">
            <Button
              onClick={handleGoHome}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
