"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react";
import { useRequireRole } from "@/hooks/useRequireRole";
import { api } from "@/lib/api";

type DashboardStats = {
  metrics: {
    sociosActivos: number;
    clasesHoy: number;
    reservasSemana: number;
    ingresosHoy: number;
  };
  charts: {
    asistenciaSemanal: { day: string; visits: number; percentage: number }[];
    clasesPopulares: { name: string; reservations: number; trend: string }[];
  };
  membershipOverview: {
    activas: number;
    por_vencer: number;
    vencidas: number;
  };
  ocupacion: {
    porcentaje: number;
  };
  instructores: { name: string; classes: number }[];
};

export default function AdminDashboardPage() {
  const { user, loading: roleLoading } = useRequireRole("gym_owner");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || (loading && !stats)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <main className="container mx-auto max-w-6xl space-y-6 p-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido, {user.name}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Miembros Activos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.metrics.sociosActivos}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">Tiempo real</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.metrics.clasesHoy}
              </div>
              <p className="text-xs text-muted-foreground">
                Programadas para hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reservas Semanales
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.metrics.reservasSemana}
              </div>
              <p className="text-xs text-muted-foreground">Total esta semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos del Día
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                }).format(stats.metrics.ingresosHoy)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cobros registrados hoy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Asistencia Semanal</CardTitle>
              <CardDescription>Número de visitas diarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.charts.asistenciaSemanal.map((item) => (
                  <div key={item.day} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground uppercase">
                        {item.day}
                      </span>
                      <span className="text-muted-foreground">
                        {item.visits} visitas
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clases Populares</CardTitle>
              <CardDescription>
                Top 5 con más histórico de reservas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.charts.clasesPopulares.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.reservations} reservas tot.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-primary">
                      <TrendingUp className="h-3 w-3" />
                      <span>{item.trend}</span>
                    </div>
                  </div>
                ))}
                {stats.charts.clasesPopulares.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aún no hay reservas registradas.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Membresías</CardTitle>
              <CardDescription>Estado de los socios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Activas</span>
                <span className="font-semibold text-primary">
                  {stats.membershipOverview.activas}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Por vencer (7 días)
                </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                  {stats.membershipOverview.por_vencer}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencidas</span>
                <span className="font-semibold text-destructive">
                  {stats.membershipOverview.vencidas}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ocupación Hoy</CardTitle>
              <CardDescription>Porcentaje promedio de reservas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {stats.ocupacion.porcentaje}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ocupación estimada
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${stats.ocupacion.porcentaje}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructores Activos</CardTitle>
              <CardDescription>Dictando clases hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.instructores.map((instructor) => (
                  <div
                    key={instructor.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {instructor.name}
                    </span>
                    <span className="text-muted-foreground">
                      {instructor.classes} clases hoy
                    </span>
                  </div>
                ))}
                {stats.instructores.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    No hay instructores con clases hoy.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav role="admin" />
    </div>
  );
}
