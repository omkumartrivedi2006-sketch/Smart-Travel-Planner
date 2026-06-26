import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { User, Heart, Settings, LogOut, Edit2, Check, X, Sun, Moon, Camera, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch, clearSession } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { WORLD_CITIES } from "@/data/worldCities";
import { useLocationData } from "@/contexts/LocationContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

export default function UserProfile() {
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { location } = useLocationData();

  // User details state
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    travelStyle: "Comfort",
    budgetPref: "Mid-range",
    interests: ["Beach", "Adventure", "Culture"],
  });

  // Edit form states
  const [editForm, setEditForm] = useState({ ...profile });

  // Custom states for picture, stats and wishlist
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    planned: 0,
    completed: 0,
    wishlistCount: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load session or saved profile on mount
  useEffect(() => {
    const sessionUser = localStorage.getItem("session_user");
    if (!sessionUser) {
      toast.error("Access denied. Please log in first.");
      navigate("/login");
      return;
    }

    let userEmail = "";
    try {
      const parsed = JSON.parse(sessionUser);
      userEmail = parsed.email || "john@example.com";
      
      // Load saved profile picture
      const savedPic = localStorage.getItem(`profile_pic_${userEmail}`);
      if (savedPic) {
        setProfileImage(savedPic);
      }
    } catch (e) {
      console.error("Failed to parse session user", e);
    }

    const savedProfile = localStorage.getItem("user_profile");
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditForm(parsed);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    } else {
      try {
        const user = JSON.parse(sessionUser);
        const nameParts = user.name.split(" ");
        const updated = {
          ...profile,
          firstName: nameParts[0] || "John",
          lastName: nameParts.slice(1).join(" ") || "Doe",
          email: user.email || "john@example.com",
        };
        setProfile(updated);
        setEditForm(updated);
      } catch (e) {
        console.error("Failed to parse session user", e);
      }
    }

    // Load wishlist items
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlist(savedWishlist);

    // Load dynamic data for statistics and wishlist mapping
    async function loadData() {
      let dbDests = [];
      try {
        const res = await apiFetch("/api/destinations?limit=200");
        if (res?.data?.destinations) {
          dbDests = res.data.destinations;
        }
      } catch (err) {
        console.error("Failed to fetch destinations list", err);
      }

      // Merge with offline WORLD_CITIES
      const merged = [
        ...dbDests.map((d: any) => ({ id: d._id, name: d.name })),
        ...WORLD_CITIES.map((c: any) => ({ id: c.id, name: c.name }))
      ];
      setDestinations(merged);

      // Load trips planned and completed
      let planned = 0;
      let completed = 0;
      try {
        const tripsRes = await apiFetch("/api/trips");
        if (tripsRes?.data?.trips) {
          const trips = tripsRes.data.trips;
          planned = trips.filter((t: any) => t.status !== "completed").length;
          completed = trips.filter((t: any) => t.status === "completed").length;
        }
      } catch (err) {
        console.error("Failed to load user trips", err);
      }

      setStats({
        planned,
        completed,
        wishlistCount: savedWishlist.length,
      });
    }

    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (JPG, JPEG, PNG, WEBP)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Invalid file type. Please select a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    // Validate size (max 5 MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image size exceeds 5 MB. Please select a smaller file.");
      return;
    }

    // Read and save as Base64 Data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
      
      const sessionUser = localStorage.getItem("session_user");
      if (sessionUser) {
        try {
          const parsedObj = JSON.parse(sessionUser);
          localStorage.setItem(`profile_pic_${parsedObj.email}`, base64String);
          toast.success("Profile picture updated successfully!");
        } catch (err) {
          console.error(err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast.error("First and Last name cannot be empty");
      return;
    }
    if (!editForm.email.trim() || !/\S+@\S+\.\S+/.test(editForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setProfile(editForm);
    localStorage.setItem("user_profile", JSON.stringify(editForm));
    
    // Sync session user
    const sessionUser = localStorage.getItem("session_user");
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        parsed.name = `${editForm.firstName} ${editForm.lastName}`;
        parsed.email = editForm.email;
        localStorage.setItem("session_user", JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }

    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({ ...profile });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (e) {
      console.error("Logout request failed:", e);
    }
    clearSession();
    toast.success("Logged out successfully");
    setTimeout(() => {
      navigate("/login");
    }, 800);
  };

  const handleWishlistClick = (destName: string) => {
    const dest = destinations.find(d => d.name.toLowerCase() === destName.toLowerCase());
    if (dest) {
      navigate(`/destinations/${dest.id}`);
    } else {
      navigate(`/destinations`);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = [...editForm.interests];
    const index = current.indexOf(interest);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(interest);
    }
    setEditForm({ ...editForm, interests: current });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground mb-2 flex items-center gap-1">
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <User className="w-8 h-8 text-teal-600" />
              My Profile
            </h1>
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
          {/* Profile Card */}
          <Card className="border border-border shadow-lg p-8 mb-8 bg-card text-card-foreground">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                {/* Profile Picture Upload Container */}
                <div className="relative group w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-teal-500 bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                  {/* Hover Overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white cursor-pointer"
                    title="Update Profile Picture"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {location && (
                    <div className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 bg-teal-500/10 dark:bg-teal-400/10 px-2.5 py-1 rounded-full w-fit justify-center sm:justify-start">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{location.city}, {location.country}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2 justify-center sm:justify-start">
                    Member since June 2024
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:text-teal-300 dark:hover:bg-teal-950/20 px-2 flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Update Photo
                    </Button>
                  </p>
                </div>
              </div>
              {!isEditing ? (
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 self-center sm:self-start"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.planned}</p>
                <p className="text-sm text-muted-foreground">Trips Planned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Trips Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.wishlistCount}</p>
                <p className="text-sm text-muted-foreground">Saved Wishlist</p>
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="border border-border shadow-lg p-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-teal-600" />
                Personal Information
              </h3>
              
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">First Name</p>
                    <p className="font-semibold text-foreground">{profile.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Name</p>
                    <p className="font-semibold text-foreground">{profile.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold text-foreground">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold text-foreground">{profile.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">First Name</label>
                    <Input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Last Name</label>
                    <Input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Email</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-background border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Phone</label>
                    <Input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-background border-border text-foreground"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Preferences */}
            <Card className="border border-border shadow-lg p-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-teal-600" />
                Preferences
              </h3>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Travel Style</p>
                      <p className="text-sm text-muted-foreground">{profile.travelStyle}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-semibold text-foreground">Budget Preference</p>
                      <p className="text-sm text-muted-foreground">{profile.budgetPref}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-semibold text-foreground">Interests</p>
                      <p className="text-sm text-muted-foreground">{profile.interests.join(", ")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Travel Style</label>
                    <select
                      value={editForm.travelStyle}
                      onChange={(e) => setEditForm({ ...editForm, travelStyle: e.target.value })}
                      className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500"
                    >
                      <option>Budget</option>
                      <option>Comfort</option>
                      <option>Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Budget Preference</label>
                    <select
                      value={editForm.budgetPref}
                      onChange={(e) => setEditForm({ ...editForm, budgetPref: e.target.value })}
                      className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500"
                    >
                      <option>Budget</option>
                      <option>Mid-range</option>
                      <option>Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">Interests</label>
                    <div className="flex flex-wrap gap-3">
                      {["Beach", "Adventure", "Culture", "Food", "Nature"].map((interest) => (
                        <label key={interest} className="flex items-center gap-2 cursor-pointer p-2 border border-border rounded bg-card hover:bg-muted text-foreground">
                          <input
                            type="checkbox"
                            checked={editForm.interests.includes(interest)}
                            onChange={() => toggleInterest(interest)}
                            className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded border-border"
                          />
                          <span className="text-sm text-foreground/80 font-medium">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Saved Destinations */}
            <Card className="border border-border shadow-lg p-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-600" />
                Saved Destinations ({wishlist.length})
              </h3>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {wishlist.map((dest) => (
                    <Card
                      key={dest}
                      className="border border-border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all bg-card hover:bg-muted text-card-foreground"
                      onClick={() => handleWishlistClick(dest)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{dest}</p>
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-lg mb-6 text-muted-foreground">
                  No destinations saved to your wishlist yet.
                </div>
              )}
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
                onClick={() => navigate("/destinations")}
              >
                View All Saved Destinations
              </Button>
            </Card>

            {/* Logout */}
            <Button
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-6 flex items-center justify-center gap-2 shadow-lg"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
