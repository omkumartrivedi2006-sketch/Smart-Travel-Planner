import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Fix Leaflet's default marker icon paths in bundle environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  category?: string;
  address?: string;
  rating?: number | null;
}

interface MapViewProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  routeCoordinates?: [number, number][]; // Array of [lat, lng]
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
}

export function MapView({
  className,
  center,
  zoom,
  markers = [],
  routeCoordinates = [],
  initialCenter = { lat: 15.2993, lng: 74.1240 }, // Default Goa coordinates
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const activeCenter = center || initialCenter;
    const activeZoom = zoom || initialZoom;

    // Create map instance
    const map = L.map(mapContainer.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([activeCenter.lat, activeCenter.lng], activeZoom);

    mapInstance.current = map;

    // Load OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initialize layer group for markers
    markersLayer.current = L.layerGroup().addTo(map);

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update center and zoom reactively
  useEffect(() => {
    if (mapInstance.current && center) {
      const activeZoom = zoom || mapInstance.current.getZoom();
      mapInstance.current.setView([center.lat, center.lng], activeZoom);
    }
  }, [center, zoom]);

  // Update markers reactively
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;

    // Clear old markers
    markersLayer.current.clearLayers();

    // Draw new markers
    markers.forEach((m) => {
      let customIcon;

      if (m.category) {
        const cat = m.category.toLowerCase();
        let color = "red"; // default for attractions/landmarks

        if (cat === "hotel" || cat === "accommodation") {
          color = "blue";
        } else if (cat === "restaurant" || cat === "cafe" || cat === "catering") {
          color = "green";
        } else if (cat === "start" || cat === "origin" || cat === "source") {
          color = "orange";
        }

        customIcon = L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
      }

      const marker = L.marker([m.lat, m.lng], customIcon ? { icon: customIcon } : undefined)
        .bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 150px; font-size: 13px;">
            <strong style="color: #0f766e; font-size: 14px; display: block; margin-bottom: 4px;">${m.title}</strong>
            ${m.category ? `<span style="background-color: #f0fdfa; color: #0d9488; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; margin-bottom: 4px;">${m.category}</span>` : ""}
            ${m.rating ? `<span style="color: #fb923c; font-weight: bold; margin-left: 6px;">⭐ ${m.rating}</span>` : ""}
            ${m.address ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px; line-height: 1.3;">${m.address}</p>` : ""}
          </div>
        `);

      markersLayer.current?.addLayer(marker);
    });
  }, [markers]);

  // Update routing polyline reactively
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old polyline
    if (routeLayer.current) {
      routeLayer.current.remove();
      routeLayer.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      // Draw premium polyline (teal color, rounded joins)
      routeLayer.current = L.polyline(routeCoordinates, {
        color: "#0d9488",
        weight: 6,
        opacity: 0.85,
        lineJoin: "round",
      }).addTo(mapInstance.current);

      // Pan & Zoom to fit the entire route
      mapInstance.current.fitBounds(routeLayer.current.getBounds(), {
        padding: [40, 40],
      });
    }
  }, [routeCoordinates]);

  return (
    <div ref={mapContainer} className={cn("w-full h-full min-h-[300px]", className)} />
  );
}
