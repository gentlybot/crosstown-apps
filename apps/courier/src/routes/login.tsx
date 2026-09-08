import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";
import { getSession, setSession } from "@/lib/session";

const DEMO = { email: "jordan@courier.example", password: "crosstown-demo" };

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getSession()) throw redirect({ to: "/offers" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: string, p: string) {
    setBusy(true);
    setError(null);
    try {
      const session = await api.signIn(e, p);
      if (session.user.role !== "courier" || !session.courier) {
        setError("This app is for Crosstown couriers. Shops and staff sign in on the web.");
        return;
      }
      setSession(session);
      await navigate({ to: "/offers" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach Crosstown. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(email, password);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-2.5">
        <BrandMark className="h-9 w-auto" />
        <div>
          <p className="text-xl font-semibold leading-tight tracking-tight">Crosstown</p>
          <p className="text-sm text-muted-foreground">Courier</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the email from your courier application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy || !email || !password}>
              {busy ? "Signing in" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Demo workspace.{" "}
        <button type="button" className="underline-offset-4 hover:underline disabled:opacity-60" disabled={busy} onClick={() => signIn(DEMO.email, DEMO.password)}>
          Sign in as Jordan
        </button>
      </p>
    </main>
  );
}
