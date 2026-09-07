import { Geolocation } from "@capacitor/geolocation";

export type LatLng = { lat: number; lng: number };

/** The device position, or null when unavailable or refused. */
export async function currentPosition(): Promise<LatLng | null> {
  try {
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8_000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * Walks a position along a path for demos and sandbox previews, where there is
 * no GPS. Calls onMove roughly every 800ms and resolves when it reaches the end.
 */
export function simulateDrive(path: LatLng[], onMove: (p: LatLng) => void, stepsPerLeg = 6): () => void {
  let leg = 0;
  let step = 0;
  const timer = setInterval(() => {
    if (leg >= path.length - 1) {
      clearInterval(timer);
      return;
    }
    const a = path[leg];
    const b = path[leg + 1];
    const t = step / stepsPerLeg;
    onMove({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    step += 1;
    if (step > stepsPerLeg) {
      step = 0;
      leg += 1;
    }
  }, 800);
  return () => clearInterval(timer);
}
