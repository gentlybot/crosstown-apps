import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BatchDetail } from "@/components/batch-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { batchQuery } from "@/lib/queries";

export const Route = createFileRoute("/merchant/batches/$batchId")({
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(batchQuery(params.batchId)),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: BatchPage,
});

function BatchPage() {
  const { batchId } = Route.useParams();
  const { data: batch } = useSuspenseQuery(batchQuery(batchId));

  return (
    <BatchDetail
      batch={batch}
      back={{ to: "/merchant/batches", label: "Batches" }}
      problemHint="Correct the rows in your spreadsheet and upload the file again, or send the fixes to Handoff before your cutoff."
      retry={
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link to="/merchant/batches/new">Upload a different file</Link>
        </Button>
      }
    />
  );
}
