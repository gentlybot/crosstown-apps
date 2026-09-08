import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, type Offer } from "@/lib/api";
import { formatDate, formatDuration, formatTime, minutesUntil, money } from "@/lib/format";
import { offersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_app/offers")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(offersQuery),
  pendingComponent: () => <Skeleton className="m-4 h-40" />,
  component: OffersPage,
});

function OffersPage() {
  const { data: offers } = useSuspenseQuery(offersQuery);
  return (
    <div className="space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Offers</h1>
        <p className="text-sm text-muted-foreground">Routes near you. Pay is shown before you accept.</p>
      </header>
      {offers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">No open offers right now</p>
            <p className="mt-1 text-sm text-muted-foreground">New routes usually appear after merchant cutoffs. We'll email you too.</p>
          </CardContent>
        </Card>
      ) : (
        offers.map((o) => <OfferCard key={o.id} offer={o} />)
      )}
    </div>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(() => minutesUntil(offer.expires_at));
  useEffect(() => {
    const t = setInterval(() => setMinutes(minutesUntil(offer.expires_at)), 30_000);
    return () => clearInterval(t);
  }, [offer.expires_at]);

  const accept = useMutation({
    mutationFn: () => api.offers.accept(offer.id),
    onSuccess: async (route) => {
      toast.success(`${route.display_name} is yours.`);
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
      await navigate({ to: "/routes/$routeId", params: { routeId: String(route.id) } });
    },
    onError: async (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not accept the offer.");
      await queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
  const decline = useMutation({
    mutationFn: () => api.offers.decline(offer.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });

  const r = offer.route;
  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{r.merchant.business_name}</p>
            <p className="text-lg font-semibold leading-tight">{r.display_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(r.delivery_date)}. Leaves {formatTime(r.start_at)}
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-primary">{money(offer.pay_cents)}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Stops</dt>
            <dd className="font-medium">{r.stop_count}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Distance</dt>
            <dd className="font-medium">{r.distance_km} km</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">About</dt>
            <dd className="font-medium">{formatDuration(r.duration_minutes)}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          Pickup {r.merchant.pickup_address}
          {r.first_stop_fsa ? `, first stop in ${r.first_stop_fsa}` : ""}.
        </p>
        <div className="flex items-center gap-2">
          <Button size="lg" className="flex-1" onClick={() => accept.mutate()} disabled={accept.isPending}>
            {accept.isPending ? "Accepting" : "Accept route"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => decline.mutate()} disabled={decline.isPending}>
            Decline
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{minutes > 0 ? `Closes in ${formatDuration(minutes)}` : "Closing now"}</p>
      </CardContent>
    </Card>
  );
}
