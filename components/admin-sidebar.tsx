"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  Calendar,
  UserCheck,
  Activity,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Dumbbell,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/leads", icon: UserPlus, label: "Pre-venta / Leads" },
  { href: "/admin/socios", icon: Users, label: "Socios" },
  { href: "/admin/membresias", icon: CreditCard, label: "Membresías" },
  { href: "/admin/planes", icon: Package, label: "Planes" },
  { href: "/admin/clases", icon: Calendar, label: "Clases" },
  { href: "/admin/entrenamientos", icon: Dumbbell, label: "Entrenamientos" },
  { href: "/admin/reservas", icon: Calendar, label: "Reservas" },
  { href: "/admin/instructores", icon: UserCheck, label: "Instructores" },
  { href: "/admin/asistencias", icon: Activity, label: "Asistencias" },
  { href: "/admin/pagos", icon: DollarSign, label: "Pagos" },
  { href: "/admin/salidas", icon: TrendingDown, label: "Gastos" },
  { href: "/admin/configuracion", icon: Settings, label: "Configuración" },
];

const coachNavItems = [
  { href: "/admin/reservas", icon: UserCheck, label: "Mis Clases y Presente" },
  { href: "/admin/entrenamientos", icon: Dumbbell, label: "Planificación" },
];

export function AdminSidebar({ isCoach = false }: { isCoach?: boolean }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const items = isCoach ? coachNavItems : adminNavItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] border-r border-border bg-card transition-all duration-300 md:block",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2">Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
