import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { getSession, homeFor } from "@/lib/session";

// The trailing underscore keeps this route out of the /merchant layout, so the
// sign-in page remains available before authentication.
export const Route = createFileRoute("/merchant_/login")({
  beforeLoad: () => {
    const session = getSession();
    if (session) throw redirect({ to: homeFor(session) });
  },
  component: () => (
    <LoginForm
      title="Sign in"
      description="Use the email your Crosstown account was set up with."
      audience="merchant"
      demo={{ label: "Sign in as Maya at Bloom & Stem", email: "maya@bloomandstem.example" }}
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Crosstown staff?{" "}
          <Link to="/admin/login" className="underline-offset-4 hover:text-foreground hover:underline">
            Sign in to ops
          </Link>
        </p>
      }
    />
  ),
});
