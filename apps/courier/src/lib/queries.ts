import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

export const offersQuery = queryOptions({ queryKey: ["offers"], queryFn: api.offers.list, refetchInterval: 10_000 });
export const routesQuery = queryOptions({ queryKey: ["routes"], queryFn: api.routes.list, refetchInterval: 15_000 });
export const routeQuery = (id: string) => queryOptions({ queryKey: ["routes", id], queryFn: () => api.routes.get(id) });
