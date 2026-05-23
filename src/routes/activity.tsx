import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const labels: Record<string, string> = {
  login: "Signed in", logout: "Signed out", signup: "Account created",
  task_created: "Created a task", task_updated: "Updated a task", task_deleted: "Deleted a task", task_status_changed: "Moved a task",
  user_activated: "Activated a user", user_deactivated: "Deactivated a user", role_changed: "Changed role",
};

export const Route = createFileRoute("/activity")({ component: () => <RequireAuth><AppShell><Activity /></AppShell></RequireAuth> });

function Activity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[] | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setLogs(data ?? []));
  }, [user]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Your most recent actions in the workspace.</p>
      </div>
      {logs === null ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div> :
        logs.length === 0 ? <div className="glass rounded-xl py-20 text-center text-muted-foreground">No activity yet.</div> :
        <div className="glass rounded-xl divide-y divide-border">
          {logs.map((l, i) => (
            <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="p-4 flex items-center gap-4">
              <span className="size-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">{labels[l.action] ?? l.action}{l.metadata?.title ? <span className="text-muted-foreground"> — {l.metadata.title}</span> : null}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(l.created_at), "PPpp")}</div>
              </div>
            </motion.div>
          ))}
        </div>
      }
    </div>
  );
}
