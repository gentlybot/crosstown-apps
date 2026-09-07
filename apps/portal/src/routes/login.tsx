import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { getSession, homeFor } from "@/lib/session";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const session = getSession();
    if (session) throw redirect({ to: homeFor(session) });
  },
  component: () => (
    <LoginForm
      title="Sign in"
      description="Use the email your Handoff account was set up with."
      audience="merchant"
      demo={{ label: "Sign in as Maya at Bloom & Stem", email: "maya@bloomandstem.example" }}
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Handoff staff?{" "}
          <Link to="/admin/login" className="underline-offset-4 hover:text-foreground hover:underline">
            Sign in to ops
          </Link>
        </p>
      }
    />
  ),
});
