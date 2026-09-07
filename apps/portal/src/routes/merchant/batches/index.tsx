import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Upload } from "lucide-react";
import { BatchStatusBadge } from "@/components/batch-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { batchesQuery } from "@/lib/queries";

export const Route = createFileRoute("/merchant/batches/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(batchesQuery),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: BatchesPage,
});

function BatchesPage() {
  const { data: batches } = useSuspenseQuery(batchesQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Batches</h1>
          <p className="text-sm text-muted-foreground">Each upload of orders is a batch. Fix flagged rows before your cutoff.</p>
        </div>
        <Button asChild>
          <Link to="/merchant/batches/new">
            <Plus className="size-4" />
            New batch
          </Link>
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-10">
            <div className="grid size-10 place-items-center rounded-full bg-secondary">
              <Upload className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No batches yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Upload a CSV of orders and Handoff will check every address before anything is picked up.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/merchant/batches/new">Upload your first batch</Link>
              </Button>
              <Button asChild variant="outline">
                <a href={`${import.meta.env.BASE_URL}sample-orders-clean.csv`} download>
                  Sample CSV, all clean
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`${import.meta.env.BASE_URL}sample-orders-problems.csv`} download>
                  Sample CSV, 3 problems
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Need attention</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link
                      to="/merchant/batches/$batchId"
                      params={{ batchId: String(b.id) }}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </Link>
                    {b.original_filename && (
                      <p className="text-xs text-muted-foreground">{b.original_filename}</p>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(b.delivery_date)}</TableCell>
                  <TableCell>
                    <BatchStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{b.status === "importing" ? "…" : b.row_count}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.problem_count > 0 ? <span className="font-medium text-[#9a5b00]">{b.problem_count}</span> : "0"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(b.created_at)}
                    {b.created_by && <span className="block text-xs">{b.created_by}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
