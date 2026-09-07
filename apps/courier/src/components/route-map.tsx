import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { AttributionControl, LngLatBounds, Map as MapLibreMap, Marker, type GeoJSONSource } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker?url";
import type { CourierStop } from "@/lib/api";
import type { LatLng } from "@/lib/location";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

// The style carries its own attribution (OpenFreeMap, OpenMapTiles, OpenStreetMap).
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const COLORS = { pending: "#1d4ed8", delivered: "#2f6b4a", failed: "#b45309" } as const;

type Props = {
  pickup: LatLng | null;
  stops: CourierStop[];
  nextStopId?: number | null;
  courier?: LatLng | null;
  className?: string;
};

function pin(className: string, label: string, color?: string) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = label;
  if (color) el.style.background = color;
  return el;
}

export function RouteMap({ pickup, stops, nextStopId, courier, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const courierMarker = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: [-79.3832, 43.6532],
      zoom: 12,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    map.on("load", () => {
      // Compact attribution opens on load; start it collapsed behind the (i) button.
      map.getContainer().querySelectorAll(".maplibregl-compact-show").forEach((el) => el.classList.remove("maplibregl-compact-show"));
      map.addSource("path", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "path-line", type: "line", source: "path", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#1d4ed8", "line-width": 4, "line-opacity": 0.7 } });
      setReady(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const coords: [number, number][] = [];
    if (pickup) coords.push([pickup.lng, pickup.lat]);
    stops.forEach((s) => coords.push([s.lng, s.lat]));
    (map.getSource("path") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: coords.length > 1 ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }] : [],
    });
  }, [ready, pickup, stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: Marker[] = [];
    if (pickup) markers.push(new Marker({ element: pin("pickup-pin", "P") }).setLngLat([pickup.lng, pickup.lat]).addTo(map));
    for (const s of stops) {
      const el = pin("stop-pin", String(s.position), COLORS[s.status]);
      if (s.id === nextStopId) el.classList.add("is-next");
      markers.push(new Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map));
    }
    return () => markers.forEach((m) => m.remove());
  }, [ready, pickup, stops, nextStopId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!courier) {
      courierMarker.current?.remove();
      courierMarker.current = null;
      return;
    }
    if (!courierMarker.current) {
      const el = document.createElement("div");
      el.className = "courier-dot";
      courierMarker.current = new Marker({ element: el }).setLngLat([courier.lng, courier.lat]).addTo(map);
    } else {
      courierMarker.current.setLngLat([courier.lng, courier.lat]);
    }
  }, [ready, courier]);

  const fitKey = useMemo(() => [pickup ? `${pickup.lat},${pickup.lng}` : "", ...stops.map((s) => `${s.lat},${s.lng}`)].join("|"), [pickup, stops]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const pts: [number, number][] = stops.map((s) => [s.lng, s.lat]);
    if (pickup) pts.push([pickup.lng, pickup.lat]);
    if (pts.length === 0) return;
    if (pts.length === 1) return void map.jumpTo({ center: pts[0], zoom: 15 });
    const bounds = pts.reduce((b, p) => b.extend(p), new LngLatBounds(pts[0], pts[0]));
    map.fitBounds(bounds, { padding: 36, maxZoom: 16, duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitKey]);

  return <div ref={containerRef} className={className ?? "h-56 w-full"} />;
}
