import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthShell } from "./login";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Check your email to confirm your account, then sign in."); nav({ to: "/login" }); }
  };

  return <AuthShell title="Create your account" subtitle="Start organizing your work in minutes.">
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label>Full name</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button type="submit" className="w-full glow-primary" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
      <p className="text-center text-sm text-muted-foreground">Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
    </form>
  </AuthShell>;
}
