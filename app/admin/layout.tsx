"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { useRequireRole } from "@/hooks/useRequireRole";

const COACH_ALLOWED_PATHS = [
  "/admin/reservas",
  "/admin/entrenamientos",
  "/admin/profile",
];

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireRole("gym_owner");
  const pathname = usePathname();
  const router = useRouter();

  const isCoach =
    !!user &&
    (user.role_name === "gym_staff" ||
      (user as any).role === "coach" ||
      (user as any).rol === "coach");

  const isAllowedPath =
    !isCoach ||
    COACH_ALLOWED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

  useEffect(() => {
    if (!loading && isCoach && !isAllowedPath) {
      router.replace("/admin/reservas");
    }
  }, [loading, isCoach, isAllowedPath, router]);

  if (loading || (isCoach && !isAllowedPath)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout userName={user.name} isCoach={isCoach}>
      {children}
    </AdminLayout>
  );
}   