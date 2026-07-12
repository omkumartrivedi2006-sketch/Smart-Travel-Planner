import mongoose from "mongoose";
import { Destination } from "./models/Destination";
import { Weather } from "./models/Weather";
import { logger } from "./utils/logger";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const baseDestinations = [
  // --- 50 Indian Destinations ---
  {
    name: "Goa",
    city: "Goa Velha",
    state: "Goa",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 15.2993,
    longitude: 74.1240,
    averageBudget: 3500,
    rating: 4.6,
    shortDescription: "Famous for sandy beaches, vibrant nightlife, and Portuguese heritage."
  },
  {
    name: "Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    category: "City" as const,
    latitude: 19.0760,
    longitude: 72.8777,
    averageBudget: 6000,
    rating: 4.5,
    shortDescription: "India's financial capital, known for Bollywood, street food, and historic landmarks."
  },
  {
    name: "New Delhi",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    continent: "Asia",
    category: "City" as const,
    latitude: 28.6139,
    longitude: 77.2090,
    averageBudget: 4500,
    rating: 4.4,
    shortDescription: "India's capital with iconic monuments, rich history, and vibrant street life."
  },
  {
    name: "Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 26.9124,
    longitude: 75.7873,
    averageBudget: 4000,
    rating: 4.5,
    shortDescription: "The Pink City of India, showing magnificent forts and royal palaces."
  },
  {
    name: "Agra",
    city: "Agra",
    state: "Uttar Pradesh",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 27.1767,
    longitude: 78.0081,
    averageBudget: 3500,
    rating: 4.8,
    shortDescription: "Home of the Taj Mahal, showcasing prime Mughal architecture."
  },
  {
    name: "Srinagar",
    city: "Srinagar",
    state: "Jammu and Kashmir",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 34.0837,
    longitude: 74.7973,
    averageBudget: 4500,
    rating: 4.8,
    shortDescription: "Known as Paradise on Earth, famous for snow mountains and serene Dal Lake."
  },
  {
    name: "Leh",
    city: "Leh",
    state: "Ladakh",
    country: "India",
    continent: "Asia",
    category: "Adventure" as const,
    latitude: 34.1526,
    longitude: 77.5770,
    averageBudget: 5500,
    rating: 4.9,
    shortDescription: "A high-altitude cold desert offering road trips, monasteries, and valleys."
  },
  {
    name: "Munnar",
    city: "Munnar",
    state: "Kerala",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 10.0889,
    longitude: 77.0595,
    averageBudget: 4200,
    rating: 4.7,
    shortDescription: "Famous for its emerald green tea gardens, misty hills, and winding roads."
  },
  {
    name: "Varanasi",
    city: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 25.3176,
    longitude: 82.9739,
    averageBudget: 2500,
    rating: 4.6,
    shortDescription: "One of the oldest living cities, famous for spiritual ghats and Ganges Aarti."
  },
  {
    name: "Udaipur",
    city: "Udaipur",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 24.5854,
    longitude: 73.7125,
    averageBudget: 5000,
    rating: 4.7,
    shortDescription: "The City of Lakes, renowned for romantic floating palaces and heritage tours."
  },
  {
    name: "Rishikesh",
    city: "Rishikesh",
    state: "Uttarakhand",
    country: "India",
    continent: "Asia",
    category: "Adventure" as const,
    latitude: 30.0869,
    longitude: 78.2676,
    averageBudget: 3000,
    rating: 4.6,
    shortDescription: "Yoga Capital of the World, offering river rafting and spiritual ashrams."
  },
  {
    name: "Manali",
    city: "Manali",
    state: "Himachal Pradesh",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 32.2396,
    longitude: 77.1887,
    averageBudget: 4000,
    rating: 4.6,
    shortDescription: "A beautiful mountain valley known for paragliding, snow sports, and trekking."
  },
  {
    name: "Shimla",
    city: "Shimla",
    state: "Himachal Pradesh",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 31.1048,
    longitude: 77.1734,
    averageBudget: 4200,
    rating: 4.5,
    shortDescription: "Former British summer capital with colonial architecture and scenic ridges."
  },
  {
    name: "Port Blair",
    city: "Port Blair",
    state: "Andaman and Nicobar Islands",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 11.7401,
    longitude: 92.6586,
    averageBudget: 7500,
    rating: 4.7,
    shortDescription: "Stunning island archipelago featuring crystal clear waters and coral reefs."
  },
  {
    name: "Jaisalmer",
    city: "Jaisalmer",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 26.9157,
    longitude: 70.9083,
    averageBudget: 3800,
    rating: 4.5,
    shortDescription: "Golden City rising from the Thar Desert, famous for fort stays and camel safaris."
  },
  {
    name: "Alleppey",
    city: "Alappuzha",
    state: "Kerala",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 9.4981,
    longitude: 76.3388,
    averageBudget: 4500,
    rating: 4.7,
    shortDescription: "Famed for its tranquil backwaters, palm canals, and houseboats."
  },
  {
    name: "Ooty",
    city: "Ootacamund",
    state: "Tamil Nadu",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 11.4102,
    longitude: 76.6950,
    averageBudget: 3800,
    rating: 4.5,
    shortDescription: "Known as Queen of Hill Stations, featuring beautiful tea estates and lakes."
  },
  {
    name: "Darjeeling",
    city: "Darjeeling",
    state: "West Bengal",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 27.0410,
    longitude: 88.2627,
    averageBudget: 4000,
    rating: 4.6,
    shortDescription: "Famed for black tea, stunning views of Kanchenjunga, and toy train rides."
  },
  {
    name: "Amritsar",
    city: "Amritsar",
    state: "Punjab",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 31.6340,
    longitude: 74.8723,
    averageBudget: 3000,
    rating: 4.8,
    shortDescription: "Spiritual home of the Golden Temple, rich history, and delicious Punjabi food."
  },
  {
    name: "Hampi",
    city: "Hampi",
    state: "Karnataka",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 15.3350,
    longitude: 76.4600,
    averageBudget: 2800,
    rating: 4.7,
    shortDescription: "UNESCO World Heritage Site with spectacular ruins of the Vijayanagara Empire."
  },
  {
    name: "Khajuraho",
    city: "Khajuraho",
    state: "Madhya Pradesh",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 24.8518,
    longitude: 79.9214,
    averageBudget: 3200,
    rating: 4.5,
    shortDescription: "Famous for ancient temples with intricate and erotic stone carvings."
  },
  {
    name: "Mysore",
    city: "Mysuru",
    state: "Karnataka",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 12.2958,
    longitude: 76.6394,
    averageBudget: 3500,
    rating: 4.6,
    shortDescription: "City of Palaces, renowned for royal heritage, silk, and sandalwood."
  },
  {
    name: "Pondicherry",
    city: "Puducherry",
    state: "Puducherry",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 11.9416,
    longitude: 79.8083,
    averageBudget: 3600,
    rating: 4.5,
    shortDescription: "Former French colony offering yellow colonial buildings, cafes, and beaches."
  },
  {
    name: "Jodhpur",
    city: "Jodhpur",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 26.2389,
    longitude: 73.0243,
    averageBudget: 4000,
    rating: 4.6,
    shortDescription: "The Blue City, home to the imposing Mehrangarh Fort overlooking the sands."
  },
  {
    name: "Ranthambore",
    city: "Sawai Madhopur",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 25.9928,
    longitude: 76.3883,
    averageBudget: 6500,
    rating: 4.5,
    shortDescription: "Prime tiger reserve with historic ruins scattered inside the national park."
  },
  {
    name: "Mahabalipuram",
    city: "Mamallapuram",
    state: "Tamil Nadu",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 12.6269,
    longitude: 80.1929,
    averageBudget: 3500,
    rating: 4.5,
    shortDescription: "Coastal town famous for historic rock-cut Shore Temples and stone carvings."
  },
  {
    name: "Gangtok",
    city: "Gangtok",
    state: "Sikkim",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 27.3314,
    longitude: 88.6138,
    averageBudget: 4500,
    rating: 4.7,
    shortDescription: "Clean capital of Sikkim offering views of the Himalayas and monasteries."
  },
  {
    name: "Kaziranga",
    city: "Kaziranga",
    state: "Assam",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 26.5775,
    longitude: 93.1711,
    averageBudget: 5000,
    rating: 4.6,
    shortDescription: "Home to the world's largest population of great Indian one-horned rhinoceros."
  },
  {
    name: "Lonavala",
    city: "Lonavala",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 18.7544,
    longitude: 73.4059,
    averageBudget: 3500,
    rating: 4.3,
    shortDescription: "Popular weekend getaway from Mumbai, famous for green valleys and waterfalls."
  },
  {
    name: "Mahabaleshwar",
    city: "Mahabaleshwar",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 17.9258,
    longitude: 73.6558,
    averageBudget: 4200,
    rating: 4.4,
    shortDescription: "Strawberry capital of India, featuring elevated viewpoints and evergreen forests."
  },
  {
    name: "Kodaikanal",
    city: "Kodaikanal",
    state: "Tamil Nadu",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 10.2381,
    longitude: 77.4892,
    averageBudget: 3800,
    rating: 4.5,
    shortDescription: "Misty hill station featuring a star-shaped lake and forest trails."
  },
  {
    name: "Wayanad",
    city: "Kalpetta",
    state: "Kerala",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 11.6854,
    longitude: 76.1320,
    averageBudget: 4000,
    rating: 4.5,
    shortDescription: "Lush green region featuring spice plantations, waterfalls, and caves."
  },
  {
    name: "Coorg",
    city: "Madikeri",
    state: "Karnataka",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 12.3375,
    longitude: 75.8069,
    averageBudget: 4500,
    rating: 4.6,
    shortDescription: "Known as the Scotland of India, famous for coffee plantations and mist."
  },
  {
    name: "Haridwar",
    city: "Haridwar",
    state: "Uttarakhand",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 29.9457,
    longitude: 78.1642,
    averageBudget: 2200,
    rating: 4.6,
    shortDescription: "Ancient city where the Ganges emerges, famous for holy bathing ghats."
  },
  {
    name: "Nainital",
    city: "Nainital",
    state: "Uttarakhand",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 29.3803,
    longitude: 79.4636,
    averageBudget: 3800,
    rating: 4.5,
    shortDescription: "Scenic lake district surrounded by mountains, popular for boating."
  },
  {
    name: "Mussoorie",
    city: "Mussoorie",
    state: "Uttarakhand",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 30.4599,
    longitude: 78.0664,
    averageBudget: 4000,
    rating: 4.5,
    shortDescription: "Queen of the Hills, offering panoramic views of the Shivalik range."
  },
  {
    name: "Tirupati",
    city: "Tirupati",
    state: "Andhra Pradesh",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 13.6288,
    longitude: 79.4192,
    averageBudget: 2500,
    rating: 4.8,
    shortDescription: "Home to the sacred hilltop Venkateswara Temple, one of the most visited shrines."
  },
  {
    name: "Madurai",
    city: "Madurai",
    state: "Tamil Nadu",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 9.9252,
    longitude: 78.1198,
    averageBudget: 2800,
    rating: 4.6,
    shortDescription: "Historic city famous for the grand Meenakshi Amman Temple complex."
  },
  {
    name: "Puri",
    city: "Puri",
    state: "Odisha",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 19.8135,
    longitude: 85.8312,
    averageBudget: 2600,
    rating: 4.5,
    shortDescription: "Famous beach city, home of the sacred Jagannath Temple and annual Rath Yatra."
  },
  {
    name: "Konark",
    city: "Konark",
    state: "Odisha",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 19.8876,
    longitude: 86.0945,
    averageBudget: 2800,
    rating: 4.7,
    shortDescription: "Renowned for the architectural marvel of the 13th-century Sun Temple chariot."
  },
  {
    name: "Shillong",
    city: "Shillong",
    state: "Meghalaya",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 25.5788,
    longitude: 91.8933,
    averageBudget: 4000,
    rating: 4.6,
    shortDescription: "Scotland of the East, famous for pine forests, waterfalls, and rock music."
  },
  {
    name: "Cherrapunji",
    city: "Sohra",
    state: "Meghalaya",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 25.2702,
    longitude: 91.7324,
    averageBudget: 4200,
    rating: 4.7,
    shortDescription: "One of the wettest places on Earth, famous for living root bridges."
  },
  {
    name: "Gokarna",
    city: "Gokarna",
    state: "Karnataka",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 14.5479,
    longitude: 74.3188,
    averageBudget: 2800,
    rating: 4.5,
    shortDescription: "Quiet beach town, home to holy Mahabaleshwar temple and pristine shores."
  },
  {
    name: "Kovalam",
    city: "Trivandrum",
    state: "Kerala",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 8.4004,
    longitude: 76.9787,
    averageBudget: 4500,
    rating: 4.6,
    shortDescription: "Popular beach town famous for lighthouse beach and Ayurvedic massage."
  },
  {
    name: "Pushkar",
    city: "Pushkar",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 26.4897,
    longitude: 74.5511,
    averageBudget: 2500,
    rating: 4.4,
    shortDescription: "Sacred town with a holy lake, Brahma Temple, and famous camel fair."
  },
  {
    name: "Mount Abu",
    city: "Mount Abu",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 24.5925,
    longitude: 72.7156,
    averageBudget: 4000,
    rating: 4.4,
    shortDescription: "Rajasthan's only hill station, famous for the Dilwara Jain Temples."
  },
  {
    name: "Ajanta & Ellora",
    city: "Aurangabad",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 20.5519,
    longitude: 75.7031,
    averageBudget: 3500,
    rating: 4.8,
    shortDescription: "Historic rock-cut caves with stunning Buddhist paintings and stone carvings."
  },
  {
    name: "Khajjiar",
    city: "Khajjiar",
    state: "Himachal Pradesh",
    country: "India",
    continent: "Asia",
    category: "Nature" as const,
    latitude: 32.5534,
    longitude: 76.0656,
    averageBudget: 3500,
    rating: 4.5,
    shortDescription: "Mini Switzerland of India, featuring dense pine forests and a central lake."
  },
  {
    name: "Diu",
    city: "Diu",
    state: "Daman and Diu",
    country: "India",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 20.7144,
    longitude: 70.9874,
    averageBudget: 3500,
    rating: 4.3,
    shortDescription: "Quiet coastal enclave with a historic Portuguese fort and calm beaches."
  },
  {
    name: "Dwarka",
    city: "Dwarka",
    state: "Gujarat",
    country: "India",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 22.2442,
    longitude: 68.9685,
    averageBudget: 2800,
    rating: 4.7,
    shortDescription: "Ancient kingdom of Lord Krishna, featuring the grand Dwarkadhish Temple."
  },

  // --- 51 International Destinations ---
  {
    name: "Paris",
    city: "Paris",
    state: "Île-de-France",
    country: "France",
    continent: "Europe",
    category: "City" as const,
    latitude: 48.8566,
    longitude: 2.3522,
    averageBudget: 15000,
    rating: 4.6,
    shortDescription: "Capital of France, famous for art, fashion, gastronomy, and the Eiffel Tower."
  },
  {
    name: "London",
    city: "London",
    state: "Greater London",
    country: "United Kingdom",
    continent: "Europe",
    category: "City" as const,
    latitude: 51.5074,
    longitude: -0.1278,
    averageBudget: 16000,
    rating: 4.5,
    shortDescription: "Capital of the UK, home to Big Ben, British Museum, and Royal Palaces."
  },
  {
    name: "Tokyo",
    city: "Tokyo",
    state: "Tokyo",
    country: "Japan",
    continent: "Asia",
    category: "City" as const,
    latitude: 35.6762,
    longitude: 139.6503,
    averageBudget: 12000,
    rating: 4.8,
    shortDescription: "Mix of neon skyscrapers and historic temples, known for sushi and tech."
  },
  {
    name: "Singapore",
    city: "Singapore",
    state: "Singapore",
    country: "Singapore",
    continent: "Asia",
    category: "City" as const,
    latitude: 1.3521,
    longitude: 103.8198,
    averageBudget: 13000,
    rating: 4.7,
    shortDescription: "Modern city-state famous for Gardens by the Bay and hawker street food."
  },
  {
    name: "Male",
    city: "Male",
    state: "Kaafu Atoll",
    country: "Maldives",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 4.1755,
    longitude: 73.5093,
    averageBudget: 20000,
    rating: 4.9,
    shortDescription: "Luxury tropical paradise of overwater villas, lagoons, and coral reefs."
  },
  {
    name: "Interlaken",
    city: "Interlaken",
    state: "Bern",
    country: "Switzerland",
    continent: "Europe",
    category: "Mountain" as const,
    latitude: 46.6863,
    longitude: 7.8632,
    averageBudget: 18000,
    rating: 4.8,
    shortDescription: "Swiss adventure capital nestled between alpine peaks and clear lakes."
  },
  {
    name: "Bangkok",
    city: "Bangkok",
    state: "Bangkok",
    country: "Thailand",
    continent: "Asia",
    category: "City" as const,
    latitude: 13.7563,
    longitude: 100.5018,
    averageBudget: 4500,
    rating: 4.6,
    shortDescription: "Bustling capital known for golden temples, floating markets, and street food."
  },
  {
    name: "Hanoi",
    city: "Hanoi",
    state: "Hanoi",
    country: "Vietnam",
    continent: "Asia",
    category: "City" as const,
    latitude: 21.0285,
    longitude: 105.8542,
    averageBudget: 3500,
    rating: 4.7,
    shortDescription: "Rich culture, French-colonial architecture, lakes, and Halong Bay tours."
  },
  {
    name: "Rome",
    city: "Rome",
    state: "Lazio",
    country: "Italy",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 41.9028,
    longitude: 12.4964,
    averageBudget: 11000,
    rating: 4.8,
    shortDescription: "Sprawling historical capital, home to the Colosseum, Vatican, and pasta."
  },
  {
    name: "Barcelona",
    city: "Barcelona",
    state: "Catalonia",
    country: "Spain",
    continent: "Europe",
    category: "Beach" as const,
    latitude: 41.3851,
    longitude: 2.1734,
    averageBudget: 10000,
    rating: 4.6,
    shortDescription: "Coastal city famous for Gaudí architecture, beaches, and tapas culture."
  },
  {
    name: "New York",
    city: "New York",
    state: "New York",
    country: "United States",
    continent: "North America",
    category: "City" as const,
    latitude: 40.7128,
    longitude: -74.0060,
    averageBudget: 18000,
    rating: 4.7,
    shortDescription: "The city that never sleeps, home to Broadway, Central Park, and skyline."
  },
  {
    name: "Sydney",
    city: "Sydney",
    state: "New South Wales",
    country: "Australia",
    continent: "Oceania",
    category: "City" as const,
    latitude: -33.8688,
    longitude: 151.2093,
    averageBudget: 14000,
    rating: 4.7,
    shortDescription: "Harbor city famous for the Opera House, Harbour Bridge, and Bondi Beach."
  },
  {
    name: "Cairo",
    city: "Cairo",
    state: "Cairo",
    country: "Egypt",
    continent: "Africa",
    category: "Heritage" as const,
    latitude: 30.0444,
    longitude: 31.2357,
    averageBudget: 3500,
    rating: 4.4,
    shortDescription: "Ancient capital on the Nile, home to the Pyramids of Giza and Sphinx."
  },
  {
    name: "Cape Town",
    city: "Cape Town",
    state: "Western Cape",
    country: "South Africa",
    continent: "Africa",
    category: "Nature" as const,
    latitude: -33.9249,
    longitude: 18.4241,
    averageBudget: 7000,
    rating: 4.7,
    shortDescription: "Scenic harbor city overlooked by Table Mountain, with vineyards and penguins."
  },
  {
    name: "Dubai",
    city: "Dubai",
    state: "Dubai",
    country: "United Arab Emirates",
    continent: "Asia",
    category: "City" as const,
    latitude: 25.2048,
    longitude: 55.2708,
    averageBudget: 15000,
    rating: 4.8,
    shortDescription: "Global luxury city known for Burj Khalifa, desert safaris, and malls."
  },
  {
    name: "Amsterdam",
    city: "Amsterdam",
    state: "North Holland",
    country: "Netherlands",
    continent: "Europe",
    category: "City" as const,
    latitude: 52.3676,
    longitude: 4.9041,
    averageBudget: 12000,
    rating: 4.6,
    shortDescription: "Famed canal networks, historic houses, museums, and cycling culture."
  },
  {
    name: "Venice",
    city: "Venice",
    state: "Veneto",
    country: "Italy",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 45.4408,
    longitude: 12.3155,
    averageBudget: 14000,
    rating: 4.7,
    shortDescription: "Romantic city built on canals, famous for gondola rides and St. Mark's."
  },
  {
    name: "Florence",
    city: "Florence",
    state: "Tuscany",
    country: "Italy",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 43.7696,
    longitude: 11.2558,
    averageBudget: 12000,
    rating: 4.7,
    shortDescription: "Birthplace of the Renaissance, home to masterpiece art and Duomo dome."
  },
  {
    name: "Istanbul",
    city: "Istanbul",
    state: "Istanbul",
    country: "Turkey",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 41.0082,
    longitude: 28.9784,
    averageBudget: 5000,
    rating: 4.7,
    shortDescription: "Bridge between Europe and Asia, famous for Hagia Sophia and Grand Bazaar."
  },
  {
    name: "Prague",
    city: "Prague",
    state: "Prague",
    country: "Czech Republic",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 50.0755,
    longitude: 14.4378,
    averageBudget: 6000,
    rating: 4.6,
    shortDescription: "City of a Hundred Spires, known for its Gothic architecture and Old Town."
  },
  {
    name: "Vienna",
    city: "Vienna",
    state: "Vienna",
    country: "Austria",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 48.2082,
    longitude: 16.3738,
    averageBudget: 11000,
    rating: 4.6,
    shortDescription: "City of music, famous for imperial palaces, classical music, and coffeehouses."
  },
  {
    name: "Athens",
    city: "Athens",
    state: "Attica",
    country: "Greece",
    continent: "Europe",
    category: "Heritage" as const,
    latitude: 37.9838,
    longitude: 23.7275,
    averageBudget: 7500,
    rating: 4.5,
    shortDescription: "Cradle of Western civilization, dominated by the ancient Acropolis."
  },
  {
    name: "Santorini",
    city: "Fira",
    state: "Cyclades",
    country: "Greece",
    continent: "Europe",
    category: "Beach" as const,
    latitude: 36.3932,
    longitude: 25.4615,
    averageBudget: 16000,
    rating: 4.8,
    shortDescription: "Stunning volcanic island famous for whitewashed cliffside towns and sunsets."
  },
  {
    name: "Reykjavik",
    city: "Reykjavik",
    state: "Capital Region",
    country: "Iceland",
    continent: "Europe",
    category: "Nature" as const,
    latitude: 64.1466,
    longitude: -21.9426,
    averageBudget: 15000,
    rating: 4.7,
    shortDescription: "Gateway to Iceland's waterfalls, hot springs, glaciers, and Northern Lights."
  },
  {
    name: "Queenstown",
    city: "Queenstown",
    state: "Otago",
    country: "New Zealand",
    continent: "Oceania",
    category: "Adventure" as const,
    latitude: -45.0312,
    longitude: 168.6626,
    averageBudget: 13000,
    rating: 4.9,
    shortDescription: "Adventure capital of the Southern Hemisphere, known for bungee and skiing."
  },
  {
    name: "Rio de Janeiro",
    city: "Rio de Janeiro",
    state: "Rio de Janeiro",
    country: "Brazil",
    continent: "South America",
    category: "Beach" as const,
    latitude: -22.9068,
    longitude: -43.1729,
    averageBudget: 7000,
    rating: 4.6,
    shortDescription: "Famed Copacabana and Ipanema beaches, Christ the Redeemer, and Carnival."
  },
  {
    name: "Buenos Aires",
    city: "Buenos Aires",
    state: "Capital Federal",
    country: "Argentina",
    continent: "South America",
    category: "City" as const,
    latitude: -34.6037,
    longitude: -58.3816,
    averageBudget: 5000,
    rating: 4.5,
    shortDescription: "Paris of South America, known for tango, architecture, and steak."
  },
  {
    name: "Machu Picchu",
    city: "Aguas Calientes",
    state: "Cusco",
    country: "Peru",
    continent: "South America",
    category: "Heritage" as const,
    latitude: -13.1631,
    longitude: -72.5450,
    averageBudget: 12000,
    rating: 4.9,
    shortDescription: "Ancient Incan citadel high in the Andes mountains, a world wonder."
  },
  {
    name: "Toronto",
    city: "Toronto",
    state: "Ontario",
    country: "Canada",
    continent: "North America",
    category: "City" as const,
    latitude: 43.6532,
    longitude: -79.3832,
    averageBudget: 13000,
    rating: 4.5,
    shortDescription: "Diverse Canadian metropolis, home to the CN Tower and shopping."
  },
  {
    name: "Vancouver",
    city: "Vancouver",
    state: "British Columbia",
    country: "Canada",
    continent: "North America",
    category: "Nature" as const,
    latitude: 49.2827,
    longitude: -123.1207,
    averageBudget: 14000,
    rating: 4.7,
    shortDescription: "Scenic coastal city backed by snow mountains, famous for nature trails."
  },
  {
    name: "San Francisco",
    city: "San Francisco",
    state: "California",
    country: "United States",
    continent: "North America",
    category: "City" as const,
    latitude: 37.7749,
    longitude: -122.4194,
    averageBudget: 17000,
    rating: 4.6,
    shortDescription: "Famous for the Golden Gate Bridge, cable cars, and rolling hills."
  },
  {
    name: "Los Angeles",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    continent: "North America",
    category: "City" as const,
    latitude: 34.0522,
    longitude: -118.2437,
    averageBudget: 16000,
    rating: 4.5,
    shortDescription: "Home of Hollywood, Santa Monica beach, theme parks, and movie stars."
  },
  {
    name: "Honolulu",
    city: "Honolulu",
    state: "Hawaii",
    country: "United States",
    continent: "North America",
    category: "Beach" as const,
    latitude: 21.3069,
    longitude: -157.8583,
    averageBudget: 18000,
    rating: 4.8,
    shortDescription: "Hawaii's capital, famous for Waikiki Beach, surfing, and volcanic craters."
  },
  {
    name: "Bali",
    city: "Denpasar",
    state: "Bali",
    country: "Indonesia",
    continent: "Asia",
    category: "Beach" as const,
    latitude: -8.4095,
    longitude: 115.1889,
    averageBudget: 5500,
    rating: 4.7,
    shortDescription: "Tropical island paradise of beaches, volcanic mountains, and Hindu culture."
  },
  {
    name: "Kuala Lumpur",
    city: "Kuala Lumpur",
    state: "Federal Territory",
    country: "Malaysia",
    continent: "Asia",
    category: "City" as const,
    latitude: 3.1390,
    longitude: 101.6869,
    averageBudget: 4500,
    rating: 4.5,
    shortDescription: "Famous for the Petronas Twin Towers, shopping, and diverse food culture."
  },
  {
    name: "Phuket",
    city: "Phuket Town",
    state: "Phuket",
    country: "Thailand",
    continent: "Asia",
    category: "Beach" as const,
    latitude: 7.8804,
    longitude: 98.3922,
    averageBudget: 5000,
    rating: 4.6,
    shortDescription: "Thailand's resort island, famous for nightlife, diving, and sandy beaches."
  },
  {
    name: "Siem Reap",
    city: "Siem Reap",
    state: "Siem Reap",
    country: "Cambodia",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 13.3633,
    longitude: 103.8564,
    averageBudget: 3500,
    rating: 4.7,
    shortDescription: "Gateway to the ancient sprawling temple complex of Angkor Wat."
  },
  {
    name: "Seoul",
    city: "Seoul",
    state: "Seoul",
    country: "South Korea",
    continent: "Asia",
    category: "City" as const,
    latitude: 37.5665,
    longitude: 126.9780,
    averageBudget: 9500,
    rating: 4.7,
    shortDescription: "Tech-forward capital mixing K-pop and street food with royal palaces."
  },
  {
    name: "Hong Kong",
    city: "Hong Kong",
    state: "Hong Kong",
    country: "Hong Kong",
    continent: "Asia",
    category: "City" as const,
    latitude: 22.3193,
    longitude: 114.1694,
    averageBudget: 12000,
    rating: 4.6,
    shortDescription: "Dense harbor city famous for Victoria Peak views and dim sum dining."
  },
  {
    name: "Shanghai",
    city: "Shanghai",
    state: "Shanghai",
    country: "China",
    continent: "Asia",
    category: "City" as const,
    latitude: 31.2304,
    longitude: 121.4737,
    averageBudget: 9000,
    rating: 4.6,
    shortDescription: "Global financial hub featuring the Bund waterfront and modern towers."
  },
  {
    name: "Beijing",
    city: "Beijing",
    state: "Beijing",
    country: "China",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 39.9042,
    longitude: 116.4074,
    averageBudget: 8500,
    rating: 4.7,
    shortDescription: "Capital of China, home to the Forbidden City and Great Wall tours."
  },
  {
    name: "Kyoto",
    city: "Kyoto",
    state: "Kyoto Prefecture",
    country: "Japan",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 35.0116,
    longitude: 135.7681,
    averageBudget: 11000,
    rating: 4.8,
    shortDescription: "Former capital known for classical temples, gardens, and geisha culture."
  },
  {
    name: "Chiang Mai",
    city: "Chiang Mai",
    state: "Chiang Mai",
    country: "Thailand",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 18.7883,
    longitude: 98.9853,
    averageBudget: 3500,
    rating: 4.6,
    shortDescription: "Mountainous city in northern Thailand, famous for old temples and sanctuaries."
  },
  {
    name: "Pokhara",
    city: "Pokhara",
    state: "Gandaki",
    country: "Nepal",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 28.2096,
    longitude: 83.9856,
    averageBudget: 2500,
    rating: 4.7,
    shortDescription: "Scenic lake town at the foot of the Annapurna range, popular for treks."
  },
  {
    name: "Kathmandu",
    city: "Kathmandu",
    state: "Bagmati",
    country: "Nepal",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 27.7172,
    longitude: 85.3240,
    averageBudget: 2200,
    rating: 4.5,
    shortDescription: "Historic valley capital, famous for temples, durbar squares, and trekking."
  },
  {
    name: "Paro",
    city: "Paro",
    state: "Paro District",
    country: "Bhutan",
    continent: "Asia",
    category: "Mountain" as const,
    latitude: 27.4287,
    longitude: 89.4173,
    averageBudget: 8000,
    rating: 4.8,
    shortDescription: "Scenic valley home to the famous cliffside Tiger's Nest Monastery."
  },
  {
    name: "Thimphu",
    city: "Thimphu",
    state: "Thimphu District",
    country: "Bhutan",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 27.4728,
    longitude: 89.6393,
    averageBudget: 7500,
    rating: 4.6,
    shortDescription: "Capital of Bhutan, famous for Buddhist sites, fortress chortens, and nature."
  },
  {
    name: "Colombo",
    city: "Colombo",
    state: "Western Province",
    country: "Sri Lanka",
    continent: "Asia",
    category: "City" as const,
    latitude: 6.9271,
    longitude: 79.8612,
    averageBudget: 3200,
    rating: 4.4,
    shortDescription: "Coastal commercial capital, mixing colonial history with modern towers."
  },
  {
    name: "Marrakech",
    city: "Marrakech",
    state: "Marrakesh-Safi",
    country: "Morocco",
    continent: "Africa",
    category: "Heritage" as const,
    latitude: 31.6295,
    longitude: -7.9811,
    averageBudget: 5500,
    rating: 4.6,
    shortDescription: "Imperial city featuring Medina alleys, colorful souks, and palaces."
  },
  {
    name: "Petra",
    city: "Wadi Musa",
    state: "Ma'an Governorate",
    country: "Jordan",
    continent: "Asia",
    category: "Heritage" as const,
    latitude: 30.3285,
    longitude: 35.4444,
    averageBudget: 11000,
    rating: 4.9,
    shortDescription: "Famous rose-red archaeological city carved directly into sandstone cliffs."
  },
  {
    name: "Berlin",
    city: "Berlin",
    state: "Berlin",
    country: "Germany",
    continent: "Europe",
    category: "City" as const,
    latitude: 52.5200,
    longitude: 13.4050,
    averageBudget: 9500,
    rating: 4.5,
    shortDescription: "Germany's capital city, famous for art, techno music, and Cold War history."
  },
  {
    name: "Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    continent: "Asia",
    category: "Culture" as const,
    latitude: 22.5726,
    longitude: 88.3639,
    averageBudget: 3000,
    rating: 4.6,
    shortDescription: "City of Joy, famous for literary heritage, grand colonial architecture, and Durga Puja festival."
  },
  {
    name: "Vatican City",
    city: "Vatican City",
    state: "Vatican State",
    country: "Vatican City",
    continent: "Europe",
    category: "Culture" as const,
    latitude: 41.9029,
    longitude: 12.4534,
    averageBudget: 12000,
    rating: 4.8,
    shortDescription: "The heart of the Catholic Church, home to St. Peter's Basilica and the Vatican Museums."
  },
  {
    name: "Osaka",
    city: "Osaka",
    state: "Osaka Prefecture",
    country: "Japan",
    continent: "Asia",
    category: "Food" as const,
    latitude: 34.6937,
    longitude: 135.5023,
    averageBudget: 10000,
    rating: 4.8,
    shortDescription: "Japan's kitchen, famous for street food like takoyaki, okonomiyaki, and neon-lit Dotonbori."
  },
  {
    name: "Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    continent: "Asia",
    category: "Food" as const,
    latitude: 17.3850,
    longitude: 78.4867,
    averageBudget: 3500,
    rating: 4.7,
    shortDescription: "City of Pearls, world-famous for Hyderabadi Biryani, Haleem, and Nizami cuisine."
  },
  {
    name: "Penang",
    city: "George Town",
    state: "Penang",
    country: "Malaysia",
    continent: "Asia",
    category: "Food" as const,
    latitude: 5.4141,
    longitude: 100.3288,
    averageBudget: 5000,
    rating: 4.7,
    shortDescription: "Culinary capital of Malaysia, renowned for George Town street food, laksa, and char kway teow."
  },
  {
    name: "Milan",
    city: "Milan",
    state: "Lombardy",
    country: "Italy",
    continent: "Europe",
    category: "Shopping" as const,
    latitude: 45.4642,
    longitude: 9.1900,
    averageBudget: 15000,
    rating: 4.7,
    shortDescription: "Global fashion capital, famous for high-end designer shopping galleries and Gothic Duomo."
  },
  {
    name: "Istanbul Grand Bazaar",
    city: "Istanbul",
    state: "Istanbul",
    country: "Turkey",
    continent: "Europe",
    category: "Shopping" as const,
    latitude: 41.0108,
    longitude: 28.9680,
    averageBudget: 5000,
    rating: 4.7,
    shortDescription: "Bustling historical shopping center, the largest covered market in the world with spice stalls."
  }
];

function expandDestination(base: any) {
  const isIndia = base.country.toLowerCase() === "india";
  const regionName = base.city || base.name;

  // Set default images based on category
  let defaultImages = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3"
  ];
  if (base.category === "Mountain") {
    defaultImages = [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa"
    ];
  } else if (base.category === "City") {
    defaultImages = [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c",
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd"
    ];
  } else if (base.category === "Heritage") {
    defaultImages = [
      "https://images.unsplash.com/photo-1477584322902-471a53b9d433",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523",
      "https://images.unsplash.com/photo-1595928642581-f50f4f3453a5"
    ];
  } else if (base.category === "Nature") {
    defaultImages = [
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2",
      "https://images.unsplash.com/photo-1509060464153-4466739f78d0",
      "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9"
    ];
  } else if (base.category === "Adventure") {
    defaultImages = [
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597",
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2",
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3"
    ];
  } else if (base.category === "Culture") {
    defaultImages = [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b"
    ];
  } else if (base.category === "Food") {
    defaultImages = [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187"
    ];
  } else if (base.category === "Shopping") {
    defaultImages = [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
      "https://images.unsplash.com/photo-1472851294608-062f824d296e"
    ];
  }

  // Predefined lists based on categories
  const categoryTemplates: Record<string, {
    famousFor: string;
    activities: string[];
    topAttractions: string[];
    localCuisine: string[];
    transportationOptions: string[];
    nearestAirport: string;
    nearestRailwayStation: string;
    languagesSpoken: string[];
    currency: string;
    safetyInformation: string;
    travelTips: string;
    durationRecommendation: string;
    weatherInformation: string;
  }> = {
    Beach: {
      famousFor: "Golden sandy shores, water sports, delicious seafood, and relaxing beach resorts.",
      activities: ["Snorkeling", "Jet Skiing", "Beach Volleyball", "Sunset Cruise", "Scuba Diving"],
      topAttractions: ["Main Beach Promenade", "Historic Lighthouse", "Marine Conservation Center", "Coral Reef Bay"],
      localCuisine: ["Grilled Snapper", "Coconut Shrimp Curry", "Tropical Fruit Platter", "Fresh Oyster Shooters"],
      transportationOptions: ["E-Auto", "Scooter Rental", "Ferry Boat", "Local Taxi"],
      nearestAirport: isIndia ? "Dabolim Airport" : `${regionName} International Airport`,
      nearestRailwayStation: isIndia ? "Madgaon Railway Junction" : `${regionName} Central Station`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Local Dialect"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Always swim in designated zones. Keep an eye on high tide warnings and follow lifeguard instructions.",
      travelTips: "Carry high SPF sunscreen, stay hydrated, and carry lightweight cotton clothing.",
      durationRecommendation: "3-5 Days",
      weatherInformation: "Warm tropical climate. Temperatures hover between 24°C and 32°C year-round."
    },
    Mountain: {
      famousFor: "Soaring peaks, lush pine forests, panoramic viewpoints, and winter snow adventure.",
      activities: ["Trekking", "Paragliding", "Mountain Biking", "Scenic Cable Car Ride", "River Crossing"],
      topAttractions: ["Snowy Ridge Viewpoint", "Pine Forest Trail", "Scenic Valley Lookout", "Ancient Monastery"],
      localCuisine: ["Hot Vegetable Steamed Momos", "Thukpa Noodle Soup", "Traditional Herbal Tea", "Spiced Potatoes"],
      transportationOptions: ["Shared SUV", "Local Bus", "Mountain Cable Car", "Taxi"],
      nearestAirport: isIndia ? "Bhuntar Airport" : `${regionName} Mountain Airport`,
      nearestRailwayStation: isIndia ? "Shimla Toy Train Station" : `${regionName} Foothill Station`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Mountain Dialect"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Watch out for steep roads and potential landslides during monsoons. Keep warm clothing ready.",
      travelTips: "Dress in multiple layers, carry basic emergency first aid, and acclimatize to the high altitude.",
      durationRecommendation: "4-6 Days",
      weatherInformation: "Cool alpine climate. Summers are pleasant (15°C - 22°C), winters are cold and snowy (-2°C - 8°C)."
    },
    City: {
      famousFor: "Futuristic skyscrapers, massive shopping districts, rich historic streets, and diverse dining scenes.",
      activities: ["City Sightseeing Tour", "High-end Shopping", "Museum Hopping", "Skyline Dining", "Street Photography"],
      topAttractions: ["Downtown Skyline Tower", "Historic Central Square", "National Museum", "City Botanical Garden"],
      localCuisine: ["Local Street Food Platter", "Gourmet Fusion Dishes", "Artisanal Dessert Assortment", "Specialty Coffee"],
      transportationOptions: ["Metro Train", "Electric Tram", "Ride-share App", "Double-decker Bus"],
      nearestAirport: `${regionName} International Airport`,
      nearestRailwayStation: `${regionName} Central Terminal`,
      languagesSpoken: isIndia ? ["English", "Hindi", "State Language"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Secure your personal belongings in crowded areas. Be aware of pickpockets on public transit.",
      travelTips: "Get a rechargeable smart transit card, download offline city maps, and wear comfortable walking shoes.",
      durationRecommendation: "2-4 Days",
      weatherInformation: "Moderate climate with seasonal variations. Temperatures average around 18°C to 28°C."
    },
    Heritage: {
      famousFor: "Stunning ancient palaces, historic fortresses, complex stone carvings, and vibrant folklore.",
      activities: ["Guided Monument Tour", "Traditional Art Workshop", "Cultural Music Show", "Local Bazaar Exploration", "Photography"],
      topAttractions: ["Royal Heritage Palace", "Medieval Stone Fort", "Ancient Archaeological Site", "Monumental Archway"],
      localCuisine: ["Traditional Festive Meal", "Savory Lentil Dumplings", "Royal Milk Sweets", "Spiced Flatbreads"],
      transportationOptions: ["Tuk-Tuk", "Heritage Horse Carriage", "Local Cab", "Bicycle Rental"],
      nearestAirport: isIndia ? "Jaipur Airport" : `${regionName} Heritage Airport`,
      nearestRailwayStation: isIndia ? "Central Junction" : `${regionName} Station`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Regional Dialect"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Follow warnings at archeological sites. Hire only licensed government tourist guides.",
      travelTips: "Visit monuments early in the morning to avoid heat. Respect local heritage site regulations.",
      durationRecommendation: "2-3 Days",
      weatherInformation: "Subtropical climate. Winters are mild and pleasant, summers can be dry and warm."
    },
    Nature: {
      famousFor: "Tranquil green valleys, palm-fringed backwaters, rare wildlife safaris, and rich biodiverse reserves.",
      activities: ["Wildlife Safari", "Boat Cruise", "Nature Walk", "Bird Watching", "Ayurvedic Spa Session"],
      topAttractions: ["National Wildlife Park", "Serene Waterways", "Botanical Sanctuary", "Scenic Cascading Waterfall"],
      localCuisine: ["Traditional Rice & Fish Curry", "Fresh Coconut Drink", "Steamed Rice Cakes", "Banana Fritters"],
      transportationOptions: ["Jeep Safari", "Houseboat", "Canoe", "Local Taxi"],
      nearestAirport: isIndia ? "Cochin International Airport" : `${regionName} Regional Airport`,
      nearestRailwayStation: isIndia ? "Railway Junction" : `${regionName} Town Station`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Local Dialect"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Maintain distance from wild animals during safaris. Avoid entering deep forest trails after dark.",
      travelTips: "Carry mosquito repellent, wear earthly-colored clothing on safari, and carry waterproof bags.",
      durationRecommendation: "3-5 Days",
      weatherInformation: "Lush tropical climate with rich monsoon seasons. Temperatures range from 22°C to 30°C."
    },
    Adventure: {
      famousFor: "Extreme water rafting, bungee jumping, skydiving, and rugged mountaineering trails.",
      activities: ["White Water Rafting", "Bungee Jumping", "Zip Lining", "Rock Climbing", "Canyon Camping"],
      topAttractions: ["Gushing River Gorge", "Steep Cliff Suspension Bridge", "Rugged Canyon Path", "Adventure Base Camp"],
      localCuisine: ["High-energy energy bars", "Local Spiced Stew", "Grilled Campfire Skewers", "Warm Honey Tea"],
      transportationOptions: ["4x4 SUV", "Quad Bike", "Mountain Shuttle", "Foot Trekking"],
      nearestAirport: isIndia ? "Dehradun Airport" : `${regionName} Adventure Airport`,
      nearestRailwayStation: isIndia ? "Rishikesh Station" : `${regionName} Canyon Station`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Regional"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Inspect safety harnesses before activities. Ensure you participate with certified instructors.",
      travelTips: "Keep hydration packs ready, wear sturdy athletic shoes, and purchase travel insurance with adventure coverage.",
      durationRecommendation: "3-4 Days",
      weatherInformation: "Breezy and clean climate. Warm days (20°C - 30°C) and crisp cold nights (10°C - 15°C)."
    },
    Culture: {
      famousFor: "Rich art traditions, local festivals, theater acts, ancient history, and museum tours.",
      activities: ["Attending Local Festival", "Museum Guided Tour", "Traditional Art Workshop", "Historical Walk", "Theater Performance"],
      topAttractions: ["Grand Cultural Center", "National Art Museum", "Historical Heritage Site", "Performing Arts Theater"],
      localCuisine: ["Traditional Festive Rice", "Slow-cooked Claypot Meat", "Sweet Honey Pastries", "Local Herbal Brew"],
      transportationOptions: ["Public Transit Metro", "Heritage Rickshaw", "Tour Shuttle Bus", "Walking Tour"],
      nearestAirport: isIndia ? "Netaji Subhash Chandra Bose Airport" : `${regionName} Cultural Airport`,
      nearestRailwayStation: isIndia ? "Howrah Junction" : `${regionName} Central Terminus`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Bengali"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Respect local customs, dress modestly when visiting sacred temples, and follow photography guidelines.",
      travelTips: "Book festival passes early, carry cash for entry fees, and hire authorized guides.",
      durationRecommendation: "3-5 Days",
      weatherInformation: "Comfortable and pleasant climate. Temperatures range from 18°C to 28°C."
    },
    Food: {
      famousFor: "Culinary innovations, night markets, food streets, award-winning restaurants, and traditional cuisine.",
      activities: ["Night Market Food Tour", "Cooking Class with Local Chef", "Street Food Tasting", "Fine Dining Dinner", "Local Spice Market Visit"],
      topAttractions: ["Famous Food Street", "Historic Spice Market", "Michelin-starred Restaurant Alley", "Local Farmers Market"],
      localCuisine: ["Steamed Meat Dumplings", "Fragrant Basmati Biryani", "Crispy Rice Pancakes", "Traditional Spiced Tea"],
      transportationOptions: ["Streetcar", "Tuk-Tuk", "Bicycle Rental", "Walking Tour"],
      nearestAirport: isIndia ? "Rajiv Gandhi International Airport" : `${regionName} Food Hub Airport`,
      nearestRailwayStation: isIndia ? "Secunderabad Junction" : `${regionName} Central Station`,
      languagesSpoken: isIndia ? ["English", "Telugu", "Urdu"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Drink bottled water and choose street stalls that are highly popular with local crowds to ensure freshness.",
      travelTips: "Carry sanitizers, keep small change ready for street vendors, and bring digestives.",
      durationRecommendation: "2-4 Days",
      weatherInformation: "Warm and tropical. Average temperatures hover around 24°C - 34°C."
    },
    Shopping: {
      famousFor: "Bustling traditional bazaars, luxury malls, designer outlets, local handicrafts, and duty-free shopping.",
      activities: ["Bazaar Bargain Shopping", "Luxury Mall Visit", "Handicrafts Souvenir Hunting", "Fashion District Walk", "Duty-Free Shopping Spree"],
      topAttractions: ["Traditional Artisan Market", "Mega Luxury Shopping Mall", "Bustling Pedestrian Shopping Street", "Outlet Mall Village"],
      localCuisine: ["Quick Bites & Snacks", "Cafe Latte & Pastries", "Fresh Fruit Smoothie", "Gourmet Deli Sandwich"],
      transportationOptions: ["Taxi Cab", "Metro Line", "Shopping Center Shuttle", "Rickshaw"],
      nearestAirport: isIndia ? "Chhatrapati Shivaji Maharaj Airport" : `${regionName} International Airport`,
      nearestRailwayStation: isIndia ? "Mumbai Central" : `${regionName} Fashion Terminal`,
      languagesSpoken: isIndia ? ["English", "Hindi", "Marathi"] : ["English", "Local Language"],
      currency: isIndia ? "INR (₹)" : "Local Currency",
      safetyInformation: "Keep your wallets secure in crowded market areas and double check your purchases before leaving.",
      travelTips: "Bring comfortable walking shoes, carry a reusable shopping bag, and don't hesitate to bargain in local markets.",
      durationRecommendation: "2-3 Days",
      weatherInformation: "Breezy and moderate. Temperatures typically range from 20°C to 30°C."
    }
  };

  const template = categoryTemplates[base.category] || categoryTemplates.City;

  const shortDescription = base.shortDescription || `Visit the stunning destination of ${base.name} in ${base.country}.`;
  const fullDescription = `${base.name} is a world-renowned destination located in ${base.country}. Famous for its ${template.famousFor.toLowerCase()} It attracts thousands of travelers every year looking to experience activities like ${template.activities.slice(0, 3).join(", ").toLowerCase()} and explore landmarks like ${template.topAttractions.slice(0, 2).join(" and ")}. Plan your trip to ${base.name} today for a memorable vacation.`;

  const slug = base.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const coordinates = { latitude: base.latitude, longitude: base.longitude };
  const bestSeason = "October - March";
  const duration = template.durationRecommendation;
  const budget = base.averageBudget;
  const description = fullDescription;

  const hotels = [
    `Hotel ${base.name} Grand`,
    `Resort ${base.name} View`,
    `${base.name} Luxury Suites`,
  ];
  const restaurants = [
    `${base.name} Local Diner`,
    `The Green Cafe ${base.name}`,
    `Spicy Flavors of ${base.name}`,
  ];
  const weather = [
    { day: "Mon", temp: "28°C", condition: "Sunny", icon: "☀️" },
    { day: "Tue", temp: "27°C", condition: "Partly Cloudy", icon: "⛅" },
    { day: "Wed", temp: "29°C", condition: "Sunny", icon: "☀️" },
    { day: "Thu", temp: "26°C", condition: "Rainy", icon: "🌧️" },
    { day: "Fri", temp: "28°C", condition: "Clear", icon: "☀️" }
  ];
  const mapLocation = `${base.city || base.name}, ${base.country}`;

  return {
    name: base.name,
    slug,
    city: base.city || base.name,
    state: base.state || base.country,
    country: base.country,
    continent: base.continent,
    category: base.category,
    categories: [base.category.toLowerCase()],
    shortDescription,
    fullDescription,
    description,
    bestTimeToVisit: bestSeason,
    bestSeason,
    averageBudget: base.averageBudget,
    averageCost: base.averageBudget,
    budget,
    durationRecommendation: duration,
    duration,
    weatherInformation: template.weatherInformation,
    famousFor: template.famousFor,
    topAttractions: template.topAttractions,
    activities: template.activities,
    localCuisine: template.localCuisine,
    transportationOptions: template.transportationOptions,
    nearestAirport: template.nearestAirport,
    nearestRailwayStation: template.nearestRailwayStation,
    languagesSpoken: template.languagesSpoken,
    currency: isIndia ? "Indian Rupee (INR)" : template.currency,
    safetyInformation: template.safetyInformation,
    travelTips: template.travelTips,
    latitude: base.latitude,
    longitude: base.longitude,
    coordinates,
    images: [],
    image: "",
    rating: base.rating,
    popularPlaces: template.topAttractions,
    hotels,
    restaurants,
    weather,
    gallery: [],
    heroImage: "",
    mapLocation
  };
}

const destinationsData = baseDestinations.map(expandDestination);

export async function seed(isAutoSeed = false) {
  try {
    if (!isAutoSeed) {
      const mongodbUri = process.env.MONGODB_URI;
      if (!mongodbUri) {
        logger.error("MONGODB_URI is not set in environment!");
        process.exit(1);
      }
      logger.info("Connecting to MongoDB for seeding...");
      await mongoose.connect(mongodbUri);
      logger.info("Connected to MongoDB.");
    }

    // 1. Clear existing collections
    logger.info("Clearing Destination and Weather collections...");
    await Destination.deleteMany({});
    await Weather.deleteMany({});
    logger.info("Collections cleared.");

    // 2. Insert destinations
    logger.info(`Inserting ${destinationsData.length} destination records...`);
    const seededDestinations = await Destination.insertMany(destinationsData);
    logger.info("Destinations successfully seeded.");

    // 3. Generate and insert weather caches for each destination
    logger.info("Generating weather forecasts for destinations...");
    const weatherRecords = seededDestinations.map((dest) => {
      // Mock base temp and forecast
      let baseTemp = 25;
      let conditions = ["Sunny", "Partly Cloudy", "Clear"];
      let humidity = 60;
      let windSpeed = 10;

      const cat = dest.category.toLowerCase();
      const country = dest.country.toLowerCase();

      if (cat === "mountain" || country === "switzerland") {
        baseTemp = 6;
        conditions = ["Snowy", "Foggy", "Overcast"];
        humidity = 80;
        windSpeed = 20;
      } else if (cat === "beach" || dest.name.toLowerCase() === "maldives") {
        baseTemp = 32;
        conditions = ["Sunny", "Breezy", "Clear"];
        humidity = 78;
        windSpeed = 14;
      } else if (cat === "heritage" && (country === "india" || country === "egypt")) {
        baseTemp = 36;
        conditions = ["Sunny", "Hot", "Clear"];
        humidity = 35;
        windSpeed = 8;
      } else if (country === "united kingdom") {
        baseTemp = 13;
        conditions = ["Rainy", "Drizzle", "Cloudy"];
        humidity = 90;
        windSpeed = 16;
      }

      const forecast = [];
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        forecast.push({
          date: nextDate.toISOString().split("T")[0],
          temperature: baseTemp + (Math.floor(Math.random() * 5) - 2),
          condition: conditions[Math.floor(Math.random() * conditions.length)],
        });
      }

      return {
        destinationName: dest.name.toLowerCase(),
        temperature: baseTemp,
        condition: conditions[0],
        humidity,
        windSpeed,
        forecast,
        lastUpdated: new Date(),
      };
    });

    logger.info(`Inserting ${weatherRecords.length} weather cache records...`);
    await Weather.insertMany(weatherRecords);
    logger.info("Weather cache successfully seeded.");

    logger.info("=== SEEDING COMPLETED SUCCESSFULY ===");
    if (!isAutoSeed) {
      process.exit(0);
    }
  } catch (error) {
    logger.error("Error seeding the database:", error);
    if (!isAutoSeed) {
      process.exit(1);
    }
  }
}

if (process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed"))) {
  seed();
}
