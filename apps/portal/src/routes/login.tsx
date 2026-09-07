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

const DEMO_EMAIL = "maya@bloomandstem.example";
const DEMO_PASSWORD = "handoff-demo";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getSession()) throw redirect({ to: "/merchant/batches" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(emailToUse: string, passwordToUse: string) {
    setBusy(true);
    setError(null);
    try {
      const session = await api.signIn(emailToUse, passwordToUse);
      setSession(session);
      await navigate({ to: "/merchant/batches" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach Handoff. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(email, password);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandMark className="h-8 w-auto" />
          <span className="text-xl font-semibold tracking-tight">Handoff</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the email your Handoff account was set up with.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={busy || !email || !password}>
                {busy ? "Signing in" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo workspace.{" "}
          <button
            type="button"
            className="underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
            disabled={busy}
            onClick={() => signIn(DEMO_EMAIL, DEMO_PASSWORD)}
          >
            Sign in as Maya at Bloom &amp; Stem
          </button>
        </p>
      </div>
    </main>
  );
}
