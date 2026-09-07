/** Distinct colours for routes on a map. Index by route position within a day. */
export const ROUTE_COLORS = ["#2f6b4a", "#1d4ed8", "#b45309", "#7c3aed", "#be185d", "#0f766e", "#4d7c0f", "#c2410c", "#0e7490", "#6d28d9"];

export const STOP_READY = "#2f6b4a";
export const STOP_PROBLEM = "#c98a17";

export function routeColor(index: number) {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}
