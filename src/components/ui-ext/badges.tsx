import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  todo: "bg-muted text-foreground/80 border-border",
  in_progress: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  done: "bg-chart-3/15 text-chart-3 border-chart-3/30",
};
const labels: Record<string, string> = { todo: "Todo", in_progress: "In progress", done: "Done" };

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("border font-medium", styles[status])}>{labels[status] ?? status}</Badge>;
}

const prio: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  high: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};
export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant="outline" className={cn("border capitalize font-medium", prio[priority])}>{priority}</Badge>;
}
