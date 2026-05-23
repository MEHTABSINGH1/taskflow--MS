import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/ui-ext/stat-card";
import { Users, ListTodo, CheckCircle2, Activity as ActivityIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, startOfDay, subDays, isAfter, isBefore } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/")({ component: () => <RequireAuth admin><AppShell><Admin /></AppShell></RequireAuth> });

function Admin() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: tasks }, { count: usersCount }, { data: logs }] = await Promise.all([
        supabase.from("tasks").select("id,status,completed_at,created_at"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("activity_logs").select("id,action,created_at,metadata,user_id").order("created_at", { ascending: false }).limit(20),
      ]);
      setData({ tasks: tasks ?? [], usersCount: usersCount ?? 0, logs: logs ?? [] });
    })();
  }, []);

  const trend = useMemo(() => {
    if (!data) return [];
    const days = Array.from({ length: 14 }).map((_, i) => startOfDay(subDays(new Date(), 13 - i)));
    return days.map((d) => {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      return {
        day: format(d, "MMM d"),
        created: data.tasks.filter((t: any) => isAfter(new Date(t.created_at), d) && isBefore(new Date(t.created_at), next)).length,
        completed: data.tasks.filter((t: any) => t.completed_at && isAfter(new Date(t.completed_at), d) && isBefore(new Date(t.completed_at), next)).length,
      };
    });
  }, [data]);

  if (!data) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div></div>;

  const completed = data.tasks.filter((t: any) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace health, users, and tasks at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Users" value={data.usersCount} icon={<Users className="size-4" />} />
        <StatCard label="Total tasks" value={data.tasks.length} icon={<ListTodo className="size-4" />} delay={0.05} />
        <StatCard label="Completed" value={completed} icon={<CheckCircle2 className="size-4" />} delay={0.1} trend={`${data.tasks.length ? Math.round((completed / data.tasks.length) * 100) : 0}% rate`} />
        <StatCard label="Activity (24h)" value={data.logs.filter((l: any) => +new Date(l.created_at) > Date.now() - 86400000).length} icon={<ActivityIcon className="size-4" />} delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Task velocity (14 days)</h3></div>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="oklch(0.65 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.65 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "oklch(0.2 0.015 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="created" stroke="oklch(0.68 0.19 285)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" stroke="oklch(0.78 0.17 145)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-xl p-5">
        <h3 className="font-semibold mb-4">Recent activity</h3>
        <div className="divide-y divide-border">
          {data.logs.map((l: any) => (
            <div key={l.id} className="py-3 flex items-center gap-3 text-sm">
              <span className="size-2 rounded-full bg-primary" />
              <span className="flex-1 capitalize">{l.action.replace(/_/g, " ")}{l.metadata?.title ? ` — ${l.metadata.title}` : ""}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(l.created_at), "MMM d, HH:mm")}</span>
            </div>
          ))}
          {data.logs.length === 0 && <div className="text-sm text-muted-foreground py-8 text-center">No activity yet.</div>}
        </div>
      </motion.div>
    </div>
  );
}
