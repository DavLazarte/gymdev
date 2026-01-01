"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  User,
  Search,
  LayoutDashboard,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Users,
  CreditCard,
  Package,
  UserCheck,
  Activity,
  DollarSign,
  Settings,
} from "lucide-react";

interface MobileNavProps {
  role: "client" | "reception" | "admin";
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const clientNav = [
    { href: "/client", icon: Home, label: "Inicio" },
    { href: "/client/book", icon: Calendar, label: "Reservar" },
    { href: "/client/profile", icon: User, label: "Perfil" },
  ];

  const receptionNav = [
    { href: "/reception", icon: LayoutDashboard, label: "Panel" },
    { href: "/reception/search", icon: Search, label: "Buscar" },
    { href: "/reception/book", icon: Calendar, label: "Reservar" },
  ];

  const adminNav = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  ];

  const adminMenuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/socios", icon: Users, label: "Socios" },
    { href: "/admin/membresias", icon: CreditCard, label: "Membresías" },
    { href: "/admin/planes", icon: Package, label: "Planes" },
    { href: "/admin/clases", icon: Calendar, label: "Clases" },
    { href: "/admin/reservas", icon: Calendar, label: "Reservas" },
    { href: "/admin/instructores", icon: UserCheck, label: "Instructores" },
    { href: "/admin/asistencias", icon: Activity, label: "Asistencias" },
    { href: "/admin/pagos", icon: DollarSign, label: "Pagos" },
    { href: "/admin/configuracion", icon: Settings, label: "Configuración" },
  ];

  const navItems =
    role === "client"
      ? clientNav
      : role === "reception"
      ? receptionNav
      : adminNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-3 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {role === "admin" && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 px-3 py-3 text-xs text-muted-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="font-medium">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Menú de Administración</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {adminMenuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
