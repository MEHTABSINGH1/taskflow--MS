import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Welcome back"); nav({ to: "/dashboard" }); }
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to continue to your workspace.">
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between"><Label>Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link></div>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full glow-primary" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">No account? <Link to="/register" className="text-primary hover:underline">Create one</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden border-r border-border bg-sidebar">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_50%,#000,transparent)]" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="relative m-auto max-w-md p-12">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center"><Sparkles className="size-4 text-primary-foreground" /></div>
            <span className="font-semibold tracking-tight text-lg">TaskFlow</span>
          </Link>
          <h2 className="text-3xl font-semibold tracking-tight">Plan your work.<br />Ship with momentum.</h2>
          <p className="mt-4 text-muted-foreground">Premium task management for individuals and teams. Tasks, boards, dashboards, and admin tooling in one place.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8"><div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center"><Sparkles className="size-4 text-primary-foreground" /></div><span className="font-semibold">TaskFlow</span></div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 mb-6">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
