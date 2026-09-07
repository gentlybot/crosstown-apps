import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";
import { tomorrowIso } from "@/lib/format";

export const Route = createFileRoute("/merchant/batches/new")({
  component: NewBatchPage,
});

const COLUMNS = [
  ["name", "Recipient's name. Required."],
  ["address", "Street address. Required."],
  ["postal_code", "Canadian postal code. Required."],
  ["phone or email", "At least one, so the customer can get updates."],
  ["unit", "Apartment, suite, or buzzer."],
  ["city", "Defaults to your pickup city when blank."],
  ["quantity", "Packages at this stop. Defaults to 1."],
  ["leave_at_door", "yes or no."],
  ["notes", "Anything the courier should know."],
  ["order_id", "Your reference, shown on labels and invoices."],
];

function NewBatchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(tomorrowIso());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const batch = await api.createBatch({ file, delivery_date: deliveryDate, name: name.trim() || undefined });
      await queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Batch uploaded. Checking the rows now.");
      await navigate({ to: "/merchant/batches/$batchId", params: { batchId: String(batch.id) } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload the file. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <div className="space-y-6">
        <div>
          <Link to="/merchant/batches" className="text-sm text-muted-foreground hover:text-foreground">
            ← Batches
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">New batch</h1>
          <p className="text-sm text-muted-foreground">
            Upload a CSV of orders. Every row is checked and anything that cannot be delivered as-is gets flagged.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="file">Orders file</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">CSV up to 2 MB, one order per row, with a header row.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Batch name <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Tuesday flowers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!file || busy}>
                  {busy ? "Uploading" : "Upload and check orders"}
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link to="/merchant/batches">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-base">Columns we look for</CardTitle>
          <CardDescription>
            Header names are matched loosely, so "Postal Code", "Phone Number", and "Qty" all work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            {COLUMNS.map(([col, help]) => (
              <div key={col}>
                <dt className="font-mono text-xs font-medium">{col}</dt>
                <dd className="text-muted-foreground">{help}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sample files</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/sample-orders-clean.csv" download>
                  10 orders, all clean
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/sample-orders-problems.csv" download>
                  10 orders, 3 with problems
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
