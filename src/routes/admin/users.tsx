import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Search, Trash2, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/users")({ component: () => <RequireAuth admin><AppShell><AdminUsers /></AppShell></RequireAuth> });

type Row = { id: string; email: string; full_name: string | null; is_active: boolean; created_at: string; role: "admin" | "user" };

function AdminUsers() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    setRows((profiles ?? []).map((p) => ({
      id: p.id, email: p.email, full_name: p.full_name, is_active: p.is_active,
      created_at: p.created_at, role: (roleMap.get(p.id) ?? "user") as "admin" | "user",
    })));
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (r: Row) => {
    const next = !r.is_active;
    const { error } = await supabase.from("profiles").update({ is_active: next }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity(next ? "user_activated" : "user_deactivated", { type: "user", id: r.id }, { email: r.email });
    toast.success(`${r.email} ${next ? "activated" : "deactivated"}`);
    load();
  };

  const toggleAdmin = async (r: Row) => {
    if (r.role === "admin") {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", r.id).eq("role", "admin");
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: r.id, role: "admin" });
      if (error) return toast.error(error.message);
    }
    await logActivity("role_changed", { type: "user", id: r.id }, { email: r.email, to: r.role === "admin" ? "user" : "admin" });
    toast.success("Role updated");
    load();
  };

  const filtered = (rows ?? []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || r.full_name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{rows?.length ?? 0} users in the workspace</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="pl-9 bg-background/40" />
        </div>
      </div>

      {rows === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8"><AvatarFallback className="bg-primary/20 text-primary text-xs">{(r.full_name || r.email)[0]?.toUpperCase()}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{r.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">{r.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.role === "admin"
                      ? <Badge className="bg-primary/15 text-primary border-primary/30 border"><ShieldCheck className="size-3 mr-1" />Admin</Badge>
                      : <Badge variant="outline">Member</Badge>}
                  </TableCell>
                  <TableCell><div className="flex items-center gap-2"><Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} /><span className="text-xs text-muted-foreground">{r.is_active ? "Active" : "Inactive"}</span></div></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleAdmin(r)}>{r.role === "admin" ? "Revoke admin" : "Make admin"}</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Remove this user's profile?</AlertDialogTitle><AlertDialogDescription>This removes their profile and tasks. The auth account remains.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            const { error } = await supabase.from("profiles").delete().eq("id", r.id);
                            if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
                          }}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-12">No users found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
