import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/login" });
    else if (admin && !isAdmin) nav({ to: "/dashboard" });
  }, [user, loading, isAdmin, admin, nav]);

  if (loading || !user || (admin && !isAdmin)) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
