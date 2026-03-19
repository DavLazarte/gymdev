"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireRole } from "@/hooks/useRequireRole";
import { api } from "@/lib/api";
import { Reserva } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatLocalDate } from "@/lib/utils";
import {
  Calendar,
  CreditCard,
  History,
  User,
  Loader2,
  Clock,
  Trash2,
  CheckCircle2,
  UserCheck,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClientDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const { toast } = useToast();

  // Solo gym_socio puede acceder
  const { user, loading: roleLoading } = useRequireRole("gym_socio");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsDataLoading(true);
      const data = await api.getProfile();
      setProfile(data.socio);

      // Cargar reservas (solo activas para hoy/futuro)
      const resData = await api.getReservas();
      const today = new Date().toISOString().split("T")[0];
      const futureReservas = resData.filter((r) => r.fecha_reserva >= today);
      setReservations(futureReservas.slice(0, 3));
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      setIsCancelling(id);
      await api.cancelReserva(id);
      toast({
        title: "Reserva cancelada",
        description: "Tu cupo ha sido liberado correctamente.",
      });
      // Recargar perfil y reservas para actualizar créditos y lista
      loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar la reserva.",
      });
    } finally {
      setIsCancelling(null);
    }
  };

  if (roleLoading || (user && isDataLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Cargando tu panel...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const mapStatus = (status: string) => {
    if (status === "activo" || status === "activa") return "Activa";
    if (status === "vencido" || status === "vencida") return "Vencida";
    if (status === "por_vencer") return "Por Vencer";
    return "Cancelada";
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 text-foreground">
      <AppHeader
        userName={profile.nombre}
        userRole="client"
        userImage={profile.foto}
      />

      <main className="container mx-auto max-w-2xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Hola, {profile.nombre.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido a tu panel de control
            </p>
          </div>

          {/* <div className="flex flex-col items-center justify-center bg-orange-100 dark:bg-orange-950/30 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-900">
            <div className="flex items-center gap-1">
              <Flame
                className={cn(
                  "h-6 w-6 text-orange-500",
                  profile.racha_actual > 0 && "fill-orange-500 animate-pulse",
                )}
              />
              <span className="text-2xl font-black text-orange-600 dark:text-orange-500">
                {profile.racha_actual || 0}
              </span>
            </div>
            <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400 uppercase tracking-wider">
              Racha Días
            </span>
          </div> */}
        </div>

        {/* Membership Status Card (Conditional) */}
        {profile.tipo_persona === "instructor" ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Panel de Instructor
                </CardTitle>
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                  Activo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 mb-2">
                Como instructor, tienes acceso ilimitado para reservar clases y
                gestionar tu asistencia.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Reservas habilitadas sin membresía</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estado de Membresía</CardTitle>
                <StatusBadge
                  status={mapStatus(profile.membresia?.estado || "inactivo")}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-semibold text-foreground">
                    {profile.membresia?.plan || "Sin plan"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modalidad</p>
                  <p className="font-semibold text-foreground">
                    {profile.membresia?.tipo === "creditos"
                      ? "Por Créditos"
                      : "Ilimitado (Tiempo)"}
                  </p>
                </div>
              </div>

              {profile.membresia?.tipo === "creditos" && (
                <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                  <p className="text-xs text-primary/80 font-medium">
                    Créditos disponibles
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {profile.membresia?.creditos}{" "}
                    <span className="text-sm font-normal">clases</span>
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Fecha de vencimiento
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {profile.membresia?.vencimiento
                    ? formatLocalDate(profile.membresia.vencimiento)
                    : "Sin vencimiento"}
                </p>
              </div>

              <Link href="/client/membership">
                <Button variant="outline" className="w-full bg-transparent">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ver detalles de membresía
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Próximas Clases Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Tus Próximas Clases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  Sin clases hoy
                </p>
                <p className="text-sm font-medium">
                  No tienes reservas activas
                </p>
                <Link href="/client/book">
                  <Button variant="link" size="sm" className="mt-1 h-auto p-0">
                    Ver clases disponibles
                  </Button>
                </Link>
              </div>
            ) : (
              reservations.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border group"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm leading-none">
                      {reserva.clase?.nombre}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(reserva.fecha_reserva).toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reserva.clase?.hora_inicio.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reserva.estado === "asistio" ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px]">
                        Asistido
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelReservation(reserva.id)}
                        disabled={!!isCancelling}
                      >
                        {isCancelling === reserva.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <Link href="/client/book">
                <Button
                  className="w-full justify-start h-auto py-4 px-4"
                  size="lg"
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Reservar Clase</span>
                    <span className="text-xs font-normal opacity-90">
                      Ver clases disponibles
                    </span>
                  </div>
                </Button>
              </Link>

              <Link href="/client/attendance">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent h-auto py-4 px-4"
                  size="lg"
                >
                  <History className="mr-3 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Mi Asistencia</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Historial de visitas
                    </span>
                  </div>
                </Button>
              </Link>

              <Link href="/client/profile">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent h-auto py-4 px-4"
                  size="lg"
                >
                  <User className="mr-3 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Mi Perfil</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Editar información personal
                    </span>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav role="client" />
    </div>
  );
}
