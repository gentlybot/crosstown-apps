import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BatchStatusBadge } from "@/components/batch-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatLongDate, shiftIso, todayIso } from "@/lib/format";
import { adminBatchesQuery } from "@/lib/queries";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const Route = createFileRoute("/admin/batches/")({
  // Optional so plain links to /admin/batches work; absent means today.
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === "string" && ISO_DATE.test(search.date) ? search.date : undefined,
  }),
  loaderDeps: ({ search }) => ({ date: search.date ?? todayIso() }),
  loader: ({ context: { queryClient }, deps }) => queryClient.ensureQueryData(adminBatchesQuery(deps.date)),
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: AdminBatchesPage,
});

function AdminBatchesPage() {
  const search = Route.useSearch();
  const date = search.date ?? todayIso();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(adminBatchesQuery(date));
  const isToday = date === todayIso();

  function goTo(next: string) {
    void navigate({ search: { date: next } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Batches</h1>
          <p className="text-sm text-muted-foreground">Every merchant's uploads for one delivery day.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => goTo(shiftIso(date, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            aria-label="Delivery date"
            className="w-[11rem]"
            value={date}
            onChange={(e) => e.target.value && goTo(e.target.value)}
          />
          <Button variant="outline" size="icon" aria-label="Next day" onClick={() => goTo(shiftIso(date, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => goTo(todayIso())}>
              Today
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Batches" value={data.totals.batches} hint={`${data.totals.merchants} ${data.totals.merchants === 1 ? "merchant" : "merchants"}`} />
        <Stat label="Orders" value={data.totals.orders} />
        <Stat label="Ready to route" value={data.totals.ready} tone="good" />
        <Stat label="Need attention" value={data.totals.problems} tone={data.totals.problems > 0 ? "warn" : undefined} />
      </div>

      {data.batches.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <h2 className="font-semibold">Nothing scheduled for {formatLongDate(date)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">No merchant has uploaded a batch for this day yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Need attention</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.merchant.business_name}</TableCell>
                  <TableCell>
                    <Link
                      to="/admin/batches/$batchId"
                      params={{ batchId: String(b.id) }}
                      search={{ date }}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </Link>
                    {b.original_filename && <p className="text-xs text-muted-foreground">{b.original_filename}</p>}
                  </TableCell>
                  <TableCell>
                    <BatchStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{b.status === "importing" ? "…" : b.row_count}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b.problem_count > 0 ? <span className="font-medium text-[#9a5b00]">{b.problem_count}</span> : "0"}
                  </TableCell>
                  <TableCell className="tabular-nums">{b.merchant.cutoff_time}</TableCell>
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

function Stat({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-primary" : tone === "warn" ? "text-[#9a5b00]" : "";
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
