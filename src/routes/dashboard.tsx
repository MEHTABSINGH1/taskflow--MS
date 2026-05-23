import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui-ext/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, isAfter, isBefore } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@/types/task";
import { StatusBadge, PriorityBadge } from "@/components/ui-ext/badges";

export const Route = createFileRoute("/dashboard")({ component: () => <RequireAuth><AppShell><Dashboard /></AppShell></RequireAuth> });

function Dashboard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: a }] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("id,action,created_at,metadata").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      ]);
      setTasks((t ?? []) as Task[]);
      setActivity(a ?? []);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const list = tasks ?? [];
    const total = list.length;
    const done = list.filter((t) => t.status === "done").length;
    const inProg = list.filter((t) => t.status === "in_progress").length;
    const overdue = list.filter((t) => t.status !== "done" && t.due_date && isBefore(new Date(t.due_date), new Date())).length;
    return { total, done, inProg, overdue, completion: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  const pieData = [
    { name: "Todo", value: (tasks ?? []).filter((t) => t.status === "todo").length, color: "oklch(0.7 0.02 270)" },
    { name: "In progress", value: stats.inProg, color: "oklch(0.72 0.16 195)" },
    { name: "Done", value: stats.done, color: "oklch(0.78 0.17 145)" },
  ];

  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => startOfDay(subDays(new Date(), 6 - i)));
    return days.map((d) => {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const completed = (tasks ?? []).filter((t) => t.completed_at && isAfter(new Date(t.completed_at), d) && isBefore(new Date(t.completed_at), next)).length;
      const created = (tasks ?? []).filter((t) => isAfter(new Date(t.created_at), d) && isBefore(new Date(t.created_at), next)).length;
      return { day: format(d, "EEE"), completed, created };
    });
  }, [tasks]);

  if (tasks === null) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {profile?.full_name?.split(" ")[0] || "there"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening in your workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total tasks" value={stats.total} icon={<ListTodo className="size-4" />} delay={0} />
        <StatCard label="In progress" value={stats.inProg} icon={<Clock className="size-4" />} delay={0.05} trend={`${stats.total - stats.done} open`} />
        <StatCard label="Completed" value={stats.done} icon={<CheckCircle2 className="size-4" />} delay={0.1} trend={`${stats.completion}% completion`} />
        <StatCard label="Overdue" value={stats.overdue} icon={<AlertTriangle className="size-4" />} delay={0.15} className={stats.overdue > 0 ? "ring-1 ring-destructive/30" : ""} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Activity this week</h3><span className="text-xs text-muted-foreground">Created vs Completed</span></div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={last7}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.65 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.65 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.2 0.015 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 8 }} />
                <Bar dataKey="created" fill="oklch(0.68 0.19 285)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="oklch(0.78 0.17 145)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">Status breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.2 0.015 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: d.color }} /><span className="text-muted-foreground">{d.name}</span></div>
                <span className="font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent tasks</h3>
          <div className="space-y-2">
            {(tasks ?? []).slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.due_date ? `Due ${format(new Date(t.due_date), "MMM d")}` : "No due date"}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></div>
              </div>
            ))}
            {tasks!.length === 0 && <EmptyState label="No tasks yet. Create your first task to get started." />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent activity</h3>
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <span className="size-2 rounded-full bg-primary shrink-0" />
                <span className="flex-1 capitalize">{(a.action as string).replace(/_/g, " ")}{a.metadata?.title ? ` — ${a.metadata.title}` : ""}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, HH:mm")}</span>
              </div>
            ))}
            {activity.length === 0 && <EmptyState label="No activity yet." />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">{label}</div>;
}
