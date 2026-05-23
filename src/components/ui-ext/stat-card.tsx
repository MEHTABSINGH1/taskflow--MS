import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label, value, icon, trend, delay = 0, className,
}: {
  label: string; value: ReactNode; icon: ReactNode; trend?: string; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("glass rounded-xl p-5 relative overflow-hidden group", className)}
    >
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition" />
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {trend && <div className="mt-1 text-xs text-muted-foreground">{trend}</div>}
    </motion.div>
  );
}
