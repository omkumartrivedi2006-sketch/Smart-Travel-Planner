import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import {
  MessageCircle,
  Send,
  Sparkles,
  Star,
  MapPin,
  Compass,
  Cloud,
  Sun,
  Moon,
  Calendar,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  IndianRupee,
  Umbrella,
  CheckCircle2,
  User,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { LocationNavbarButton } from "@/components/LocationNavbarButton";

// =============================================================================
// DESTINATION DATABASE (50 SAMPLE DESTINATIONS)
// =============================================================================
interface Destination {
  id: number;
  name: string;
  country: string;
  category: "Beach" | "Adventure" | "Cultural" | "Mountain" | "Honeymoon" | "Nature" | "Luxury";
  budgetTier: "Budget" | "Mid-range" | "Luxury";
  budgetRange: string;
  bestTime: string;
  rating: number;
  description: string;
  attractions: string[];
  tags: string[];
  isIndian: boolean;
  image: string;
}

const DESTINATIONS_DB: Destination[] = [
  // --- INDIA (25 DESTINATIONS) ---
  {
    id: 101,
    name: "Goa",
    country: "India",
    category: "Beach",
    budgetTier: "Budget",
    budgetRange: "₹15,000 - ₹25,000",
    bestTime: "November - February",
    rating: 4.7,
    description: "Famous for sandy beaches, vibrant nightlife, Portuguese heritage, and water sports.",
    attractions: ["Calangute Beach", "Fort Aguada", "Dudhsagar Falls"],
    tags: ["Beaches", "Nightlife", "Water Sports", "Parties"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  {
    id: 102,
    name: "Manali",
    country: "India",
    category: "Mountain",
    budgetTier: "Budget",
    budgetRange: "₹20,000 - ₹35,000",
    bestTime: "October - June",
    rating: 4.8,
    description: "A high-altitude Himalayan resort town known for backpacking, skiing, and trekking.",
    attractions: ["Solang Valley", "Rohtang Pass", "Hadimba Temple"],
    tags: ["Snow", "Adventure", "Trekking", "Hills"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
  },
  {
    id: 103,
    name: "Shimla",
    country: "India",
    category: "Mountain",
    budgetTier: "Budget",
    budgetRange: "₹18,000 - ₹30,000",
    bestTime: "March - June",
    rating: 4.6,
    description: "The summer capital of British India, popular for colonial architecture and scenic Mall Road walks.",
    attractions: ["The Ridge", "Jakhoo Temple", "Kalka-Shimla Toy Train"],
    tags: ["Colonial", "Hills", "Family", "Scenic"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
  },
  {
    id: 104,
    name: "Kashmir",
    country: "India",
    category: "Mountain",
    budgetTier: "Mid-range",
    budgetRange: "₹35,000 - ₹60,000",
    bestTime: "March - August",
    rating: 4.9,
    description: "Heaven on Earth, famous for houseboats, serene lakes, snowcapped mountains, and tulip gardens.",
    attractions: ["Dal Lake Houseboats", "Gulmarg Gondola Ride", "Shalimar Bagh Gardens"],
    tags: ["Romantic", "Houseboats", "Scenic valleys", "Snow"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
  },
  {
    id: 105,
    name: "Ladakh",
    country: "India",
    category: "Adventure",
    budgetTier: "Luxury",
    budgetRange: "₹45,000 - ₹80,000",
    bestTime: "June - September",
    rating: 4.9,
    description: "A cold desert region in Jammu and Kashmir, popular for high-altitude biking passes and monasteries.",
    attractions: ["Pangong Tso Lake", "Nubra Valley sand dunes", "Khardung La Pass"],
    tags: ["Biking Trails", "Desert valley", "Monasteries", "Trekking"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
  },
  {
    id: 106,
    name: "Jaipur",
    country: "India",
    category: "Cultural",
    budgetTier: "Budget",
    budgetRange: "₹15,000 - ₹25,000",
    bestTime: "October - March",
    rating: 4.7,
    description: "The Pink City, famous for grand royal palaces, historic hilltop forts, and colorful bazaars.",
    attractions: ["Amer Fort", "Hawa Mahal Palace", "City Palace Museum"],
    tags: ["Heritage", "Forts", "Palaces", "Shopping"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 107,
    name: "Udaipur",
    country: "India",
    category: "Honeymoon",
    budgetTier: "Luxury",
    budgetRange: "₹35,000 - ₹70,000",
    bestTime: "October - March",
    rating: 4.8,
    description: "The City of Lakes, known for its royal heritage lakeside palaces and romantic settings.",
    attractions: ["Lake Palace Hotel", "Lakeside City Palace", "Lake Pichola Boating"],
    tags: ["Romantic", "Lakes", "Royal", "Palaces"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 108,
    name: "Kerala",
    country: "India",
    category: "Nature",
    budgetTier: "Mid-range",
    budgetRange: "₹30,000 - ₹50,000",
    bestTime: "September - March",
    rating: 4.8,
    description: "God's Own Country, popular for backwater houseboats, tea gardens, and Ayurvedic therapies.",
    attractions: ["Alleppey Backwaters", "Munnar Tea Hills", "Wayanad Wildlife Sanctuary"],
    tags: ["Backwaters", "Greenery", "Ayurveda", "Relaxing"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  {
    id: 109,
    name: "Andaman Islands",
    country: "India",
    category: "Beach",
    budgetTier: "Luxury",
    budgetRange: "₹50,000 - ₹90,000",
    bestTime: "October - May",
    rating: 4.8,
    description: "Tropical islands in the Bay of Bengal, known for white-sand beaches and pristine scuba diving reefs.",
    attractions: ["Radhanagar Beach", "Cellular Jail Memorial", "Havelock Island corals"],
    tags: ["Scuba Diving", "Islands", "Beaches", "Honeymoon"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  {
    id: 110,
    name: "Rishikesh",
    country: "India",
    category: "Adventure",
    budgetTier: "Budget",
    budgetRange: "₹10,000 - ₹20,000",
    bestTime: "September - May",
    rating: 4.7,
    description: "The Yoga Capital of the world, popular for river rafting, camping, and spiritual retreats.",
    attractions: ["Lakshman Jhula Bridge", "Triveni Ghat Aarti", "Beatles Ashram tour"],
    tags: ["Yoga", "River Rafting", "Spiritual", "Camping"],
    isIndian: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
  },
  { id: 111, name: "Agra", country: "India", category: "Cultural", budgetTier: "Budget", budgetRange: "₹8,000 - ₹15,000", bestTime: "October - March", rating: 4.9, description: "Home to the iconic Taj Mahal, Agra Fort, and Mughal history.", attractions: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri"], tags: ["Taj Mahal", "Mughal History", "Heritage"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 112, name: "Hampi", country: "India", category: "Cultural", budgetTier: "Budget", budgetRange: "₹12,000 - ₹20,000", bestTime: "October - February", rating: 4.7, description: "UNESCO World Heritage Site with ancient stone ruins of the Vijayanagara Empire.", attractions: ["Virupaksha Temple", "Stone Chariot", "Vittala Temple Complex"], tags: ["Stone Ruins", "History", "Architecture"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 113, name: "Darjeeling", country: "India", category: "Mountain", budgetTier: "Budget", budgetRange: "₹18,000 - ₹30,000", bestTime: "March - May / Oct - Dec", rating: 4.7, description: "Famous for tea gardens, view of Mount Kanchenjunga, and Himalayan toy railway.", attractions: ["Tiger Hill sunrise", "Batasia Loop railroad", "Peace Pagoda"], tags: ["Tea Estates", "Hills", "Scenic Peaks"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp" },
  { id: 114, name: "Varanasi", country: "India", category: "Cultural", budgetTier: "Budget", budgetRange: "₹10,000 - ₹18,000", bestTime: "October - March", rating: 4.8, description: "One of the oldest living cities, spiritual center on the holy banks of River Ganges.", attractions: ["Kashi Vishwanath Temple", "Dashashwamedh Ghat", "Sarnath ruins"], tags: ["Ganga Aarti", "Spiritual", "Ancient temples"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 115, name: "Ooty", country: "India", category: "Mountain", budgetTier: "Budget", budgetRange: "₹15,000 - ₹25,000", bestTime: "April - June / Sep - Nov", rating: 4.6, description: "Queen of Hill Stations, famous for tea estates, botanical gardens, and toy train ride.", attractions: ["Ooty Lake", "Government Botanical Garden", "Doddabetta Peak"], tags: ["Hills", "Tea fields", "Scenic views"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp" },
  { id: 116, name: "Jaisalmer", country: "India", category: "Cultural", budgetTier: "Budget", budgetRange: "₹18,000 - ₹28,000", bestTime: "October - March", rating: 4.7, description: "The Golden City in the Thar Desert, known for its sandstone fort and camel safaris.", attractions: ["Jaisalmer Fort", "Sam Sand Dunes", "Patwon Ki Haveli"], tags: ["Thar Desert", "Golden Fort", "Camel Safari"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 117, name: "Munnar", country: "India", category: "Nature", budgetTier: "Budget", budgetRange: "₹16,000 - ₹26,000", bestTime: "September - May", rating: 4.8, description: "Hill station in Kerala, famous for sprawling green tea gardens and misty hills.", attractions: ["Eravikulam National Park", "Mattupetty Dam", "Anamudi Peak"], tags: ["Tea Farms", "Hills", "Monsoon mist"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 118, name: "Gangtok", country: "India", category: "Mountain", budgetTier: "Budget", budgetRange: "₹20,000 - ₹35,000", bestTime: "October - June", rating: 4.7, description: "Capital of Sikkim, showcasing Tibetan Buddhist culture and snowcapped Himalayan vistas.", attractions: ["Nathula Pass Border", "Rumtek Monastery", "Tsomgo Lake"], tags: ["Tibetan Culture", "Hills", "Snow valleys"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp" },
  { id: 119, name: "Amritsar", country: "India", category: "Cultural", budgetTier: "Budget", budgetRange: "₹10,000 - ₹18,000", bestTime: "October - March", rating: 4.8, description: "Spiritual center for Sikhs, home to the dazzling Golden Temple.", attractions: ["Golden Temple", "Jallianwala Bagh Memorial", "Wagah Border Ceremony"], tags: ["Golden Temple", "Spiritual", "History"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 120, name: "Pondicherry", country: "India", category: "Beach", budgetTier: "Budget", budgetRange: "₹14,000 - ₹22,000", bestTime: "October - March", rating: 4.6, description: "French colonial settlement, famous for yellow villas, beaches, and Auroville community.", attractions: ["Promenade Beach", "Auroville Dome", "French Quarter walk"], tags: ["French architecture", "Beaches", "Serene"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 121, name: "Gokarna", country: "India", category: "Beach", budgetTier: "Budget", budgetRange: "₹10,000 - ₹18,000", bestTime: "October - March", rating: 4.6, description: "Relaxed temple town, famous for pristine secluded beaches and rock climbing.", attractions: ["Om Beach", "Half Moon Beach", "Mahabaleshwar Temple"], tags: ["Beaches", "Temples", "Backpacker vibe"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 122, name: "Coorg", country: "India", category: "Nature", budgetTier: "Mid-range", budgetRange: "₹20,000 - ₹32,000", bestTime: "October - March", rating: 4.7, description: "Scotland of India, popular for rich coffee plantations, waterfalls, and scenic trekking.", attractions: ["Abbey Falls", "Raja's Seat overlook", "Dubare Elephant Camp"], tags: ["Coffee estates", "Greenery", "Waterfalls"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 123, name: "Lonavala", country: "India", category: "Nature", budgetTier: "Budget", budgetRange: "₹12,000 - ₹18,000", bestTime: "July - October", rating: 4.5, description: "Popular monsoon getaway near Mumbai, known for lush valleys, waterfalls, and chikki candy.", attractions: ["Bhushi Dam", "Tiger's Point view", "Karla Caves"], tags: ["Monsoon peaks", "Lush hills", "Waterfalls"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 124, name: "Mahabaleshwar", country: "India", category: "Mountain", budgetTier: "Budget", budgetRange: "₹15,000 - ₹25,000", bestTime: "October - June", rating: 4.6, description: "Hill station in Western Ghats, famous for strawberry gardens, viewpoints, and lakes.", attractions: ["Venna Lake", "Mapro Strawberry Garden", "Arthur's Seat Peak"], tags: ["Hills", "Strawberries", "Scenic valley"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp" },
  { id: 125, name: "Khajuraho", country: "India", category: "Cultural", budgetTier: "Budget", budgetRange: "₹14,000 - ₹22,000", bestTime: "October - March", rating: 4.7, description: "Famous for medieval Hindu and Jain temples with detailed erotic stone carvings.", attractions: ["Kandariya Mahadeva Temple", "Lakshmana Temple", "Light & Sound Show"], tags: ["Medieval Temples", "Stone Art", "Heritage Heritage"], isIndian: true, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },

  // --- INTERNATIONAL (25 DESTINATIONS) ---
  {
    id: 201,
    name: "Bali",
    country: "Indonesia",
    category: "Beach",
    budgetTier: "Budget",
    budgetRange: "₹40,000 - ₹80,000",
    bestTime: "April - October",
    rating: 4.8,
    description: "A tropical paradise featuring gorgeous beaches, active volcano hikes, and ancient heritage temples.",
    attractions: ["Ubud Rice Terraces", "Tanah Lot Temple", "Uluwatu Sunset Temple"],
    tags: ["Beaches", "Romantic getaway", "Surfing", "Temples"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  {
    id: 202,
    name: "Dubai",
    country: "UAE",
    category: "Luxury",
    budgetTier: "Luxury",
    budgetRange: "₹80,000 - ₹1,50,000",
    bestTime: "November - March",
    rating: 4.8,
    description: "Glitzy city known for futuristic skyscrapers, ultra-luxury shopping, and desert safaris.",
    attractions: ["Burj Khalifa", "Dubai Mall Aquarium", "Palm Jumeirah Resort"],
    tags: ["Shopping", "Skyscrapers", "Modern architecture", "Desert Safaris"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 203,
    name: "Paris",
    country: "France",
    category: "Cultural",
    budgetTier: "Luxury",
    budgetRange: "₹1,20,000 - ₹2,50,000",
    bestTime: "April - October",
    rating: 4.8,
    description: "The City of Light, famous for romantic walkways, iconic museums, high fashion, and cafes.",
    attractions: ["Eiffel Tower", "Louvre Museum Palace", "Notre-Dame Cathedral"],
    tags: ["Romantic", "Museums", "Art", "Gourmet dining"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 204,
    name: "London",
    country: "UK",
    category: "Cultural",
    budgetTier: "Luxury",
    budgetRange: "₹1,30,000 - ₹2,60,000",
    bestTime: "May - September",
    rating: 4.7,
    description: "Historic capital of the UK, blending royal palaces, gothic monuments, and museums.",
    attractions: ["Tower of London", "British Museum", "London Eye observation wheel"],
    tags: ["Royal palaces", "Museums", "Historic bridges", "Shopping"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 205,
    name: "Tokyo",
    country: "Japan",
    category: "Cultural",
    budgetTier: "Mid-range",
    budgetRange: "₹90,000 - ₹1,80,000",
    bestTime: "March - May / Oct - Nov",
    rating: 4.9,
    description: "Ultra-modern capital of Japan, famous for tech hubs, Michelin restaurants, shrines, and cherry blossoms.",
    attractions: ["Senso-ji Historic Temple", "Shibuya Pedestrian Crossing", "Tokyo Skytree view"],
    tags: ["Futuristic", "Street Food", "Temples", "Anime culture"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 206,
    name: "Singapore",
    country: "Singapore",
    category: "Cultural",
    budgetTier: "Mid-range",
    budgetRange: "₹60,000 - ₹1,20,000",
    bestTime: "December - June",
    rating: 4.7,
    description: "A global clean green hub, featuring biodomes, futuristic harbors, and local street hawkers.",
    attractions: ["Gardens by the Bay", "Sentosa Island theme park", "Marina Bay Sands Skydeck"],
    tags: ["Futuristic", "Gardens", "Family travel", "Modern malls"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp",
  },
  {
    id: 207,
    name: "Switzerland",
    country: "Switzerland",
    category: "Mountain",
    budgetTier: "Luxury",
    budgetRange: "₹1,50,000 - ₹3,00,000",
    bestTime: "June - September / Dec - Mar",
    rating: 4.9,
    description: "Breathtaking alpine meadows, snow capped peaks, cogwheel trains, and premium ski slopes.",
    attractions: ["Matterhorn Peak", "Jungfraujoch Highest Station", "Lake Geneva shoreline"],
    tags: ["Skiing", "Scenic train ride", "Lakes", "Luxury resort"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp",
  },
  {
    id: 208,
    name: "Maldives",
    country: "Maldives",
    category: "Honeymoon",
    budgetTier: "Luxury",
    budgetRange: "₹1,00,000 - ₹3,00,000",
    bestTime: "November - April",
    rating: 4.9,
    description: "Exquisite private overwater villa resorts set in turquoise coral lagoons, perfect for couples.",
    attractions: ["Male Atoll reefs", "Maafushi island diving", "Overwater spa decks"],
    tags: ["Private Bungalow", "Romantic sunsets", "Scuba reef", "Luxury"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  {
    id: 209,
    name: "Thailand",
    country: "Thailand",
    category: "Beach",
    budgetTier: "Budget",
    budgetRange: "₹35,000 - ₹60,000",
    bestTime: "November - April",
    rating: 4.7,
    description: "Vibrant local street food markets, ornate royal shrines, tropical beaches, and nightlife lanes.",
    attractions: ["Grand Palace Bangkok", "Phi Phi Islands tour", "Patong Beach nightlife"],
    tags: ["Budget flight", "Tropical beaches", "Street food", "Nightlife"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  {
    id: 210,
    name: "Vietnam",
    country: "Vietnam",
    category: "Beach",
    budgetTier: "Budget",
    budgetRange: "₹35,000 - ₹60,000",
    bestTime: "November - April",
    rating: 4.8,
    description: "Rich war history museums, spectacular limestone bays, street food gems, and serene rice valleys.",
    attractions: ["Ha Long Bay cruise", "Hoi An Ancient Lantern Town", "Cu Chi Tunnels trek"],
    tags: ["Budget hostels", "Limestone karsts", "Phở noodles", "History ruins"],
    isIndian: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp",
  },
  { id: 211, name: "New York", country: "USA", category: "Cultural", budgetTier: "Luxury", budgetRange: "₹1,50,000 - ₹2,80,000", bestTime: "April - June / Sep - Nov", rating: 4.8, description: "The Big Apple, famous for skyscrapers, Broadway theaters, Central Park, and galleries.", attractions: ["Times Square", "Statue of Liberty", "Central Park pathways"], tags: ["Skyscrapers", "Broadway Theatre", "Art Galleries"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 212, name: "Rome", country: "Italy", category: "Cultural", budgetTier: "Mid-range", budgetRange: "₹1,10,000 - ₹2,00,000", bestTime: "April - June / Sep - Oct", rating: 4.8, description: "The Eternal City, featuring monumental ancient Colosseum ruins, Vatican landmarks, and pasta dining.", attractions: ["The Colosseum", "Vatican Museum Chapels", "Trevi Fountain coin toss"], tags: ["Ancient History", "Architecture", "Italian Food"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 213, name: "Barcelona", country: "Spain", category: "Beach", budgetTier: "Mid-range", budgetRange: "₹1,00,000 - ₹1,80,000", bestTime: "May - October", rating: 4.7, description: "Cosmopolitan Spanish beach city, famous for Gaudí cathedral architecture, tapas bars, and football.", attractions: ["Sagrada Família Cathedral", "Park Güell mosaics", "La Rambla walk"], tags: ["Gaudí Architecture", "Urban beach", "Tapas crawl"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 214, name: "Istanbul", country: "Turkey", category: "Cultural", budgetTier: "Mid-range", budgetRange: "₹65,000 - ₹1,20,000", bestTime: "April - June / Sep - Nov", rating: 4.7, description: "Bosphorus gateway linking Europe and Asia, packed with historic spice bazaars and mosques.", attractions: ["Hagia Sophia mosque", "Blue Mosque", "Grand Bazaar shopping"], tags: ["Bosphorus Strait", "Historic Mosques", "Spices Grand Bazaar"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 215, name: "Sydney", country: "Australia", category: "Beach", budgetTier: "Luxury", budgetRange: "₹1,40,000 - ₹2,50,000", bestTime: "September - November / Mar - May", rating: 4.8, description: "Australia's largest harbor city, famous for structural Opera House sails, coastal walks, and beaches.", attractions: ["Sydney Opera House", "Bondi Beach surfing", "Darling Harbour walks"], tags: ["Harbour sailings", "Surfing beaches", "Modern capital"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 216, name: "Amsterdam", country: "Netherlands", category: "Cultural", budgetTier: "Mid-range", budgetRange: "₹1,00,000 - ₹1,80,000", bestTime: "April - September", rating: 4.7, description: "Capital of Netherlands, famous for scenic water canals, historic museum collections, and spring tulips.", attractions: ["Rijksmuseum art", "Anne Frank House Museum", "Van Gogh Museum paintings"], tags: ["Canal cruises", "Museums", "Tulip fields"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 217, name: "Cairo", country: "Egypt", category: "Cultural", budgetTier: "Budget", budgetRange: "₹45,000 - ₹80,000", bestTime: "October - April", rating: 4.6, description: "Gateway to the ancient world, famous for Giza Pyramids and scenic Nile cruises.", attractions: ["Giza Pyramids", "Egyptian Antiquities Museum", "Khan el-Khalili Bazaar"], tags: ["Ancient Pyramids", "Mummies history", "Nile cruise"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 218, name: "Cape Town", country: "South Africa", category: "Nature", budgetTier: "Mid-range", budgetRange: "₹90,000 - ₹1,60,000", bestTime: "October - April", rating: 4.8, description: "Coastal city nestled under Table Mountain, popular for vineyards, seal tours, and penguins.", attractions: ["Table Mountain cableway", "Cape of Good Hope hike", "Boulders Beach penguins"], tags: ["Scenic peaks", "Penguin beaches", "Vineyards tours"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 219, name: "Prague", country: "Czech Republic", category: "Cultural", budgetTier: "Budget", budgetRange: "₹60,000 - ₹1,00,000", bestTime: "May - September", rating: 4.7, description: "Capital of Czech Republic, featuring medieval bridges, gothic cathedrals, and beer cellars.", attractions: ["Charles Bridge walks", "Prague Castle complex", "Old Town Square bells"], tags: ["Gothic castles", "Bridges", "Affordable Europe"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 220, name: "Queenstown", country: "New Zealand", category: "Adventure", budgetTier: "Luxury", budgetRange: "₹1,60,000 - ₹3,00,000", bestTime: "December - February / Jun - Aug", rating: 4.9, description: "Adventure capital of New Zealand, famous for bungee jumping, jet boating, and glacier ski fields.", attractions: ["Milford Sound fjord boat", "Coronet Peak ski slopes", "Shotover River Jet boating"], tags: ["Bungee Jump", "Glacier skiing", "Water adventures"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/mountain-adventure-Q6V2CVvpTrLANZMyFudGT9.webp" },
  { id: 221, name: "Rio de Janeiro", country: "Brazil", category: "Beach", budgetTier: "Mid-range", budgetRange: "₹1,20,000 - ₹2,20,000", bestTime: "December - March", rating: 4.7, description: "Vibrant Brazilian harbor city, famous for Samba Carnival, Copacabana sands, and sugarloaf peaks.", attractions: ["Christ the Redeemer Statue", "Copacabana Beach walk", "Sugarloaf Mountain tram"], tags: ["Samba Carnival", "Sandy beaches", "Nightlife"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 222, name: "Santorini", country: "Greece", category: "Honeymoon", budgetTier: "Luxury", budgetRange: "₹1,40,000 - ₹2,80,000", bestTime: "May - October", rating: 4.9, description: "Cycladic island featuring iconic whitewashed buildings, blue domes, and sunsets overlooking the sea caldera.", attractions: ["Oia Village sunsets", "Fira Cliffside walkways", "Caldera sunset cruise"], tags: ["Romantic sunsets", "Greek domes", "Lakeside dining"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 223, name: "Kyoto", country: "Japan", category: "Cultural", budgetTier: "Mid-range", budgetRange: "₹85,000 - ₹1,60,000", bestTime: "March - May / Oct - Nov", rating: 4.8, description: "Historic imperial city of Japan, featuring bamboo forests, shrines, and traditional geisha teahouses.", attractions: ["Fushimi Inari Torii Gates", "Kinkaku-ji Golden Pavilion", "Arashiyama Bamboo Grove"], tags: ["Torii Gates", "Monastery gardens", "Traditional tea houses"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/city-exploration-S649PLnYoeWqXTwbRXN4hY.webp" },
  { id: 224, name: "Venice", country: "Italy", category: "Honeymoon", budgetTier: "Luxury", budgetRange: "₹1,30,000 - ₹2,50,000", bestTime: "April - October", rating: 4.7, description: "Romantic Italian floating city, famous for gondola rides, canals, and Renaissance gothic palaces.", attractions: ["St. Mark's Basilica Square", "Rialto Bridge walk", "Grand Canal Gondola ride"], tags: ["Canal Gondolas", "Romantic cruises", "Bridges ruins"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" },
  { id: 225, name: "Langkawi", country: "Malaysia", category: "Beach", budgetTier: "Budget", budgetRange: "₹35,000 - ₹60,000", bestTime: "October - April", rating: 4.6, description: "Archipelago of tropical islands in Malaysia, famous for white sands, forests, and duty-free shopping.", attractions: ["Langkawi Sky Bridge", "Pantai Cenang Beach", "Kilim Karst Geoforest Park"], tags: ["Tropical Beaches", "Sky Bridge climb", "Duty-free shopping"], isIndian: false, image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663277913813/SvagPhRfUYBjMa8YoXbyc2/hero-destination-VZ2wPExvNymjQuKmtGaKGR.webp" }
];

// =============================================================================
// MESSAGE TYPES & CHAT STRUCTURES
// =============================================================================
interface ItineraryDay {
  day: string;
  activities: string[];
  attractions: string[];
  travelTime: string;
  food: string;
  cost: string;
}

interface BudgetBreakdown {
  transport: string;
  hotel: string;
  food: string;
  activities: string;
  misc: string;
  total: string;
}

interface WeatherReport {
  summary: string;
  temp: string;
  packingList: string[];
  tips: string[];
}

interface RichMessage {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
  type?: "destinations" | "itinerary" | "budget" | "weather" | "text";
  destinations?: Destination[];
  itinerary?: ItineraryDay[];
  budget?: BudgetBreakdown;
  weather?: WeatherReport;
}

// Helper function to parse basic markdown tags (###, **, and bullet points) and render clean styled HTML
const renderFormattedText = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const content = line.trim();
    if (!content) {
      return <div key={i} className="h-2" />;
    }

    let rawText = line;
    let isHeading = false;
    let isListItem = false;

    if (rawText.startsWith("### ")) {
      rawText = rawText.replace("### ", "");
      isHeading = true;
    } else if (rawText.startsWith("- ") || rawText.startsWith("* ") || rawText.startsWith("• ")) {
      rawText = rawText.replace(/^[-*•]\s+/, "");
      isListItem = true;
    } else if (/^\d+\.\s+/.test(rawText)) {
      rawText = rawText.replace(/^\d+\.\s+/, "");
      isListItem = true;
    }

    // Process bold text **bold**
    const parts = rawText.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pIdx} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isHeading) {
      return (
        <h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1.5 border-b border-border pb-1">
          {renderedParts}
        </h4>
      );
    }
    if (isListItem) {
      return (
        <li key={i} className="list-disc list-inside ml-2 text-xs leading-relaxed mb-1 text-muted-foreground">
          {renderedParts}
        </li>
      );
    }
    return (
      <p key={i} className="leading-relaxed mb-1 text-xs sm:text-sm text-foreground">
        {renderedParts}
      </p>
    );
  });
};

export default function ChatAssistant() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<RichMessage[]>([
    {
      id: 1,
      text: "Hi! I am your AI Travel Copilot. Tap any Quick Action on the left or type your destination in the box, and I'll generate itineraries, budgets, and recommendations instantly!",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatCardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll local container only, keeping browser window scroll locked
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await apiFetch("/api/chat/history");
        if (res && res.data) {
          if (res.data.session) {
            setSessionId(res.data.session);
          }
          if (res.data.messages && res.data.messages.length > 0) {
            const mapped: RichMessage[] = res.data.messages.map((m: any, idx: number) => {
              const content = m.content;
              const queryLower = content.toLowerCase();
              let type: "destinations" | "itinerary" | "budget" | "weather" | "text" = "text";
              let destinations: Destination[] = [];
              let itinerary: ItineraryDay[] = [];
              let budget: BudgetBreakdown | undefined;
              let weather: WeatherReport | undefined;

              if (m.role === "model") {
                if (queryLower.includes("5-day forecast") || queryLower.includes("weather forecast") || queryLower.includes("forecast for")) {
                  type = "weather";
                  const matchingCity = DESTINATIONS_DB.find(d => queryLower.includes(d.name.toLowerCase())) || DESTINATIONS_DB[0];
                  const isCold = matchingCity.category === "Mountain" || matchingCity.name.includes("Alps") || matchingCity.name.includes("Manali") || matchingCity.name.includes("Shimla") || matchingCity.name.includes("Ladakh");
                  weather = {
                    summary: isCold ? "Cold & Snowy, crisp alpine breezes" : "Warm & Tropical, pleasant coastal winds",
                    temp: isCold ? "6°C" : "28°C",
                    packingList: isCold
                      ? ["Thermal innerwear layers", "Heavy wool sweaters/jackets", "Moisture-wicking socks & snow boots", "Polarized ski goggles / sunglasses"]
                      : ["Breathable cotton shirts/shorts", "Sunglasses & Sunscreen (SPF 50+)", "Swimwear and flip-flops", "Comfortable walking sneakers"],
                    tips: isCold
                      ? ["Wear layers to adjust to heating indoors.", "Stay hydrated—cold dry air dries throat fast.", "Keep power banks close as cold drains phone batteries."]
                      : ["Stay hydrated, carry water bottles everywhere.", "Protect against sunburn—UV index is high.", "Pack insect repellent for forest treks."],
                  };
                } else if (queryLower.includes("3-day itinerary") || queryLower.includes("itinerary for") || queryLower.includes("day 1:")) {
                  type = "itinerary";
                  const matchingCity = DESTINATIONS_DB.find(d => queryLower.includes(d.name.toLowerCase())) || DESTINATIONS_DB[0];
                  itinerary = [
                    {
                      day: "Day 1: Arrival & Exploring Heritage Landmarks",
                      activities: [
                        "Morning: Check-in at accommodation and explore the nearby cafes.",
                        "Afternoon: Head directly to the main heritage zone: " + matchingCity.attractions[0],
                        "Evening: Enjoy dinner and local delicacies at a top rated restaurant."
                      ],
                      attractions: [matchingCity.attractions[0], "Local Spice/Artisan Market"],
                      travelTime: "25 mins local transit",
                      food: "Local signature dishes (Average cost: ₹600 per meal)",
                      cost: "₹1,200 (attractions & taxi)",
                    },
                    {
                      day: "Day 2: Adventure Activities & Nature Walk",
                      activities: [
                        "Morning: Trek or take local tour to " + (matchingCity.attractions[1] || "Nature Reserves"),
                        "Afternoon: Engage in local activities (water sports / skiing / sightseeing)",
                        "Evening: Sunset photography session and souvenir shopping"
                      ],
                      attractions: [matchingCity.attractions[1] || "Scenic Viewpoints", "Handicrafts hub"],
                      travelTime: "45 mins roundtrip drive",
                      food: "Authentic local eateries (Average cost: ₹500 per meal)",
                      cost: "₹2,500 (rafting / pass fees & rental gear)",
                    },
                    {
                      day: "Day 3: Scenic Leisure & Departure",
                      activities: [
                        "Morning: Enjoy sunrise views at " + (matchingCity.attractions[2] || "lakeside / valley valley"),
                        "Afternoon: Pack up bags, buy specialty local foods/teas/spices",
                        "Evening: Airport shuttle ride for departure flight"
                      ],
                      attractions: [matchingCity.attractions[2] || "Quiet local gardens"],
                      travelTime: "1 hour airport transit",
                      food: "Lakeside/Cafeteria brunch (Average cost: ₹450)",
                      cost: "₹800 (shopping & transit)",
                    }
                  ];
                } else if (queryLower.includes("budget advice") || queryLower.includes("daily base cost") || queryLower.includes("saving tips")) {
                  type = "budget";
                  const matchingCity = DESTINATIONS_DB.find(d => queryLower.includes(d.name.toLowerCase())) || DESTINATIONS_DB[0];
                  let multiplier = 1;
                  if (matchingCity.budgetTier === "Luxury") multiplier = 2.5;
                  else if (matchingCity.budgetTier === "Mid-range") multiplier = 1.6;
                  budget = {
                    transport: "₹" + Math.round(12000 * multiplier).toLocaleString(),
                    hotel: "₹" + Math.round(15000 * multiplier).toLocaleString(),
                    food: "₹" + Math.round(7000 * multiplier).toLocaleString(),
                    activities: "₹" + Math.round(5000 * multiplier).toLocaleString(),
                    misc: "₹" + Math.round(3000 * multiplier).toLocaleString(),
                    total: "₹" + Math.round(42000 * multiplier).toLocaleString(),
                  };
                } else if (queryLower.includes("recommend these top destinations") || queryLower.includes("spotlight:")) {
                  type = "destinations";
                  destinations = findMatchingDestinations(content);
                }
              }

              return {
                id: idx,
                text: content,
                sender: m.role === "user" ? "user" : "ai",
                timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                type,
                destinations,
                itinerary,
                budget,
                weather,
              };
            });
            setMessages(mapped);
          }
        }
      } catch (err: any) {
        console.error("Failed to load history", err);
      }
    }
    loadHistory();

    // Load session user and profile pic
    const session = localStorage.getItem("session_user");
    if (session) {
      try {
        const parsedObj = JSON.parse(session);
        setSessionUser(parsedObj);
        const savedPic = localStorage.getItem(`profile_pic_${parsedObj.email}`);
        if (savedPic) {
          setProfileImage(savedPic);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get("topic");
    if (topicParam) {
      handleTriggerAIQuery(topicParam);
    }
  }, []);

  // Filter 50 destinations pool dynamically based on user keywords
  const findMatchingDestinations = (query: string, limit = 3): Destination[] => {
    const queryLower = query.toLowerCase();
    
    let filtered = DESTINATIONS_DB;

    if (queryLower.includes("honeymoon") || queryLower.includes("romantic") || queryLower.includes("couple")) {
      filtered = DESTINATIONS_DB.filter(d => d.category === "Honeymoon" || d.tags.includes("Romantic") || d.name === "Maldives" || d.name === "Venice" || d.name === "Udaipur");
    } else if (queryLower.includes("beach")) {
      filtered = DESTINATIONS_DB.filter(d => d.category === "Beach" || d.tags.includes("Beaches"));
    } else if (queryLower.includes("mountain") || queryLower.includes("hill") || queryLower.includes("snow")) {
      filtered = DESTINATIONS_DB.filter(d => d.category === "Mountain" || d.tags.includes("Hills") || d.tags.includes("Snow"));
    } else if (queryLower.includes("adventure") || queryLower.includes("trek") || queryLower.includes("biking")) {
      filtered = DESTINATIONS_DB.filter(d => d.category === "Adventure" || d.tags.includes("Adventure") || d.tags.includes("Trekking") || d.tags.includes("Biking Trails"));
    } else if (queryLower.includes("culture") || queryLower.includes("historic") || queryLower.includes("heritage") || queryLower.includes("temple")) {
      filtered = DESTINATIONS_DB.filter(d => d.category === "Cultural" || d.tags.includes("Heritage") || d.tags.includes("Temples"));
    } else if (queryLower.includes("nature") || queryLower.includes("green") || queryLower.includes("forest")) {
      filtered = DESTINATIONS_DB.filter(d => d.category === "Nature" || d.tags.includes("Greenery") || d.tags.includes("Forest"));
    }

    // Budget checks
    if (queryLower.includes("luxury")) {
      filtered = filtered.filter(d => d.budgetTier === "Luxury");
    } else if (queryLower.includes("budget travel") || queryLower.includes("cheap") || queryLower.includes("affordable")) {
      filtered = filtered.filter(d => d.budgetTier === "Budget");
    }

    // Geography checks
    if (queryLower.includes("international")) {
      filtered = filtered.filter(d => !d.isIndian);
    } else if (queryLower.includes("india") || queryLower.includes("domestic")) {
      filtered = filtered.filter(d => d.isIndian);
    } else if (queryLower.includes("weekend")) {
      filtered = filtered.filter(d => d.isIndian && (d.category === "Nature" || d.category === "Adventure" || d.category === "Mountain" || d.name === "Lonavala" || d.name === "Shimla" || d.name === "Ooty"));
    }

    // Default search matching city name
    const matchByName = DESTINATIONS_DB.filter(d => queryLower.includes(d.name.toLowerCase()));
    if (matchByName.length > 0) {
      return matchByName.slice(0, limit);
    }

    // Fallback selection
    if (filtered.length === 0) {
      filtered = DESTINATIONS_DB;
    }

    // Return shuffled/limited items
    return [...filtered].sort(() => 0.5 - Math.random()).slice(0, limit);
  };

  // Generate smart response based on query
  const handleTriggerAIQuery = async (queryText: string) => {
    // Scroll chat area card into center view smoothly (avoids getting stuck at page bottom)
    setTimeout(() => {
      chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus();
    }, 100);

    const userMsg: RichMessage = {
      id: Date.now(),
      text: queryText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await apiFetch("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({
          message: queryText,
          session: sessionId,
        }),
      });

      if (res && res.data) {
        const replyText = res.data.reply;
        const newSession = res.data.session;
        if (newSession && newSession !== sessionId) {
          setSessionId(newSession);
        }

        const queryLower = queryText.toLowerCase();
        let type: "destinations" | "itinerary" | "budget" | "weather" | "text" = "text";
        let destinations: Destination[] = [];
        let itinerary: ItineraryDay[] = [];
        let budget: BudgetBreakdown | undefined;
        let weather: WeatherReport | undefined;

        // Apply same keyword patterns to show cards matching the text responses
        if (queryLower.includes("plan my trip") || queryLower.includes("itinerary") || queryLower.includes("plan a trip to") || queryLower.includes("plan trip")) {
          type = "itinerary";
          const matchingCity = DESTINATIONS_DB.find(d => queryLower.includes(d.name.toLowerCase())) || DESTINATIONS_DB[0];
          itinerary = [
            {
              day: "Day 1: Arrival & Exploring Heritage Landmarks",
              activities: [
                "Morning: Check-in at accommodation and explore the nearby cafes.",
                "Afternoon: Head directly to the main heritage zone: " + matchingCity.attractions[0],
                "Evening: Enjoy dinner and local delicacies at a top rated restaurant."
              ],
              attractions: [matchingCity.attractions[0], "Local Spice/Artisan Market"],
              travelTime: "25 mins local transit",
              food: "Local signature dishes (Average cost: ₹600 per meal)",
              cost: "₹1,200 (attractions & taxi)",
            },
            {
              day: "Day 2: Adventure Activities & Nature Walk",
              activities: [
                "Morning: Trek or take local tour to " + (matchingCity.attractions[1] || "Nature Reserves"),
                "Afternoon: Engage in local activities (water sports / skiing / sightseeing)",
                "Evening: Sunset photography session and souvenir shopping"
              ],
              attractions: [matchingCity.attractions[1] || "Scenic Viewpoints", "Handicrafts hub"],
              travelTime: "45 mins roundtrip drive",
              food: "Authentic local eateries (Average cost: ₹500 per meal)",
              cost: "₹2,500 (rafting / pass fees & rental gear)",
            },
            {
              day: "Day 3: Scenic Leisure & Departure",
              activities: [
                "Morning: Enjoy sunrise views at " + (matchingCity.attractions[2] || "lakeside / valley valley"),
                "Afternoon: Pack up bags, buy specialty local foods/teas/spices",
                "Evening: Airport shuttle ride for departure flight"
              ],
              attractions: [matchingCity.attractions[2] || "Quiet local gardens"],
              travelTime: "1 hour airport transit",
              food: "Lakeside/Cafeteria brunch (Average cost: ₹450)",
              cost: "₹800 (shopping & transit)",
            }
          ];
        } else if (queryLower.includes("budget") || queryLower.includes("cost") || queryLower.includes("price") || queryLower.includes("how much") || queryLower.includes("rupee")) {
          type = "budget";
          const matchingCity = DESTINATIONS_DB.find(d => queryLower.includes(d.name.toLowerCase())) || DESTINATIONS_DB[0];
          let multiplier = 1;
          if (matchingCity.budgetTier === "Luxury") multiplier = 2.5;
          else if (matchingCity.budgetTier === "Mid-range") multiplier = 1.6;
          budget = {
            transport: "₹" + Math.round(12000 * multiplier).toLocaleString(),
            hotel: "₹" + Math.round(15000 * multiplier).toLocaleString(),
            food: "₹" + Math.round(7000 * multiplier).toLocaleString(),
            activities: "₹" + Math.round(5000 * multiplier).toLocaleString(),
            misc: "₹" + Math.round(3000 * multiplier).toLocaleString(),
            total: "₹" + Math.round(42000 * multiplier).toLocaleString(),
          };
        } else if (queryLower.includes("weather") || queryLower.includes("temp") || queryLower.includes("forecast") || queryLower.includes("pack") || queryLower.includes("clothing")) {
          type = "weather";
          const matchingCity = DESTINATIONS_DB.find(d => queryLower.includes(d.name.toLowerCase())) || DESTINATIONS_DB[0];
          const isCold = matchingCity.category === "Mountain" || matchingCity.name.includes("Alps") || matchingCity.name.includes("Manali") || matchingCity.name.includes("Shimla") || matchingCity.name.includes("Ladakh");
          weather = {
            summary: isCold ? "Cold & Snowy, crisp alpine breezes" : "Warm & Tropical, pleasant coastal winds",
            temp: isCold ? "6°C" : "28°C",
            packingList: isCold
              ? ["Thermal innerwear layers", "Heavy wool sweaters/jackets", "Moisture-wicking socks & snow boots", "Polarized ski goggles / sunglasses"]
              : ["Breathable cotton shirts/shorts", "Sunglasses & Sunscreen (SPF 50+)", "Swimwear and flip-flops", "Comfortable walking sneakers"],
            tips: isCold
              ? ["Wear layers to adjust to heating indoors.", "Stay hydrated—cold dry air dries throat fast.", "Keep power banks close as cold drains phone batteries."]
              : ["Stay hydrated, carry water bottles everywhere.", "Protect against sunburn—UV index is high.", "Pack insect repellent for forest treks."],
          };
        } else if (
          queryLower.includes("recommend") ||
          queryLower.includes("where to go") ||
          queryLower.includes("beach") ||
          queryLower.includes("adventure") ||
          queryLower.includes("mountain") ||
          queryLower.includes("honeymoon") ||
          queryLower.includes("solo") ||
          queryLower.includes("family") ||
          queryLower.includes("budget") ||
          queryLower.includes("luxury") ||
          queryLower.includes("weekend") ||
          queryLower.includes("international") ||
          queryLower.includes("trip ideas")
        ) {
          type = "destinations";
          destinations = findMatchingDestinations(queryText);
        }

        const aiMsg: RichMessage = {
          id: Date.now() + 1,
          text: replyText,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type,
          destinations,
          itinerary,
          budget,
          weather,
        };

        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to talk to travel assistant.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const currentQuery = inputText;
    setInputText("");
    handleTriggerAIQuery(currentQuery);
    // Retain focus on the input field to prevent mobile keyboard from collapsing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && inputText.trim()) {
        handleSendMessage();
      }
    }
  };

  // Structured list of categorized quick actions (15 actions total)
  const sidebarQuickActions = [
    {
      group: "Core Planner",
      items: [
        { label: "Recommend Destination", query: "Recommend me some popular travel destinations" },
        { label: "Plan Trip", query: "Plan my trip to Bali" },
        { label: "Calculate Budget", query: "Calculate budget for a trip to Kashmir" },
        { label: "Check Weather", query: "What is the weather like in Shimla?" },
        { label: "Plan Route", query: "Plan route from Mumbai to Goa" },
      ],
    },
    {
      group: "Trip Styles",
      items: [
        { label: "Solo Travel", query: "Recommend best safe destinations for solo travel" },
        { label: "Family Trip", query: "Suggest fun destinations for a family trip" },
        { label: "Honeymoon Ideas", query: "Suggest romantic honeymoon ideas" },
      ],
    },
    {
      group: "Themes",
      items: [
        { label: "Adventure spots", query: "Recommend top adventure destinations" },
        { label: "Beach escapes", query: "Show me beautiful beach destinations" },
        { label: "Mountain peaks", query: "Show me scenic mountain destinations" },
      ],
    },
    {
      group: "Budget & Scope",
      items: [
        { label: "Budget Travel", query: "Show me affordable budget travel destinations" },
        { label: "Luxury Travel", query: "Show me premium luxury travel ideas" },
        { label: "Weekend Getaways", query: "Show me weekend getaways from city life" },
        { label: "International Trips", query: "Show me popular international trips" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground font-semibold flex items-center gap-1">
            ← Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Logo className="w-6 h-6 text-primary animate-pulse" />
              AI Travel Copilot
            </h1>
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
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* 1. SIDEBAR: Quick Actions Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border border-border shadow-sm p-5 bg-card text-card-foreground rounded-xl">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-1.5 text-base border-b border-border pb-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  Travel Assistant
                </h3>

                <div className="space-y-4 max-h-[350px] lg:max-h-[600px] overflow-y-auto pr-1">
                  {sidebarQuickActions.map((group) => (
                    <div key={group.group} className="space-y-1.5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">{group.group}</p>
                      {group.items.map((action) => (
                        <button
                          key={action.label}
                          disabled={isTyping}
                          className="w-full text-left text-xs font-semibold px-3 py-2 border border-border rounded-lg bg-muted/40 text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all font-sans cursor-pointer flex items-center justify-between"
                          onClick={() => handleTriggerAIQuery(action.query)}
                        >
                          {action.label}
                          <span className="text-[10px] text-muted-foreground">→</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Travel Tip of the Day */}
              <Card className="border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/5 dark:bg-amber-950/10 p-5 rounded-xl shadow-sm">
                <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 text-sm mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                  Tip of the Day
                </h4>
                <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-sans font-medium">
                  "Pack a thin microfiber towel. It dries 10x faster than normal cotton towels and rolls down to just 15% of the size in your backpack!"
                </p>
              </Card>

              {/* AI Travel Insights */}
              <Card className="border border-primary/20 bg-primary/5 p-5 rounded-xl shadow-sm">
                <h4 className="font-bold text-primary flex items-center gap-1.5 text-sm mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Travel Insights
                </h4>
                <ul className="space-y-2 text-xs text-foreground/80 font-medium">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>Flight booking prices are cheapest on Tuesday nights.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>Scuba diving in Havelock is best done before 11 AM.</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* 2. CHAT INTERFACE AREA */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Dynamic Chat Dialog Card */}
              <Card ref={chatCardRef} className="border border-border shadow-sm overflow-hidden flex flex-col h-[550px] md:h-[600px] bg-card text-card-foreground rounded-xl">
                
                {/* Chat window Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-sm text-foreground">AI Travel Copilot</span>
                  </div>
                  {messages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await apiFetch("/api/chat/history", { method: "DELETE" });
                          setMessages([{
                            id: 1,
                            text: "Hi! I am your AI Travel Copilot. Tap any Quick Action on the left or type your destination in the box, and I'll generate itineraries, budgets, and recommendations instantly!",
                            sender: "ai",
                            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            type: "text",
                          }]);
                          setSessionId("");
                          toast.success("Chat history cleared!");
                        } catch (err: any) {
                          toast.error("Failed to clear chat log.");
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Chat
                    </Button>
                  )}
                </div>

                {/* Chat Stream Messages */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-muted/5 to-card"
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[92%] sm:max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 shadow-sm ${
                        msg.sender === "user"
                          ? "bg-secondary/15 text-secondary border-secondary/20"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}>
                        {msg.sender === "user" ? (
                          profileImage ? (
                            <img src={profileImage} alt="User" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>

                      {/* Bubble and Card */}
                      <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} w-full`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-xs text-sm break-words leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                              : "bg-muted/40 text-foreground border border-border rounded-tl-none font-normal"
                          }`}
                        >
                          <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                        </div>

                        {/* Timestamp */}
                        <span className="text-[9px] text-muted-foreground font-semibold mt-1 px-1">
                          {msg.timestamp}
                        </span>

                        {/* --- Adaptive Card rendering based on message type --- */}
                        {msg.sender === "ai" && msg.type === "destinations" && msg.destinations && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full max-w-[95%]">
                            {msg.destinations.map((dest) => (
                              <Card
                                key={dest.id}
                                onClick={() => navigate(`/destinations/${dest.id >= 200 ? dest.id - 200 : dest.id - 100}`)}
                                className="border border-border bg-card text-card-foreground shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
                              >
                                <div className="h-32 overflow-hidden relative">
                                  <img
                                    src={dest.image}
                                    alt={dest.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800";
                                    }}
                                  />
                                  <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-foreground border border-border shadow-xs">
                                    {dest.category}
                                  </div>
                                </div>
                                <div className="p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-primary" />
                                      {dest.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                      <Star className="w-3 h-3 fill-amber-500" />
                                      {dest.rating}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{dest.description}</p>
                                  <div className="text-[11px] font-semibold text-muted-foreground bg-muted/65 p-2 rounded">
                                    <div>💰 Budget: <span className="text-primary font-bold">{dest.budgetRange}</span></div>
                                    <div>🌤️ Best Time: <span className="text-foreground">{dest.bestTime}</span></div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {dest.tags.slice(0, 3).map(tag => (
                                      <span key={tag} className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-1.5 py-0.5 rounded">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-xs h-8 mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/planner?destination=${encodeURIComponent(dest.name)}`);
                                    }}
                                  >
                                    Plan Trip Here
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}

                        {msg.sender === "ai" && msg.type === "itinerary" && msg.itinerary && (
                          <div className="space-y-3 mt-4 w-full max-w-[95%]">
                            {msg.itinerary.map((day, idx) => (
                              <Card key={idx} className="border border-border bg-card text-card-foreground p-4 rounded-xl shadow-sm space-y-2">
                                <h4 className="font-bold text-foreground text-xs sm:text-sm border-b border-border pb-1.5 flex items-center justify-between">
                                  <span>{day.day}</span>
                                  <span className="text-[10px] text-muted-foreground font-medium">⏱️ {day.travelTime}</span>
                                </h4>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                  {day.activities.map((act, aIdx) => (
                                    <li key={aIdx} className="leading-relaxed font-medium flex items-start gap-1.5">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span>{act}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-foreground bg-muted/65 p-2 rounded mt-2">
                                  <div>🍲 Food: <span className="text-foreground font-medium">{day.food}</span></div>
                                  <div>💰 Cost: <span className="text-primary">{day.cost}</span></div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}

                        {msg.sender === "ai" && msg.type === "budget" && msg.budget && (
                          <Card className="border border-primary/20 bg-primary/5 p-5 rounded-xl shadow-sm mt-4 w-full max-w-[90%] space-y-3">
                            <h4 className="font-bold text-primary text-sm border-b border-primary/25 pb-2 flex items-center gap-1.5">
                              <IndianRupee className="w-4 h-4" />
                              Estimated 5-Day Expense Planner
                            </h4>
                            <div className="space-y-2 text-xs font-semibold text-muted-foreground">
                              <div className="flex justify-between">
                                <span>🏨 Hotel / Accommodation:</span>
                                <span className="text-foreground">{msg.budget.hotel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>✈️ Transport / Cab fares:</span>
                                <span className="text-foreground">{msg.budget.transport}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>🍲 Food & Fine dining:</span>
                                <span className="text-foreground">{msg.budget.food}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>🎢 Activities & Ticketing:</span>
                                <span className="text-foreground">{msg.budget.activities}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>🛡️ Misc / Emergencies:</span>
                                <span className="text-foreground">{msg.budget.misc}</span>
                              </div>
                              <div className="flex justify-between border-t border-primary/25 pt-2 text-sm font-bold text-primary">
                                <span>Total Estimated Budget:</span>
                                <span>{msg.budget.total}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-xs h-9 mt-2"
                              onClick={() => {
                                const cleanB = msg.budget?.total.replace(/[^0-9]/g, "");
                                navigate(`/planner?budget=${cleanB}`);
                              }}
                            >
                              Apply Budget to Trip Planner
                            </Button>
                          </Card>
                        )}

                        {msg.sender === "ai" && msg.type === "weather" && msg.weather && (
                          <Card className="border border-secondary/20 bg-secondary/5 p-5 rounded-xl shadow-sm mt-4 w-full max-w-[90%] space-y-3">
                            <h4 className="font-bold text-secondary text-sm border-b border-secondary/25 pb-2 flex items-center gap-1.5">
                              <Cloud className="w-4 h-4" />
                              Weather & Packing Advisory
                            </h4>
                            <div className="flex items-center gap-4 py-1">
                              <span className="text-4xl">☀️</span>
                              <div>
                                <p className="text-sm font-bold text-foreground">Forecast: {msg.weather.summary}</p>
                                <p className="text-xs font-semibold text-muted-foreground">Average Temp: {msg.weather.temp}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-foreground">👜 Packing Checklist Essentials:</p>
                              <ul className="space-y-1 text-[11px] text-muted-foreground">
                                {msg.weather.packingList.map((item, idx) => (
                                  <li key={idx} className="flex gap-1.5 items-center font-medium">
                                    <span className="text-secondary font-bold">✓</span> {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2 border-t border-secondary/25 pt-2">
                              <p className="text-xs font-bold text-foreground">💡 Travel Tips:</p>
                              <ul className="space-y-1 text-[11px] text-muted-foreground italic leading-relaxed">
                                {msg.weather.tips.map((tip, idx) => (
                                  <li key={idx}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state Suggestions Dashboard */}
                  {messages.length === 1 && (
                    <div className="mt-4 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                      <div className="text-center py-4 space-y-2">
                        <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 text-primary items-center justify-center border border-primary/20 shadow-xs animate-bounce">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Plan Your Next Trip Instantly</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Ask for itineraries, detailed budgets, packing tips, or destination lists. Tap any suggestion below to start!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[
                          { title: "🗺️ Suggest Destinations", query: "Suggest popular destinations for my next vacation", desc: "Discover perfect vacation spots" },
                          { title: "💰 Create a Budget Trip", query: "Calculate budget for a trip to Kashmir", desc: "Get detailed cost estimates" },
                          { title: "🏨 Recommend Hotels", query: "Recommend top-rated hotels in popular places", desc: "Find the best places to stay" },
                          { title: "🎒 Things to do Nearby", query: "What are the top things to do in Goa?", desc: "Explore local activities & events" }
                        ].map((item) => (
                          <Card
                            key={item.title}
                            onClick={() => handleTriggerAIQuery(item.query)}
                            className="p-4 hover:bg-primary/5 border border-border bg-card hover:border-primary/30 cursor-pointer transition-all duration-300 rounded-xl hover:-translate-y-0.5 group flex flex-col justify-between"
                          >
                            <div>
                              <h5 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h5>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                            <span className="text-[10px] text-primary font-bold mt-3.5 flex items-center gap-1 font-sans">
                              Try this <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {isTyping && (
                    <div className="flex items-start gap-3 animate-in fade-in duration-200">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="bg-muted/40 border border-border text-muted-foreground rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5 min-w-[60px] justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area Form */}
                <div className="border-t border-border p-4 bg-card shrink-0">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      ref={inputRef}
                      placeholder="Ask AI: 'Plan my trip to Kashmir' or 'Budget for Tokyo'..."
                      className="flex-1 min-h-[44px] h-[44px] max-h-32 py-3 px-4 resize-none rounded-xl border border-border bg-muted/20 text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/60 shadow-sm leading-normal text-sm"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center w-11 h-11 shrink-0 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      onClick={handleSendMessage}
                      disabled={isTyping || !inputText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 3. SUGGESTED QUESTIONS GRID */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 font-sans">
                  <HelpCircle className="w-5 h-5 text-secondary" />
                  Suggested Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Plan my trip to Kashmir",
                    "Suggest romantic Honeymoon Ideas",
                    "What is the budget for 5 days in Bali?",
                    "What packing items are required for the Swiss Alps?",
                    "Show me safe destinations for Solo Travel",
                    "Show me weekend getaways in India",
                  ].map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      className="border-border text-foreground hover:bg-muted h-auto py-3 justify-start text-left bg-card font-medium font-sans text-xs sm:text-sm shadow-xs rounded-xl cursor-pointer"
                      onClick={() => handleTriggerAIQuery(question)}
                      disabled={isTyping}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 4. TRENDING DESTINATIONS SECTION */}
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5 font-sans">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Trending Destinations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Indian Trending */}
                  <Card className="border border-border bg-card text-card-foreground p-5 rounded-xl shadow-xs">
                    <h4 className="font-bold text-xs sm:text-sm mb-3 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                      🇮🇳 Popular Indian Escapes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["Kashmir", "Goa", "Ladakh", "Udaipur", "Rishikesh"].map(city => (
                        <button
                          key={city}
                          disabled={isTyping}
                          className="text-xs font-semibold px-3 py-1.5 bg-muted/40 border border-border rounded-full hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all font-sans cursor-pointer"
                          onClick={() => handleTriggerAIQuery(`Recommend attractions and itinerary for ${city}`)}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* International Trending */}
                  <Card className="border border-border bg-card text-card-foreground p-5 rounded-xl shadow-xs">
                    <h4 className="font-bold text-xs sm:text-sm mb-3 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                      🌍 Popular International Escapes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["Maldives", "Switzerland", "Tokyo", "Paris", "Singapore"].map(city => (
                        <button
                          key={city}
                          disabled={isTyping}
                          className="text-xs font-semibold px-3 py-1.5 bg-muted/40 border border-border rounded-full hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all font-sans cursor-pointer"
                          onClick={() => handleTriggerAIQuery(`Recommend details and budget for ${city}`)}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Chat Controls */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted bg-card font-sans font-semibold h-11 rounded-xl shadow-xs cursor-pointer"
                  onClick={() => toast.success("Chat history successfully exported as text!")}
                >
                  Export Conversation
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive bg-card font-sans font-semibold h-11 rounded-xl shadow-xs cursor-pointer"
                  onClick={async () => {
                    try {
                      await apiFetch("/api/chat/history", { method: "DELETE" });
                      setMessages([{
                        id: 1,
                        text: "Hi! I am your AI Travel Copilot. Tap any Quick Action on the left or type your destination in the box, and I'll generate itineraries, budgets, and recommendations instantly!",
                        sender: "ai",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        type: "text",
                      }]);
                      setSessionId("");
                      toast.success("Chat history cleared!");
                    } catch (err: any) {
                      toast.error("Failed to clear chat log.");
                    }
                  }}
                >
                  Clear Chat Logs
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
