import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { BarChart3, Users, MapPin, TrendingUp, Edit2, Trash2, Plus, X, Check, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DestinationItem {
  id: number;
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

  // Table States
  const [destinations, setDestinations] = useState<DestinationItem[]>([
    { id: 1, name: "Bali", country: "Indonesia", category: "Beach", rating: 4.8 },
    { id: 2, name: "Swiss Alps", country: "Switzerland", category: "Adventure", rating: 4.9 },
    { id: 3, name: "Madrid", country: "Spain", category: "Cultural", rating: 4.7 },
  ]);

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

  // Review Actions
  const handleApproveReview = (id: number, author: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success(`Review by ${author} approved successfully!`);
  };

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
  const handleDeleteDestination = (id: number, name: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    toast.success(`Destination "${name}" removed successfully.`);
  };

  const handleOpenAdd = () => {
    setDestName("");
    setDestCountry("");
    setDestCategory("Beach");
    setDestRating("4.5");
    setIsAddOpen(true);
  };

  const handleSaveNewDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName.trim() || !destCountry.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

    const newItem: DestinationItem = {
      id: Date.now(),
      name: destName,
      country: destCountry,
      category: destCategory,
      rating: parseFloat(destRating) || 4.5,
    };

    setDestinations((prev) => [...prev, newItem]);
    setIsAddOpen(false);
    toast.success(`Destination "${destName}" added successfully!`);
  };

  const handleOpenEdit = (dest: DestinationItem) => {
    setEditingDest(dest);
    setDestName(dest.name);
    setDestCountry(dest.country);
    setDestCategory(dest.category);
    setDestRating(dest.rating.toString());
    setIsEditOpen(true);
  };

  const handleSaveEditDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest) return;
    if (!destName.trim() || !destCountry.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

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
            <BarChart3 className="w-8 h-8 text-purple-600 animate-pulse" />
            Admin Dashboard
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-slate-900">{users.length + 1231}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="border-0 shadow-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Destinations</p>
                <p className="text-3xl font-bold text-slate-900">{destinations.length + 453}</p>
              </div>
              <MapPin className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>

          <Card className="border-0 shadow-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Trips Planned</p>
                <p className="text-3xl font-bold text-slate-900">2,891</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="border-0 shadow-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-slate-900">₹45.2K</p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Manage Destinations */}
            <Card className="border-0 shadow-lg p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Manage Destinations</h3>
                <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Destination
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Country</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Rating</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinations.map((dest) => (
                      <tr key={dest.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{dest.name}</td>
                        <td className="py-3 px-4 text-slate-600">{dest.country}</td>
                        <td className="py-3 px-4 text-slate-600">{dest.category}</td>
                        <td className="py-3 px-4 text-slate-600">⭐ {dest.rating}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleOpenEdit(dest)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
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
            <Card className="border-0 shadow-lg p-8 bg-white">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Recent Users</h3>

              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 flex-wrap gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">{user.trips} trips</p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-1 ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {user.status}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user.email)}
                        className="border-slate-300 hover:bg-slate-100 text-slate-800"
                      >
                        {user.status === "Active" ? "Suspend" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Manage Reviews */}
            <Card className="border-0 shadow-lg p-8 bg-white">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Pending Reviews</h3>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No pending reviews to moderate.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{review.author}</p>
                          <p className="text-sm text-slate-600 font-medium">{review.destination} • ⭐ {review.rating}</p>
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
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectReview(review.id, review.author)}
                          >
                            <X className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{review.review}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg p-6 sticky top-24 bg-white">
              <h3 className="font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Admin Tools</h3>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start py-6"
                  onClick={handleOpenAdd}
                >
                  + Add Destination
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start py-6"
                  onClick={() => toast.success("Loading full user logs registry...")}
                >
                  View All Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start py-6"
                  onClick={() => toast.success("Preparing analytical system reports...")}
                >
                  Analytics Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 justify-start py-6"
                  onClick={() => toast.info("Opening admin system configurations...")}
                >
                  System Settings
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Quick Stats</h4>
                <div className="space-y-3 text-sm font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">New Users (7d)</span>
                    <span className="text-slate-950">+45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">New Trips (7d)</span>
                    <span className="text-slate-950">+128</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Avg. Rating</span>
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
          <Card className="p-6 bg-white w-full max-w-md shadow-2xl relative border-0">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Plus className="w-6 h-6 text-teal-600" />
              Add Destination
            </h2>
            <form onSubmit={handleSaveNewDestination} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City Name</label>
                <Input
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  placeholder="e.g. Kyoto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                <Input
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  placeholder="e.g. Japan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={destCategory}
                  onChange={(e) => setDestCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option>Beach</option>
                  <option>Adventure</option>
                  <option>Cultural</option>
                  <option>Food</option>
                  <option>Shopping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rating (1-5)</label>
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
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
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
          <Card className="p-6 bg-white w-full max-w-md shadow-2xl relative border-0">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Edit2 className="w-5 h-5 text-teal-600" />
              Edit Destination
            </h2>
            <form onSubmit={handleSaveEditDestination} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City Name</label>
                <Input
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Country</label>
                <Input
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={destCategory}
                  onChange={(e) => setDestCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option>Beach</option>
                  <option>Adventure</option>
                  <option>Cultural</option>
                  <option>Food</option>
                  <option>Shopping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rating (1-5)</label>
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
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
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
