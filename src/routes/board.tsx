import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskModal } from "@/components/tasks/task-modal";
import { PriorityBadge } from "@/components/ui-ext/badges";
import { format, isPast } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";

export const Route = createFileRoute("/board")({ component: () => <RequireAuth><AppShell><Board /></AppShell></RequireAuth> });

const columns: { key: Task["status"]; label: string; accent: string }[] = [
  { key: "todo", label: "Todo", accent: "bg-muted-foreground/40" },
  { key: "in_progress", label: "In progress", accent: "bg-chart-2" },
  { key: "done", label: "Done", accent: "bg-chart-3" },
];

function Board() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [initStatus, setInitStatus] = useState<Task["status"]>("todo");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTasks((data ?? []) as Task[]);
  };
  useEffect(() => { load(); }, [user]);

  const move = async (t: Task, status: Task["status"]) => {
    if (t.status === status) return;
    const { error } = await supabase.from("tasks").update({ status }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    await logActivity("task_status_changed", { type: "task", id: t.id }, { from: t.status, to: status });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize your work in motion.</p>
        </div>
        <Button onClick={() => { setEditing(null); setInitStatus("todo"); setModalOpen(true); }} className="glow-primary"><Plus className="size-4 mr-1" /> New task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="glass rounded-xl p-3 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", col.accent)} />
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => { setEditing(null); setInitStatus(col.key); setModalOpen(true); }}><Plus className="size-3.5" /></Button>
              </div>
              <div className="space-y-2 mt-2 flex-1">
                {items.map((t, i) => {
                  const overdue = t.due_date && t.status !== "done" && isPast(new Date(t.due_date));
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => { setEditing(t); setModalOpen(true); }}
                      className="rounded-lg bg-card border border-border p-3 cursor-pointer hover:border-primary/40 transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-snug">{t.title}</h4>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <span className={cn("text-[11px]", overdue ? "text-destructive" : "text-muted-foreground")}>
                          {t.due_date ? format(new Date(t.due_date), "MMM d") : "No due date"}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                          {columns.filter((c) => c.key !== t.status).map((c) => (
                            <Button key={c.key} size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => move(t, c.key)}>→ {c.label}</Button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        open={modalOpen} onOpenChange={setModalOpen}
        task={editing ?? ({ status: initStatus } as Task)}
        onSaved={load}
      />
    </div>
  );
}
