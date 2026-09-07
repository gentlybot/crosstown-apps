import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

export const batchesQuery = queryOptions({
  queryKey: ["batches"],
  queryFn: api.listBatches,
});

export const batchQuery = (id: string) =>
  queryOptions({
    queryKey: ["batches", id],
    queryFn: () => api.getBatch(id),
    // Poll while the import job is running, then stop.
    refetchInterval: (query) => (query.state.data?.status === "importing" ? 1500 : false),
  });
