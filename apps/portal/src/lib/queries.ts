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

export const adminBatchesQuery = (date: string) =>
  queryOptions({
    queryKey: ["admin", "batches", { date }],
    queryFn: () => api.admin.listBatches(date),
    refetchInterval: (query) => (query.state.data?.totals.importing ? 1500 : false),
  });

export const adminBatchQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "batches", id],
    queryFn: () => api.admin.getBatch(id),
    refetchInterval: (query) => (query.state.data?.status === "importing" ? 1500 : false),
  });
