import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/customer/")({
  component: CustomerPage,
});

function CustomerPage() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Customer tracking</CardTitle>
        <CardDescription>Delivery tracking will be available here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Soon, you’ll be able to open a tracking link and follow your delivery from pickup to arrival.
        </p>
      </CardContent>
    </Card>
  );
}
