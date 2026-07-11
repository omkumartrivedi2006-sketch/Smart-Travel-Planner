import { apiFetch } from "@/lib/api";

// In-memory cache for resolved images to minimize API calls during app session
const clientImageCache: Record<string, { image: string; images: string[] }> = {};

export interface PexelsImageResult {
  image: string;
  images: string[];
}

/**
 * Resolves images for a destination using:
 * Database Image -> Local Cache -> Pexels API -> Save to DB -> Reuse
 */
export async function resolveDestinationImages(
  id: string | number | undefined,
  name: string,
  country: string,
  category: string,
  dbImage?: string,
  dbImages?: string[]
): Promise<PexelsImageResult> {
  const primaryCategory = category || "City";

  // 1. Check if the database already has a valid non-placeholder image
  const hasDbImage = dbImage && dbImage.trim() !== "" && !dbImage.startsWith("data:image/svg+xml");
  const hasDbImages = dbImages && Array.isArray(dbImages) && dbImages.length > 0 && !dbImages[0].startsWith("data:image/svg+xml");

  if (hasDbImage) {
    const imagesArray = hasDbImages ? dbImages : [dbImage];
    return {
      image: dbImage,
      images: imagesArray,
    };
  }

  // 2. Check local in-memory/localStorage cache
  const cacheKey = `pexels_cache_${id || name}`;
  if (clientImageCache[cacheKey]) {
    return clientImageCache[cacheKey];
  }

  const cachedStr = localStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr) as PexelsImageResult;
      if (cached && cached.image && cached.image.trim() !== "") {
        clientImageCache[cacheKey] = cached;
        return cached;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // 3. Search Pexels API using a smart search query combining destination name, country, and category
  const apiKey = (import.meta.env.VITE_PEXELS_API_KEY as string) || "";
  if (!apiKey || apiKey.trim() === "") {
    console.warn("Pexels API key (VITE_PEXELS_API_KEY) is missing. Using client fallback SVG.");
    const fallbackSvg = generateClientPlaceholderSvg(name, primaryCategory);
    return {
      image: fallbackSvg,
      images: [fallbackSvg],
    };
  }

  let resolvedImage = "";
  let resolvedImages: string[] = [];

  const headers = { Authorization: apiKey };
  const smartQuery = `${name} ${country} ${primaryCategory}`;

  try {
    // Attempt 1: Smart Query (Name + Country + Category)
    console.info(`Pexels API client-side smart query: ${smartQuery}`);
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(smartQuery)}&per_page=6`;
    const resp = await fetch(url, { headers });
    if (resp.ok) {
      const data = await resp.json();
      if (data.photos && data.photos.length > 0) {
        resolvedImage = data.photos[0].src.large;
        resolvedImages = data.photos.map((p: any) => p.src.large);
      }
    } else {
      console.error(`Pexels API query failed: ${resp.status} ${resp.statusText}`);
    }
  } catch (err) {
    console.error("Failed to query Pexels API with smart query:", err);
  }

  // Attempt 2: Category fallback if first attempt returned no images
  if (!resolvedImage) {
    try {
      console.info(`Pexels API client-side category fallback: ${primaryCategory}`);
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(primaryCategory)}&per_page=6`;
      const resp = await fetch(url, { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (data.photos && data.photos.length > 0) {
          resolvedImage = data.photos[0].src.large;
          resolvedImages = data.photos.map((p: any) => p.src.large);
        }
      }
    } catch (err) {
      console.error("Failed to query Pexels API with category fallback:", err);
    }
  }

  // Attempt 3: Client-side placeholder SVG fallback if Pexels search fails
  if (!resolvedImage) {
    const fallbackSvg = generateClientPlaceholderSvg(name, primaryCategory);
    resolvedImage = fallbackSvg;
    resolvedImages = [fallbackSvg];
  }

  const result: PexelsImageResult = {
    image: resolvedImage,
    images: resolvedImages,
  };

  // 4. Save to local caches
  clientImageCache[cacheKey] = result;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (e) {
    // Ignore storage limit errors
  }

  // 5. Save/Sync back to MongoDB if it's a real database destination and the resolved image is not a local SVG
  if (id && !resolvedImage.startsWith("data:image/svg+xml")) {
    try {
      await apiFetch(`/api/destinations/${id}/update-images`, {
        method: "PUT",
        body: JSON.stringify({
          image: resolvedImage,
          images: resolvedImages,
        }),
      });
      console.info(`Successfully cached resolved images to database for destination ID ${id}`);
    } catch (dbErr) {
      console.error("Failed to save resolved images to backend database:", dbErr);
    }
  }

  return result;
}

// Client-side SVG generator
export function generateClientPlaceholderSvg(name: string, category: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palettes: Record<string, [string, string]> = {
    Beach: ["#00c6ff", "#0072ff"],
    Mountain: ["#3a7bd5", "#3a6073"],
    City: ["#1f1c2c", "#928dab"],
    Heritage: ["#bf953f", "#b38728"],
    Nature: ["#11998e", "#38ef7d"],
    Adventure: ["#f12711", "#f5af19"],
  };

  const palettesStart = palettes[category] || palettes.City;
  const hueShift = Math.abs(hash % 40) - 20; // -20 to +20

  const adjustColorHue = (hex: string, shift: number) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, r + shift));
    g = Math.min(255, Math.max(0, g + shift));
    b = Math.min(255, Math.max(0, b + shift));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const c1 = adjustColorHue(palettesStart[0], hueShift);
  const c2 = adjustColorHue(palettesStart[1], hueShift);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <defs>
      <linearGradient id="g-${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g-${Math.abs(hash)})" />
    <text x="50%" y="45%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" opacity="0.95">${name}</text>
    <text x="50%" y="58%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" letter-spacing="4" font-weight="600" fill="#ffffff" opacity="0.7">${category.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
