import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Calendar as CalIcon } from "lucide-react";
import { TaskModal } from "@/components/tasks/task-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, PriorityBadge } from "@/components/ui-ext/badges";
import { format, isPast } from "date-fns";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/tasks")({ component: () => <RequireAuth><AppShell><Tasks /></AppShell></RequireAuth> });

function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [sort, setSort] = useState<string>("created_desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id);
    setTasks((data ?? []) as Task[]);
  };
  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(() => {
    let list = [...(tasks ?? [])];
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (priority !== "all") list = list.filter((t) => t.priority === priority);
    const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    switch (sort) {
      case "due_asc": list.sort((a, b) => (a.due_date ? +new Date(a.due_date) : Infinity) - (b.due_date ? +new Date(b.due_date) : Infinity)); break;
      case "priority": list.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]); break;
      case "title": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [tasks, search, status, priority, sort]);

  const remove = async (t: Task) => {
    const { error } = await supabase.from("tasks").delete().eq("id", t.id);
    if (error) toast.error(error.message);
    else { await logActivity("task_deleted", { type: "task", id: t.id }, { title: t.title }); toast.success("Task deleted"); load(); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {tasks?.length ?? 0} tasks</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="glow-primary"><Plus className="size-4 mr-1" /> New task</Button>
      </div>

      <div className="glass rounded-xl p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9 bg-background/40" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px] bg-background/40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="todo">Todo</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[150px] bg-background/40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All priorities</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[170px] bg-background/40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="created_desc">Newest first</SelectItem><SelectItem value="due_asc">Due date</SelectItem><SelectItem value="priority">Priority</SelectItem><SelectItem value="title">Title (A→Z)</SelectItem></SelectContent>
        </Select>
      </div>

      {tasks === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl py-20 text-center">
          <p className="text-muted-foreground">No tasks match your filters.</p>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="mt-4"><Plus className="size-4 mr-1" /> Create a task</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
          {filtered.map((t, i) => {
            const overdue = t.due_date && t.status !== "done" && isPast(new Date(t.due_date));
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-card/60 transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium truncate">{t.title}</h4>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.description}</p>}
                  {t.due_date && (
                    <div className={cn("text-xs mt-1.5 flex items-center gap-1", overdue ? "text-destructive" : "text-muted-foreground")}>
                      <CalIcon className="size-3" /> {format(new Date(t.due_date), "MMM d, yyyy")}{overdue && " · overdue"}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setModalOpen(true); }}><Pencil className="size-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete this task?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(t)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={editing} onSaved={load} />
    </div>
  );
}
