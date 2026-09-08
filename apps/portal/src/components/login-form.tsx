import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";
import { homeFor, setSession, type Session } from "@/lib/session";

export const DEMO_PASSWORD = "crosstown-demo";

type Props = {
  title: string;
  description: string;
  /** "staff" refuses merchant accounts; "merchant" sends staff to the ops portal. */
  audience: "merchant" | "staff";
  demo: { label: string; email: string };
  footer?: React.ReactNode;
};

export function LoginForm({ title, description, audience, demo, footer }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(emailToUse: string, passwordToUse: string) {
    setBusy(true);
    setError(null);
    try {
      const session: Session = await api.signIn(emailToUse, passwordToUse);
      if (session.user.role === "courier") {
        setError("Couriers use the Crosstown courier app, not this site.");
        return;
      }
      if (audience === "staff" && session.user.role !== "admin") {
        setError("This sign-in is for Crosstown staff. Merchants sign in at the main page.");
        return;
      }
      setSession(session);
      await navigate({ to: homeFor(session) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach Crosstown. Try again in a moment.");
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
          <span className="text-xl font-semibold tracking-tight">Crosstown</span>
          {audience === "staff" && <span className="ml-1 text-sm text-muted-foreground">ops</span>}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
            onClick={() => signIn(demo.email, DEMO_PASSWORD)}
          >
            {demo.label}
          </button>
        </p>
        {footer}
      </div>
    </main>
  );
}
