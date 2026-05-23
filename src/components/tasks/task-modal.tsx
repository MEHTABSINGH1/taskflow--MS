import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import type { Task } from "@/types/task";

export function TaskModal({
  open, onOpenChange, task, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? "todo");
    setPriority(task?.priority ?? "medium");
    setDueDate(task?.due_date ? task.due_date.slice(0, 10) : "");
  }, [open, task]);

  const save = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!user) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status, priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    };
    if (task?.id) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
      if (error) toast.error(error.message);
      else { await logActivity("task_updated", { type: "task", id: task.id }); toast.success("Task updated"); onSaved?.(); onOpenChange(false); }
    } else {
      const { data, error } = await supabase.from("tasks").insert({ ...payload, user_id: user.id }).select("id").single();
      if (error) toast.error(error.message);
      else { await logActivity("task_created", { type: "task", id: data.id }, { title: payload.title }); toast.success("Task created"); onSaved?.(); onOpenChange(false); }
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] glass">
        <DialogHeader><DialogTitle>{task?.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} placeholder="Add context (optional)" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : task?.id ? "Save changes" : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
