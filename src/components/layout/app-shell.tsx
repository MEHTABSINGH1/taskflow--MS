import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListChecks, Kanban, Activity, Users, Settings,
  LogOut, ChevronRight, Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/board", label: "Board", icon: Kanban },
  { to: "/activity", label: "Activity", icon: Activity },
];
const adminNav = [
  { to: "/admin", label: "Admin", icon: Sparkles },
  { to: "/admin/users", label: "Users", icon: Users },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const loc = useLocation();
  const nav2 = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (profile?.full_name || profile?.email || "U")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static z-40 h-screen w-64 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-xl flex-col",
        "transition-transform lg:translate-x-0",
        open ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
      )}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 grid place-items-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">TaskFlow</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          <SectionLabel>Workspace</SectionLabel>
          {nav.map((n) => <NavItem key={n.to} {...n} active={loc.pathname === n.to} />)}
          {isAdmin && (<>
            <SectionLabel className="mt-5">Administration</SectionLabel>
            {adminNav.map((n) => <NavItem key={n.to} {...n} active={loc.pathname.startsWith(n.to)} />)}
          </>)}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition">
            <Avatar className="size-9"><AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{profile?.full_name || profile?.email}</div>
              <div className="text-[11px] text-muted-foreground truncate">{isAdmin ? "Administrator" : "Member"}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={async () => { await signOut(); nav2({ to: "/login" }); }}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 flex items-center gap-3 px-4 lg:px-8 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-20">
          <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)}>
            <ChevronRight className="size-5" />
          </Button>
          <Breadcrumbs path={loc.pathname} />
        </header>
        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>{children}</div>;
}

function NavItem({ to, label, icon: Icon, active }: { to: string; label: string; icon: any; active: boolean }) {
  return (
    <Link to={to} className={cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition relative",
      active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
    )}>
      {active && <motion.span layoutId="navdot" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r" />}
      <Icon className="size-4" />
      <span>{label}</span>
    </Link>
  );
}

function Breadcrumbs({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {parts.length === 0 ? (
        <span className="text-muted-foreground">Home</span>
      ) : parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
          <span className={cn(i === parts.length - 1 ? "text-foreground font-medium capitalize" : "text-muted-foreground capitalize")}>{p}</span>
        </span>
      ))}
    </div>
  );
}
