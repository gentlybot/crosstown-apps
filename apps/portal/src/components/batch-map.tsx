import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker?url";

// Vite's dependency pre-bundling drops MapLibre's worker file, so point the
// library at the worker explicitly. Works in dev and in the production build.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

export type MapStop = {
  id: number | string;
  lat: number;
  lng: number;
  /** Text inside the pin, usually the stop or row number. */
  label: string;
  /** Tooltip title. */
  title: string;
  subtitle?: string;
  color: string;
};

export type MapRoute = {
  id: number | string;
  color: string;
  points: [number, number][]; // [lat, lng]
  label?: string;
};

export type MapPickup = { lat: number; lng: number; label: string };

type Props = {
  pickup?: MapPickup | null;
  stops: MapStop[];
  routes?: MapRoute[];
  className?: string;
  /** When set, the map fits these points instead of everything. [lat, lng] pairs. */
  focus?: [number, number][];
};

// OpenFreeMap serves the Positron style as free vector tiles: no key, no limits.
// A pale basemap made for data overlays, so routes and pins carry the map.
// The style carries its own attribution (OpenFreeMap, OpenMapTiles, OpenStreetMap).
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const TORONTO: [number, number] = [-79.3832, 43.6532];
const ROUTES_SOURCE = "routes";
const ROUTES_LAYER = "routes-line";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function pinElement(className: string, label: string, color?: string) {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = label;
  if (color) el.style.background = color;
  return el;
}

function hoverPopup(marker: Marker, map: MapLibreMap, html: string) {
  const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 16 }).setHTML(html);
  const el = marker.getElement();
  el.addEventListener("mouseenter", () => popup.setLngLat(marker.getLngLat()).addTo(map));
  el.addEventListener("mouseleave", () => popup.remove());
  return popup;
}

export function BatchMap({ pickup, stops, routes = [], className, focus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: TORONTO,
      zoom: 12,
      attributionControl: false,
      scrollZoom: false,
      // Keeps the WebGL canvas readable so screenshots and recordings show the basemap.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new AttributionControl({ compact: false }), "bottom-right");
    map.on("load", () => {
      map.addSource(ROUTES_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: ROUTES_LAYER,
        type: "line",
        source: ROUTES_SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.85 },
      });
      const routePopup = new Popup({ closeButton: false, closeOnClick: false, offset: 8 });
      map.on("mousemove", ROUTES_LAYER, (e: MapLayerMouseEvent) => {
        const label = e.features?.[0]?.properties?.label as string | undefined;
        if (!label) return;
        map.getCanvas().style.cursor = "pointer";
        routePopup.setLngLat(e.lngLat).setText(label).addTo(map);
      });
      map.on("mouseleave", ROUTES_LAYER, () => {
        map.getCanvas().style.cursor = "";
        routePopup.remove();
      });
      setReady(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Route lines.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource(ROUTES_SOURCE) as GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: routes
        .filter((r) => r.points.length > 1)
        .map((r) => ({
          type: "Feature",
          properties: { color: r.color, label: r.label ?? "" },
          geometry: { type: "LineString", coordinates: r.points.map(([lat, lng]) => [lng, lat]) },
        })),
    });
  }, [ready, routes]);

  // Pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: Marker[] = [];
    const popups: Popup[] = [];
    if (pickup) {
      const m = new Marker({ element: pinElement("pickup-pin", "P") }).setLngLat([pickup.lng, pickup.lat]).addTo(map);
      popups.push(hoverPopup(m, map, `<strong>Pickup</strong><br>${escapeHtml(pickup.label)}`));
      markers.push(m);
    }
    for (const s of stops) {
      const m = new Marker({ element: pinElement("stop-pin", s.label, s.color) }).setLngLat([s.lng, s.lat]).addTo(map);
      const html = `<strong>${escapeHtml(s.title)}</strong>${s.subtitle ? `<br>${escapeHtml(s.subtitle)}` : ""}`;
      popups.push(hoverPopup(m, map, html));
      markers.push(m);
    }
    return () => {
      popups.forEach((p) => p.remove());
      markers.forEach((m) => m.remove());
    };
  }, [ready, stops, pickup]);

  // Fit the view to the focus points, or to everything.
  const fitPoints = useMemo<[number, number][]>(() => {
    if (focus && focus.length > 0) return focus;
    const pts: [number, number][] = stops.map((s) => [s.lat, s.lng]);
    if (pickup) pts.push([pickup.lat, pickup.lng]);
    return pts;
  }, [focus, stops, pickup]);
  const fitKey = fitPoints.map((p) => p.join(",")).join("|");

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || fitPoints.length === 0) return;
    if (fitPoints.length === 1) {
      map.jumpTo({ center: [fitPoints[0][1], fitPoints[0][0]], zoom: 15 });
      return;
    }
    const bounds = fitPoints.reduce((b, [lat, lng]) => b.extend([lng, lat]), new LngLatBounds([fitPoints[0][1], fitPoints[0][0]], [fitPoints[0][1], fitPoints[0][0]]));
    map.fitBounds(bounds, { padding: 40, maxZoom: 16, duration: 0 });
    // fitKey is the stable identity of fitPoints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fitKey]);

  return <div ref={containerRef} className={className ?? "h-[420px] w-full"} />;
}
