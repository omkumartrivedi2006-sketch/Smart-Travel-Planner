import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { User, Heart, Settings, LogOut, Edit2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch, clearSession } from "@/lib/api";

export default function UserProfile() {
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);

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

  // Load session or saved profile on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("user_profile");
    const sessionUser = localStorage.getItem("session_user");
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditForm(parsed);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    } else if (sessionUser) {
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
  }, []);

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

  // Map wishlist destinations to their respective IDs
  const getDestinationId = (name: string) => {
    const mapping: Record<string, number> = {
      "bali": 1,
      "swiss alps": 2,
      "madrid": 3,
    };
    return mapping[name.toLowerCase()] || null;
  };

  const handleWishlistClick = (destName: string) => {
    const id = getDestinationId(destName);
    if (id) {
      navigate(`/destinations/${id}`);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-600 mb-4">
            ← Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-8 h-8 text-teal-600" />
            My Profile
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <Card className="border-0 shadow-lg p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-slate-600">{profile.email}</p>
                  <p className="text-sm text-slate-500 mt-2">Member since June 2024</p>
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
                    className="border-slate-300 text-slate-900 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">12</p>
                <p className="text-sm text-slate-600">Trips Planned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">8</p>
                <p className="text-sm text-slate-600">Trips Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">6</p>
                <p className="text-sm text-slate-600">Saved Wishlist</p>
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-teal-600" />
                Personal Information
              </h3>
              
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">First Name</p>
                    <p className="font-semibold text-slate-900">{profile.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Last Name</p>
                    <p className="font-semibold text-slate-900">{profile.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="font-semibold text-slate-900">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Phone</p>
                    <p className="font-semibold text-slate-900">{profile.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                    <Input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                    <Input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <Input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Preferences */}
            <Card className="border-0 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-teal-600" />
                Preferences
              </h3>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Travel Style</p>
                      <p className="text-sm text-slate-600">{profile.travelStyle}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-900">Budget Preference</p>
                      <p className="text-sm text-slate-600">{profile.budgetPref}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-900">Interests</p>
                      <p className="text-sm text-slate-600">{profile.interests.join(", ")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Travel Style</label>
                    <select
                      value={editForm.travelStyle}
                      onChange={(e) => setEditForm({ ...editForm, travelStyle: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    >
                      <option>Budget</option>
                      <option>Comfort</option>
                      <option>Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Budget Preference</label>
                    <select
                      value={editForm.budgetPref}
                      onChange={(e) => setEditForm({ ...editForm, budgetPref: e.target.value })}
                      className="w-full border border-slate-300 rounded px-3 py-2"
                    >
                      <option>Budget</option>
                      <option>Mid-range</option>
                      <option>Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Interests</label>
                    <div className="flex flex-wrap gap-3">
                      {["Beach", "Adventure", "Culture", "Food", "Nature"].map((interest) => (
                        <label key={interest} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={editForm.interests.includes(interest)}
                            onChange={() => toggleInterest(interest)}
                            className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded border-slate-300"
                          />
                          <span className="text-sm text-slate-800 font-medium">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Saved Destinations */}
            <Card className="border-0 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-600" />
                Saved Destinations (6)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {["Bali", "Swiss Alps", "Madrid", "Tokyo", "Paris", "New York"].map((dest) => (
                  <Card
                    key={dest}
                    className="border-0 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all hover:bg-slate-50 border border-slate-100"
                    onClick={() => handleWishlistClick(dest)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{dest}</p>
                      <Heart className="w-5 h-5 fill-red-600 text-red-600" />
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-slate-300 text-slate-900 hover:bg-slate-50"
                onClick={() => navigate("/destinations")}
              >
                View All Saved Destinations
              </Button>
            </Card>

            {/* Logout */}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 flex items-center justify-center gap-2"
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
