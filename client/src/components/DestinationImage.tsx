import React, { useState, useEffect, useRef } from "react";
import { resolveDestinationImages, generateClientPlaceholderSvg } from "@/services/pexelsService";

interface DestinationImageProps {
  src?: string;
  alt: string;
  className?: string;
  category?: string;
  name?: string;
  preload?: boolean;
  id?: string | number;
  country?: string;
}

// Client-side in-memory cache to skip state updates on already loaded images
const imageCache: Record<string, string> = {};

export const DestinationImage: React.FC<DestinationImageProps> = ({
  src,
  alt,
  className = "",
  category = "City",
  name = "Destination",
  preload = false,
  id,
  country = "",
}) => {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(undefined);
  const [, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize and check local caches
  useEffect(() => {
    // If it's a valid remote image URL, check local cache
    const isValidRemote = src && src.trim() !== "" && !src.startsWith("data:image/svg+xml");
    if (isValidRemote) {
      const cacheKey = `img_cache_${src}`;
      const cached = imageCache[src!] || localStorage.getItem(cacheKey);
      if (cached) {
        setCurrentSrc(cached);
        setLoaded(true);
        return;
      }
    } else {
      // Check if this destination already has a client-side cached Pexels resolution
      const pexelsCacheKey = `pexels_cache_${id || name}`;
      const cachedStr = localStorage.getItem(pexelsCacheKey);
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.image && cached.image.trim() !== "") {
            setCurrentSrc(cached.image);
            setLoaded(true);
            return;
          }
        } catch (e) {}
      }
    }

    if (preload) {
      setIsVisible(true);
    }
  }, [src, id, name, category, preload]);

  // Set up IntersectionObserver for lazy loading
  useEffect(() => {
    if (preload || isVisible) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin: "150px" } // Load images 150px before entering viewport
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [preload, isVisible]);

  // Load and cache the image when visible
  useEffect(() => {
    if (!isVisible || currentSrc) return;

    const loadAndResolve = async () => {
      try {
        const isValidRemote = src && src.trim() !== "" && !src.startsWith("data:image/svg+xml");
        
        if (isValidRemote) {
          let optimizedSrc = src!;
          if (src!.includes("unsplash.com") && !src!.includes("q=")) {
            optimizedSrc = `${src}${src.includes("?") ? "&" : "?"}q=80&w=800&auto=format&fit=crop`;
          } else if (src!.includes("pexels.com") && !src!.includes("auto=compress")) {
            optimizedSrc = `${src}${src.includes("?") ? "&" : "?"}auto=compress&cs=tinysrgb&w=800`;
          }

          const img = new Image();
          img.src = optimizedSrc;
          img.onload = () => {
            imageCache[src!] = optimizedSrc;
            try {
              localStorage.setItem(`img_cache_${src!}`, optimizedSrc);
            } catch (e) {}
            setCurrentSrc(optimizedSrc);
            setLoaded(true);
          };
          img.onerror = () => {
            setError(true);
            const svgFallback = generateClientPlaceholderSvg(name, category);
            setCurrentSrc(svgFallback);
            setLoaded(true);
          };
        } else {
          // No valid DB image; resolve from Pexels
          const result = await resolveDestinationImages(id, name, country || "", category);
          const resolvedUrl = result.image;

          let optimizedResolved = resolvedUrl;
          if (resolvedUrl.includes("pexels.com") && !resolvedUrl.includes("auto=compress")) {
            optimizedResolved = `${resolvedUrl}${resolvedUrl.includes("?") ? "&" : "?"}auto=compress&cs=tinysrgb&w=800`;
          }

          const img = new Image();
          img.src = optimizedResolved;
          img.onload = () => {
            setCurrentSrc(optimizedResolved);
            setLoaded(true);
          };
          img.onerror = () => {
            setError(true);
            const svgFallback = generateClientPlaceholderSvg(name, category);
            setCurrentSrc(svgFallback);
            setLoaded(true);
          };
        }
      } catch (err) {
        setError(true);
        const svgFallback = generateClientPlaceholderSvg(name, category);
        setCurrentSrc(svgFallback);
        setLoaded(true);
      }
    };

    loadAndResolve();
  }, [isVisible, src, id, name, country, category, currentSrc]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center"
    >
      {/* Shimmer skeleton */}
      {!loaded && <div className="absolute inset-0 shimmer-bg w-full h-full animate-pulse bg-slate-200 dark:bg-slate-800" />}

      {/* Renders image tag */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ objectFit: "cover" }}
        />
      )}
    </div>
  );
};
