import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { availabilityQuery } from "@/lib/queries";
import { clearSession, useSession } from "@/lib/session";

const dateAtOffset = (offset: number, baseDate = new Date()) => {
  const date = new Date(baseDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function useAvailabilityDays() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = window.setTimeout(() => setToday(new Date()), nextMidnight.getTime() - now.getTime() + 100);
    return () => window.clearTimeout(timeout);
  }, [today]);

  return useMemo(() => Array.from({ length: 14 }, (_, index) => dateAtOffset(index, today)), [today]);
}

export const Route = createFileRoute("/_app/me")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(availabilityQuery(dateAtOffset(0), dateAtOffset(13))),
  pendingComponent: () => <Skeleton className="m-4 h-64" />,
  component: MePage,
});

function MePage() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const courier = session?.courier;
  const days = useAvailabilityDays();
  const availability = availabilityQuery(days[0], days.at(-1)!);
  const { data } = useSuspenseQuery(availability);
  const availableDates = new Set(data.availability_dates);
  const updateAvailability = useMutation({
    mutationFn: ({ date, available }: { date: string; available: boolean }) => api.availability.set(date, available),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability"] }),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update availability."),
  });

  async function signOut() {
    try {
      await api.signOut();
    } finally {
      clearSession();
      await navigate({ to: "/login" });
    }
  }

  return (
    <div className="space-y-4 p-4">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">{courier?.name}</h1>
        <p className="text-sm text-muted-foreground">{courier?.email}</p>
      </header>
      <Card>
        <CardContent className="py-5">
          <dl className="divide-y text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="capitalize">{courier?.vehicle_type}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Home area</dt>
              <dd>{courier?.home_fsa ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{courier?.phone ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{courier?.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <section className="space-y-3" aria-labelledby="availability-heading">
        <header>
          <h2 id="availability-heading" className="text-lg font-semibold">Availability</h2>
          <p className="text-sm text-muted-foreground">Choose the days you can work. You’ll only receive route offers for selected days.</p>
        </header>
        <div className="grid grid-cols-2 gap-2">
          {days.map((date) => {
            const available = availableDates.has(date);
            const updatingThisDay = updateAvailability.isPending && updateAvailability.variables?.date === date;
            return (
              <Button
                key={date}
                variant={available ? "default" : "outline"}
                className="h-auto min-h-18 flex-col items-start gap-1 px-3 py-3 text-left"
                aria-pressed={available}
                disabled={updatingThisDay}
                onClick={() => updateAvailability.mutate({ date, available: !available })}
              >
                <span>{formatDate(date)}</span>
                <span className="text-xs font-normal opacity-80">{updatingThisDay ? "Saving…" : available ? "Available" : "Not available"}</span>
              </Button>
            );
          })}
        </div>
      </section>
      <Button variant="outline" className="w-full" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
