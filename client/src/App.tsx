import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Destinations from "./pages/Destinations";
import DestinationDetails from "./pages/DestinationDetails";
import TripPlanner from "./pages/TripPlanner";
import SavedTrips from "./pages/SavedTrips";
import TripDetails from "./pages/TripDetails";
import AIRecommendations from "./pages/AIRecommendations";
import BudgetCalculator from "./pages/BudgetCalculator";
import WeatherForecast from "./pages/WeatherForecast";
import RoutePlanner from "./pages/RoutePlanner";
import ChatAssistant from "./pages/ChatAssistant";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/destinations"} component={Destinations} />
      <Route path={"/destinations/:id"} component={DestinationDetails} />
      <Route path={"/planner"} component={TripPlanner} />
      <Route path={"/saved-trips"} component={SavedTrips} />
      <Route path={"/trips/:id"} component={TripDetails} />
      <Route path={"/ai-recommendations"} component={AIRecommendations} />
      <Route path={"/budget-calculator"} component={BudgetCalculator} />
      <Route path={"/weather-forecast"} component={WeatherForecast} />
      <Route path={"/route-planner"} component={RoutePlanner} />
      <Route path={"/chat-assistant"} component={ChatAssistant} />
      <Route path={"/profile"} component={UserProfile} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
