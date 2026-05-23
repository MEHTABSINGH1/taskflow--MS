import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./login";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setReady(true);
    else {
      supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); nav({ to: "/login" }); }
  };

  return <AuthShell title="Set a new password" subtitle="Choose something memorable but strong.">
    {!ready ? (
      <p className="text-sm text-muted-foreground">Invalid or expired reset link.</p>
    ) : (
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label>New password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
      </form>
    )}
  </AuthShell>;
}
