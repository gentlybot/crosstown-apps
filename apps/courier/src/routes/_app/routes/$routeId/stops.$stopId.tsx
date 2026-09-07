import { useRef, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Image as ImageIcon, Phone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, FAILURE_REASONS, api, type CourierStop, type FailureReason } from "@/lib/api";
import { formatTime, mapsUrl } from "@/lib/format";
import { capturePhotoNative, fileToPhoto, isNative } from "@/lib/photo";
import { routeQuery } from "@/lib/queries";

export const Route = createFileRoute("/_app/routes/$routeId/stops/$stopId")({
  loader: ({ context: { queryClient }, params }) => queryClient.ensureQueryData(routeQuery(params.routeId)),
  pendingComponent: () => <Skeleton className="m-4 h-64" />,
  component: StopPage,
});

function StopPage() {
  const { routeId, stopId } = Route.useParams();
  const { data: route } = useSuspenseQuery(routeQuery(routeId));
  const stop = route.stops.find((s) => String(s.id) === stopId);

  if (!stop) {
    return (
      <div className="p-4">
        <p>That stop is not on this route.</p>
        <Link to="/routes/$routeId" params={{ routeId }} className="underline">
          Back to the route
        </Link>
      </div>
    );
  }

  const canAct = route.status === "in_progress" && stop.status === "pending";

  return (
    <div className="space-y-4 p-4">
      <header className="pt-2">
        <Link to="/routes/$routeId" params={{ routeId }} className="text-sm text-muted-foreground">
          ← {route.display_name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Stop {stop.position}</h1>
          {stop.status !== "pending" && <Badge className={stop.status === "delivered" ? "bg-primary text-primary-foreground" : "bg-[#b45309] text-white"}>{stop.status === "delivered" ? "Delivered" : "Not delivered"}</Badge>}
          {stop.leave_at_door && <Badge variant="outline">Leave at door</Badge>}
        </div>
      </header>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-lg font-semibold">{stop.recipient_name ?? "No name"}</p>
            <p className="text-muted-foreground">{stop.address}</p>
            {stop.unit && <p className="text-sm text-muted-foreground">Unit {stop.unit}</p>}
          </div>
          {stop.notes && <p className="rounded-lg bg-[#fff8e6] px-3 py-2 text-sm">{stop.notes}</p>}
          <p className="text-sm text-muted-foreground">
            {stop.quantity} {stop.quantity === 1 ? "package" : "packages"}. ETA {formatTime(stop.eta)}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <a href={mapsUrl(stop.lat, stop.lng)} target="_blank" rel="noreferrer">
                Directions
              </a>
            </Button>
            {stop.recipient_phone && (
              <Button variant="outline" asChild className="flex-1">
                <a href={`tel:${stop.recipient_phone}`}>
                  <Phone className="size-4" /> Call
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {stop.status !== "pending" && (
        <Card>
          <CardContent className="py-5 text-sm">
            <p>
              {stop.status === "delivered" ? "Delivered" : "Not delivered"} at {stop.completed_at ? formatTime(stop.completed_at) : ""}
              {stop.failure_reason ? `: ${FAILURE_REASONS.find((r) => r.value === stop.failure_reason)?.label ?? stop.failure_reason}` : ""}.
            </p>
            {stop.note && <p className="mt-1 text-muted-foreground">Note: {stop.note}</p>}
            {stop.has_photo && <p className="mt-1 text-muted-foreground">Photo attached.</p>}
          </CardContent>
        </Card>
      )}

      {canAct && <StopActions key={stop.id} routeId={routeId} routeDbId={route.id} stop={stop} />}
    </div>
  );
}

/** Keyed by stop id by the parent, so photo, note, and mode reset between stops. */
function StopActions({ routeId, routeDbId, stop }: { routeId: string; routeDbId: number; stop: CourierStop }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [failing, setFailing] = useState(false);
  const [reason, setReason] = useState<FailureReason | "">("");
  const fileInput = useRef<HTMLInputElement>(null);

  const complete = useMutation({
    mutationFn: (input: { status: "delivered" | "failed"; failure_reason?: FailureReason }) =>
      api.routes.completeStop(routeDbId, stop.id, { ...input, note: note.trim() || undefined, photo }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(routeQuery(routeId).queryKey, updated);
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
      const next = updated.stops.find((s) => s.status === "pending");
      if (updated.status === "completed") {
        toast.success("Route complete. Nice work.");
        await navigate({ to: "/routes/$routeId", params: { routeId } });
      } else if (next) {
        toast.success(`Stop ${stop.position} done. Next: ${next.recipient_name ?? next.address}.`);
        await navigate({ to: "/routes/$routeId/stops/$stopId", params: { routeId, stopId: String(next.id) } });
      } else {
        await navigate({ to: "/routes/$routeId", params: { routeId } });
      }
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not save the stop."),
  });

  // Native builds use the Capacitor camera. In a browser the hidden file input
  // does the job: mobile browsers open the camera for `capture`, desktops a
  // picker, and tests can set the file directly.
  async function takePhoto(source: "camera" | "library") {
    if (isNative()) {
      const data = await capturePhotoNative(source);
      if (data) setPhoto(data);
      return;
    }
    const input = fileInput.current;
    if (!input) return;
    if (source === "camera") input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.value = "";
    input.click();
  }

  async function onFilePicked(file: File | undefined) {
    if (!file) return;
    const data = await fileToPhoto(file);
    if (data) setPhoto(data);
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="space-y-2">
          <Label>Proof at the door</Label>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" data-testid="photo-input" onChange={(e) => onFilePicked(e.target.files?.[0])} />
          {photo ? (
            <div className="space-y-2">
              <img src={photo} alt="Proof of delivery" className="max-h-56 w-full rounded-lg object-cover" />
              <Button variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                Retake
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => takePhoto("camera")}>
                <Camera className="size-4" /> Take photo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => takePhoto("library")}>
                <ImageIcon className="size-4" /> Choose photo
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note for the customer (optional)</Label>
          <Textarea id="note" rows={2} placeholder="Left with the concierge" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {!failing ? (
          <div className="space-y-2">
            <Button size="lg" className="w-full" onClick={() => complete.mutate({ status: "delivered" })} disabled={complete.isPending}>
              {complete.isPending ? "Saving" : "Mark delivered"}
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => setFailing(true)}>
              Could not deliver
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border p-3">
            <Label htmlFor="reason">What happened?</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as FailureReason)}>
              <SelectTrigger id="reason" className="w-full">
                <SelectValue placeholder="Pick a reason" />
              </SelectTrigger>
              <SelectContent>
                {FAILURE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="lg" variant="destructive" className="flex-1" disabled={!reason || complete.isPending} onClick={() => reason && complete.mutate({ status: "failed", failure_reason: reason })}>
                Mark not delivered
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setFailing(false)}>
                Back
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The package goes back to the merchant tonight.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
