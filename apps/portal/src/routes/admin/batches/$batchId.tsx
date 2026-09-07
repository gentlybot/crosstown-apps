import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BatchDetail } from "@/components/batch-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { adminBatchQuery } from "@/lib/queries";

export const Route = createFileRoute("/admin/batches/$batchId")({
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === "string" ? search.date : undefined,
  }),
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(adminBatchQuery(params.batchId)),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: AdminBatchPage,
});

function AdminBatchPage() {
  const { batchId } = Route.useParams();
  const { date } = Route.useSearch();
  const { data: batch } = useSuspenseQuery(adminBatchQuery(batchId));

  return (
    <BatchDetail
      batch={batch}
      back={{ to: "/admin/batches", label: "All batches", search: { date: date ?? batch.delivery_date } }}
      context={
        <p className="mt-1 text-sm">
          <span className="font-medium">{batch.merchant.business_name}</span>
          <span className="text-muted-foreground">, cutoff {batch.merchant.cutoff_time}</span>
        </p>
      }
      problemHint="The merchant needs to fix these rows and re-upload, or send corrections before their cutoff. Rows with problems are held back from routing."
      retry={<span className="text-sm">The merchant will need to upload a corrected file.</span>}
    />
  );
}
