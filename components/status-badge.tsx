import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    Activa: {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: CheckCircle2,
    },
    Renovada: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    renovada: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    "Por Vencer": {
      bg: "bg-yellow-500/10",
      text: "text-yellow-700 dark:text-yellow-500",
      icon: AlertCircle,
    },
    Vencida: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      icon: XCircle,
    },
    Reservada: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    reservada: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    Asistida: {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: CheckCircle2,
    },
    asistio: {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: CheckCircle2,
    },
    Cancelada: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      icon: XCircle,
    },
    cancelada: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      icon: XCircle,
    },
    ausente: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      icon: XCircle,
    },
  };

  const variant = variants[status as keyof typeof variants] || variants.Activa;
  const Icon = variant.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant.bg,
        variant.text,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
