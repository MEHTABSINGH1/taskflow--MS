import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthShell } from "./login";

export const Route = createFileRoute("/forgot-password")({ component: Forgot });

function Forgot() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) toast.error(error);
    else { setSent(true); toast.success("Check your inbox for the reset link"); }
  };

  return <AuthShell title="Reset your password" subtitle="We'll email you a link to set a new password.">
    {sent ? (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
          If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
        </div>
        <Link to="/login"><Button variant="ghost" className="w-full">Back to sign in</Button></Link>
      </div>
    ) : (
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
        <p className="text-center text-sm text-muted-foreground">Remembered? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
      </form>
    )}
  </AuthShell>;
}
