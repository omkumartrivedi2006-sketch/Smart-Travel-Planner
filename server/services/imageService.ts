import { Destination } from "../models/Destination";
import { logger } from "../utils/logger";

// Adjust hue of hex color dynamically
function adjustColorHue(hex: string, shift: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, Math.max(0, r + shift));
  g = Math.min(255, Math.max(0, g + shift));
  b = Math.min(255, Math.max(0, b + shift));

  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate dynamic category-themed SVG placeholder
export function generatePlaceholderSvg(name: string, category: string): string {
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

  const theme = palettes[category] || palettes.City;
  const hueShift = Math.abs(hash % 40) - 20; // -20 to +20

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <defs>
      <linearGradient id="g-${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${adjustColorHue(theme[0], hueShift)}" />
        <stop offset="100%" stop-color="${adjustColorHue(theme[1], hueShift)}" />
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g-${Math.abs(hash)})" />
    <text x="50%" y="45%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" opacity="0.95">${name}</text>
    <text x="50%" y="58%" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" letter-spacing="4" font-weight="600" fill="#ffffff" opacity="0.7">${category.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Map to store active resolutions to prevent duplicate simultaneous API calls for the same destination
const pendingResolutions = new Map<string, Promise<string>>();

// Wikimedia API rules require a unique and descriptive User-Agent with contact details to bypass standard rate limiting/blockers
const WIKIPEDIA_HEADERS = {
  "User-Agent": "SmartTravelPlanner/1.0 (contact@smarttravelplanner.com; developer test agent)"
};

// ─── THROTTLING QUEUE FOR CONCURRENT BACKEND SEARCHES ─────────────────────────
class ResolutionQueue {
  private activeCount = 0;
  private queue: (() => Promise<void>)[] = [];
  private concurrencyLimit = 3;         // Allow at most 3 simultaneous Wikipedia queries
  private delayBetweenRequestsMs = 200;  // Throttle with 200ms sleep between starting tasks

  async add(task: () => Promise<void>) {
    this.queue.push(task);
    this.process();
  }

  private async process() {
    if (this.activeCount >= this.concurrencyLimit || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;
    try {
      await task();
    } catch (err) {
      logger.error("Queue task error:", err);
    } finally {
      this.activeCount--;
      // Wait before starting next task to respect rate limits
      setTimeout(() => this.process(), this.delayBetweenRequestsMs);
    }
  }
}

const resolutionQueue = new ResolutionQueue();

// Expose background resolution queue trigger
export function queueImageResolution(destId: string): void {
  resolutionQueue.add(async () => {
    try {
      await resolveImageForDestination(destId);
    } catch (err) {
      logger.error(`Error in queued image resolution for ${destId}:`, err);
    }
  });
}

export async function resolveImageForDestination(destId: string): Promise<string> {
  // If there's an ongoing resolution for this ID, return it to avoid duplicate network calls
  if (pendingResolutions.has(destId)) {
    return pendingResolutions.get(destId)!;
  }

  const promise = (async () => {
    try {
      const dest = await Destination.findById(destId);
      if (!dest) return "";

      // If it already has a valid non-placeholder image, return it
      if (dest.image && dest.image.trim() !== "" && !dest.image.startsWith("data:image/svg+xml")) {
        return dest.image;
      }

      const queryNameCountry = `${dest.name} ${dest.country}`;
      const queryNameCountryCategory = `${dest.name} ${dest.country} ${dest.category}`;
      logger.info(`Resolving image for: ${queryNameCountry}`);

      let imageUrl = "";
      let imageUrls: string[] = [];

      // 1. Try Unsplash (if API key is available)
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY;
      if (unsplashKey) {
        try {
          const resp = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(queryNameCountry)}&client_id=${unsplashKey}&per_page=6`
          );
          if (resp.ok) {
            const data: any = await resp.json();
            if (data.results && data.results.length > 0) {
              imageUrl = data.results[0].urls.regular;
              imageUrls = data.results.map((r: any) => r.urls.regular);
              logger.info(`Resolved ${dest.name} image from Unsplash: ${imageUrl}`);
            }
          }
        } catch (err) {
          logger.error("Failed to fetch from Unsplash:", err);
        }
      }

      // 2. Try Pexels (if API key is available)
      const pexelsKey = process.env.VITE_PEXELS_API_KEY || process.env.PEXELS_API_KEY;
      if (!imageUrl && pexelsKey) {
        try {
          // Attempt 1: Smart Query (Name + Country + Category)
          logger.info(`Pexels smart search: ${queryNameCountryCategory}`);
          let resp = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(queryNameCountryCategory)}&per_page=6`,
            { headers: { Authorization: pexelsKey } }
          );
          if (resp.ok) {
            const data: any = await resp.json();
            if (data.photos && data.photos.length > 0) {
              imageUrl = data.photos[0].src.large;
              imageUrls = data.photos.map((p: any) => p.src.large);
              logger.info(`Resolved ${dest.name} image from Pexels: ${imageUrl}`);
            }
          }

          // Attempt 2: Fallback to Category Search if Smart Query yields no results
          if (!imageUrl) {
            logger.info(`Pexels category fallback search: ${dest.category}`);
            resp = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(dest.category)}&per_page=6`,
              { headers: { Authorization: pexelsKey } }
            );
            if (resp.ok) {
              const data: any = await resp.json();
              if (data.photos && data.photos.length > 0) {
                imageUrl = data.photos[0].src.large;
                imageUrls = data.photos.map((p: any) => p.src.large);
                logger.info(`Resolved ${dest.name} image from Pexels category search: ${imageUrl}`);
              }
            }
          }
        } catch (err) {
          logger.error("Failed to fetch from Pexels:", err);
        }
      }

      // 3. Try Pixabay (if API key is available)
      const pixabayKey = process.env.PIXABAY_API_KEY || process.env.VITE_PIXABAY_API_KEY;
      if (!imageUrl && pixabayKey) {
        try {
          const resp = await fetch(
            `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(queryNameCountry)}&image_type=photo&per_page=6`
          );
          if (resp.ok) {
            const data: any = await resp.json();
            if (data.hits && data.hits.length > 0) {
              imageUrl = data.hits[0].largeImageURL;
              imageUrls = data.hits.slice(0, 6).map((h: any) => h.largeImageURL);
              logger.info(`Resolved ${dest.name} image from Pixabay: ${imageUrl}`);
            }
          }
        } catch (err) {
          logger.error("Failed to fetch from Pixabay:", err);
        }
      }

      // 4. Fallback to Unique SVG Placeholder if all providers are unavailable
      if (!imageUrl) {
        imageUrl = generatePlaceholderSvg(dest.name, dest.category);
        imageUrls = [imageUrl];
        logger.warn(`Failed to resolve external image for ${dest.name}. Using dynamic SVG placeholder.`);
      }

      // Save to database
      dest.image = imageUrl;
      dest.images = imageUrls && imageUrls.length > 0 ? imageUrls : [imageUrl];
      await dest.save();

      return imageUrl;
    } catch (err) {
      logger.error(`Error in resolveImageForDestination for ID ${destId}:`, err);
      return "";
    } finally {
      // Cleanup pending resolution map
      pendingResolutions.delete(destId);
    }
  })();

  pendingResolutions.set(destId, promise);
  return promise;
}
