import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BatchStatusBadge } from "@/components/batch-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Order } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { batchQuery } from "@/lib/queries";

export const Route = createFileRoute("/merchant/batches/$batchId")({
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(batchQuery(params.batchId)),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: BatchPage,
});

function BatchPage() {
  const { batchId } = Route.useParams();
  const { data: batch } = useSuspenseQuery(batchQuery(batchId));
  const [problemsOnly, setProblemsOnly] = useState(false);

  const orders = problemsOnly ? batch.orders.filter((o) => o.problems.length > 0) : batch.orders;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/merchant/batches" className="text-sm text-muted-foreground hover:text-foreground">
          ← Batches
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{batch.name}</h1>
          <BatchStatusBadge status={batch.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Delivery {formatDate(batch.delivery_date)}. Uploaded {formatDateTime(batch.created_at)}
          {batch.created_by ? ` by ${batch.created_by}` : ""}
          {batch.original_filename ? ` from ${batch.original_filename}` : ""}.
        </p>
      </div>

      {batch.status === "importing" && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="size-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">Checking your file</p>
              <p className="text-sm text-muted-foreground">Reading each row and checking addresses. This usually takes a few seconds.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {batch.status === "failed" && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>We could not read this file</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{batch.error_message}</span>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link to="/merchant/batches/new">Upload a different file</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(batch.status === "ready" || batch.status === "needs_review") && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Orders" value={batch.row_count} />
            <Stat label="Ready to route" value={batch.ready_count} tone="good" />
            <Stat label="Need attention" value={batch.problem_count} tone={batch.problem_count > 0 ? "warn" : undefined} />
          </div>

          {batch.problem_count > 0 && (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>
                {batch.problem_count} {batch.problem_count === 1 ? "order needs" : "orders need"} a fix before pickup
              </AlertTitle>
              <AlertDescription>
                Correct the rows in your spreadsheet and upload the file again, or send the fixes to Handoff before your cutoff.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">Orders</h2>
            {batch.problem_count > 0 && (
              <Button variant={problemsOnly ? "default" : "outline"} size="sm" onClick={() => setProblemsOnly((v) => !v)}>
                {problemsOnly ? "Showing problems only" : "Show problems only"}
              </Button>
            )}
          </div>

          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-primary" : tone === "warn" ? "text-[#9a5b00]" : "";
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function OrderRow({ order }: { order: Order }) {
  const hasProblems = order.problems.length > 0;
  return (
    <TableRow className={hasProblems ? "bg-[#fff8e6]" : undefined}>
      <TableCell className="text-muted-foreground tabular-nums">{order.row_number}</TableCell>
      <TableCell>
        <p className="font-medium">{order.recipient_name ?? <span className="text-muted-foreground">No name</span>}</p>
        <p className="text-xs text-muted-foreground">{order.recipient_phone ?? order.recipient_email ?? "No contact"}</p>
        {order.external_id && <p className="text-xs text-muted-foreground">Ref {order.external_id}</p>}
      </TableCell>
      <TableCell>
        <p>{order.full_address || <span className="text-muted-foreground">No address</span>}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {order.leave_at_door && <Badge variant="outline">Leave at door</Badge>}
          {order.notes && <span className="text-xs text-muted-foreground">{order.notes}</span>}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{order.quantity}</TableCell>
      <TableCell>
        {hasProblems ? (
          <ul className="space-y-0.5 text-sm text-[#9a5b00]">
            {order.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-primary">Ready</span>
        )}
      </TableCell>
    </TableRow>
  );
}
