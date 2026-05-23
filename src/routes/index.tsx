import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Kanban, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && user) nav({ to: "/dashboard" }); }, [user, loading, nav]);

  return (
    <div className="min-h-screen text-foreground">
      <header className="h-16 px-6 lg:px-10 flex items-center justify-between border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">TaskFlow</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
          <Link to="/register"><Button size="sm" className="glow-primary">Get started</Button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(60%_50%_at_50%_30%,#000,transparent)]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-chart-3 animate-pulse" /> Now in early access
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight"
          >
            Task management,
            <br />
            <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">built for momentum.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            A premium workspace for individuals and teams to plan, prioritize, and ship work — with a board, dashboard, and admin controls.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mt-9 flex items-center justify-center gap-3"
          >
            <Link to="/register"><Button size="lg" className="glow-primary">Start for free <ArrowRight className="ml-1.5 size-4" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="ghost">Sign in</Button></Link>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
            className="glass rounded-2xl p-6"
          >
            <div className="size-10 rounded-lg bg-primary/15 grid place-items-center text-primary"><f.icon className="size-5" /></div>
            <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TaskFlow
      </footer>
    </div>
  );
}

const features = [
  { icon: Kanban, title: "Beautiful Kanban board", desc: "Drag-free clean swimlanes by status with priority cues and due dates." },
  { icon: Zap, title: "Realtime dashboard", desc: "Track progress, completion velocity, and recent activity at a glance." },
  { icon: Shield, title: "Admin controls", desc: "Manage users, monitor activity, and oversee all tasks across the workspace." },
  { icon: CheckCircle2, title: "Priorities & due dates", desc: "Four priority levels with smart overdue highlighting." },
  { icon: Sparkles, title: "Premium UI", desc: "Dark, glassmorphic, animated — designed to feel like Linear and Notion." },
  { icon: ArrowRight, title: "Deploy ready", desc: "Built on a managed cloud backend with auth, roles, and RLS out of the box." },
];
