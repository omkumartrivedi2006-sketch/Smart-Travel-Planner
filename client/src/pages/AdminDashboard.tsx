import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { BarChart3, Users, MapPin, TrendingUp, Edit2, Trash2, Plus, X, Check, Eye, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";

interface DestinationItem {
  id: string;
  name: string;
  country: string;
  category: string;
  rating: number;
}

interface UserItem {
  name: string;
  email: string;
  trips: number;
  status: string;
}

interface ReviewItem {
  id: number;
  author: string;
  destination: string;
  rating: number;
  review: string;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Table States
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);

  const [users, setUsers] = useState<UserItem[]>([
    { name: "John Doe", email: "john@example.com", trips: 5, status: "Active" },
    { name: "Jane Smith", email: "jane@example.com", trips: 3, status: "Active" },
    { name: "Bob Johnson", email: "bob@example.com", trips: 0, status: "Inactive" },
  ]);

  const [reviews, setReviews] = useState<ReviewItem[]>([
    { id: 1, author: "John Doe", destination: "Bali", rating: 5, review: "Amazing experience! Highly recommended." },
    { id: 2, author: "Jane Smith", destination: "Madrid", rating: 4, review: "Great city, good food, busy streets." },
  ]);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<DestinationItem | null>(null);

  // Form Fields
  const [destName, setDestName] = useState("");
  const [destCountry, setDestCountry] = useState("");
  const [destCategory, setDestCategory] = useState("Beach");
  const [destRating, setDestRating] = useState("4.5");

  // Route protection and DB destinations loading
  useEffect(() => {
    const session = localStorage.getItem("session_user");
    if (!session) {
      toast.error("Access denied. Please log in first.");
      navigate("/login");
      return;
    }
    try {
      const user = JSON.parse(session);
      if (user.role !== "admin") {
        toast.error("Access denied. Admin role required.");
        navigate("/");
        return;
      }
    } catch (e) {
      navigate("/login");
      return;
    }

    async function loadDestinations() {
      try {
        const res = await apiFetch("/api/destinations?limit=100");
        if (res && res.data && res.data.destinations) {
          const list = res.data.destinations.map((d: any) => ({
            id: d._id,
            name: d.name,
            country: d.country,
            category: d.category,
            rating: d.rating || 4.5,
          }));
          setDestinations(list);
        }
      } catch (err: any) {
        toast.error("Failed to load destinations: " + err.message);
      }
    }
    loadDestinations();
  }, []);

  // Review Actions
  const handleApproveReview = (id: number, author: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Review by ${author} approved successfully!`);
  };

  // Reject Review
  const handleRejectReview = (id: number, author: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.error(`Review by ${author} rejected.`);
  };

  // User Actions
  const toggleUserStatus = (email: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.email === email) {
          const nextStatus = u.status === "Active" ? "Inactive" : "Active";
          toast.success(`User status for ${u.name} changed to ${nextStatus}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Destination Actions
  const handleDeleteDestination = async (id: string, name: string) => {
    try {
      await apiFetch(`/api/destinations/${id}`, {
        method: "DELETE",
      });
      setDestinations((prev) => prev.filter((d) => d.id !== id));
      toast.success(`Destination "${name}" removed successfully.`);
    } catch (err: any) {
      toast.error("Failed to delete destination: " + err.message);
    }
  };

  const handleOpenAdd = () => {
    setDestName("");
    setDestCountry("");
    setDestCategory("Beach");
    setDestRating("4.5");
    setIsAddOpen(true);
  };

  const handleSaveNewDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName.trim() || !destCountry.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

    try {
      const res = await apiFetch("/api/destinations", {
        method: "POST",
        body: JSON.stringify({
          name: destName,
          country: destCountry,
          category: destCategory,
          rating: parseFloat(destRating) || 4.5,
          description: "A wonderful travel destination offering premium activities and scenic sights.",
          averageCost: 100,
          latitude: 20.0,
          longitude: 70.0,
          activities: ["Sightseeing", "Cultural Tours"],
          bestTimeToVisit: "October - March",
          image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
        }),
      });

      if (res && res.data && res.data.destination) {
        const d = res.data.destination;
        const newItem: DestinationItem = {
          id: d._id,
          name: d.name,
          country: d.country,
          category: d.category,
          rating: d.rating || 4.5,
        };
        setDestinations((prev) => [...prev, newItem]);
        setIsAddOpen(false);
        toast.success(`Destination "${destName}" added successfully!`);
      }
    } catch (err: any) {
      toast.error("Failed to add destination: " + err.message);
    }
  };

  const handleOpenEdit = (dest: DestinationItem) => {
    setEditingDest(dest);
    setDestName(dest.name);
    setDestCountry(dest.country);
    setDestCategory(dest.category);
    setDestRating(dest.rating.toString());
    setIsEditOpen(true);
  };

  const handleSaveEditDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest) return;
    if (!destName.trim() || !destCountry.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

    try {
      const res = await apiFetch(`/api/destinations/${editingDest.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: destName,
          country: destCountry,
          category: destCategory,
          rating: parseFloat(destRating) || 4.5,
        }),
      });

      if (res && res.data && res.data.destination) {
        setDestinations((prev) =>
          prev.map((d) =>
            d.id === editingDest.id
              ? {
                  ...d,
                  name: destName,
                  country: destCountry,
                  category: destCategory,
                  rating: parseFloat(destRating) || 4.5,
                }
              : d
          )
        );
        setIsEditOpen(false);
        toast.success("Destination details updated successfully!");
      }
    } catch (err: any) {
      toast.error("Failed to update destination: " + err.message);
    }
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
              <BarChart3 className="w-8 h-8 text-purple-600 animate-pulse" />
              Admin Dashboard
            </h1>
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
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{users.length + 1231}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Destinations</p>
                <p className="text-3xl font-bold text-foreground">{destinations.length + 453}</p>
              </div>
              <MapPin className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>

          <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trips Planned</p>
                <p className="text-3xl font-bold text-foreground">2,891</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="border-0 shadow-lg p-6 bg-card text-card-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                <p className="text-3xl font-bold text-foreground">₹45.2K</p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Manage Destinations */}
            <Card className="border-0 shadow-lg p-8 bg-card text-card-foreground">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">Manage Destinations</h3>
                <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Destination
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Country</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Rating</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinations.map((dest) => (
                      <tr key={dest.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-semibold text-foreground">{dest.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{dest.country}</td>
                        <td className="py-3 px-4 text-muted-foreground">{dest.category}</td>
                        <td className="py-3 px-4 text-muted-foreground">⭐ {dest.rating}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-muted"
                              onClick={() => handleOpenEdit(dest)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
                              onClick={() => handleDeleteDestination(dest.id, dest.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Manage Users */}
            <Card className="border-0 shadow-lg p-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">Recent Users</h3>

              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 flex-wrap gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{user.trips} trips</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-1 ${
                          user.status === "Active"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {user.status}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.email)}
                        className="border-border hover:bg-muted text-foreground"
                      >
                        {user.status === "Active" ? "Suspend" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Manage Reviews */}
            <Card className="border-0 shadow-lg p-8 bg-card text-card-foreground">
              <h3 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">Pending Reviews</h3>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No pending reviews to moderate.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 border border-border rounded-lg bg-muted/40">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-4">
                        <div>
                          <p className="font-semibold text-foreground">{review.author}</p>
                          <p className="text-sm text-muted-foreground font-medium">{review.destination} • ⭐ {review.rating}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                            onClick={() => handleApproveReview(review.id, review.author)}
                          >
                            <Check className="w-4 h-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRejectReview(review.id, review.author)}
                          >
                            <X className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      </div>
                      <p className="text-foreground/80 text-sm leading-relaxed">{review.review}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 sticky top-24 bg-card text-card-foreground">
              <h3 className="font-bold text-foreground mb-6 border-b border-border pb-3">Admin Tools</h3>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted justify-start py-6"
                  onClick={handleOpenAdd}
                >
                  + Add Destination
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted justify-start py-6"
                  onClick={() => toast.success("Loading full user logs registry...")}
                >
                  View All Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted justify-start py-6"
                  onClick={() => toast.success("Preparing analytical system reports...")}
                >
                  Analytics Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted justify-start py-6"
                  onClick={() => toast.info("Opening admin system configurations...")}
                >
                  System Settings
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="font-bold text-foreground mb-4">Quick Stats</h4>
                <div className="space-y-3 text-sm font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Users (7d)</span>
                    <span className="text-foreground font-bold">+45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Trips (7d)</span>
                    <span className="text-foreground font-bold">+128</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg. Rating</span>
                    <span className="text-teal-600">4.7 / 5</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* React Custom modal overlays */}
      {/* 1. Add Destination Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 bg-card text-card-foreground w-full max-w-md shadow-2xl relative border border-border">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3 flex items-center gap-1.5">
              <Plus className="w-6 h-6 text-teal-600" />
              Add Destination
            </h2>
            <form onSubmit={handleSaveNewDestination} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">City Name</label>
                <Input
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  placeholder="e.g. Kyoto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">Country</label>
                <Input
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  placeholder="e.g. Japan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">Category</label>
                <select
                  value={destCategory}
                  onChange={(e) => setDestCategory(e.target.value)}
                  className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option>Beach</option>
                  <option>Adventure</option>
                  <option>Cultural</option>
                  <option>Food</option>
                  <option>Shopping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">Rating (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={destRating}
                  onChange={(e) => setDestRating(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Add Destination
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Edit Destination Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 bg-card text-card-foreground w-full max-w-md shadow-2xl relative border border-border">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3 flex items-center gap-1.5">
              <Edit2 className="w-5 h-5 text-teal-600" />
              Edit Destination
            </h2>
            <form onSubmit={handleSaveEditDestination} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">City Name</label>
                <Input
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">Country</label>
                <Input
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">Category</label>
                <select
                  value={destCategory}
                  onChange={(e) => setDestCategory(e.target.value)}
                  className="w-full border border-border bg-background rounded px-3 py-2 text-foreground focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option>Beach</option>
                  <option>Adventure</option>
                  <option>Cultural</option>
                  <option>Food</option>
                  <option>Shopping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground/80 mb-2">Rating (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={destRating}
                  onChange={(e) => setDestRating(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
