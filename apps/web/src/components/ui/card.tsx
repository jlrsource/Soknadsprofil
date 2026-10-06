import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border bg-card shadow-soft", className)} {...props} />;
}

export function Badge({ className, tone = "default", ...props }: React.ComponentProps<"span"> & { tone?: "default" | "primary" | "success" | "warning" }) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/12 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-foreground",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} {...props} />;
}
