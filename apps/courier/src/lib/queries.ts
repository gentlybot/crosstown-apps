import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

export const offersQuery = queryOptions({ queryKey: ["offers"], queryFn: api.offers.list, refetchInterval: 10_000 });
export const availabilityQuery = (from: string, to: string) => queryOptions({ queryKey: ["availability", from, to], queryFn: () => api.availability.get(from, to) });
export const routesQuery = queryOptions({ queryKey: ["routes"], queryFn: api.routes.list, refetchInterval: 15_000 });
export const routeQuery = (id: string) => queryOptions({ queryKey: ["routes", id], queryFn: () => api.routes.get(id) });
