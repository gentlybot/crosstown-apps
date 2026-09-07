import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { getSession, homeFor } from "@/lib/session";

// The trailing underscore keeps this route out of the /admin layout, so the
// role guard there does not apply to the sign-in page itself.
export const Route = createFileRoute("/admin_/login")({
  beforeLoad: () => {
    const session = getSession();
    if (session) throw redirect({ to: homeFor(session) });
  },
  component: () => (
    <LoginForm
      title="Staff sign in"
      description="For the Handoff operations team."
      audience="staff"
      demo={{ label: "Sign in as Priya in Handoff ops", email: "ops@handoff.delivery" }}
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Running a shop?{" "}
          <Link to="/merchant/login" className="underline-offset-4 hover:text-foreground hover:underline">
            Merchant sign in
          </Link>
        </p>
      }
    />
  ),
});
