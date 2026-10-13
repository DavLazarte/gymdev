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
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ClientDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [tenantAlias, setTenantAlias] = useState<string>("");
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Solo gym_socio puede acceder
  const { user, loading: roleLoading } = useRequireRole("gym_socio");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const getLocalTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const loadProfile = async () => {
    try {
      setIsDataLoading(true);
      const [data, resData, tenantRes] = await Promise.all([
        api.getProfile(),
        api.getReservas().catch(() => [] as Reserva[]),
        api.getTenantConfig().catch(() => null),
      ]);
      setProfile(data.socio);

      const tenant = (tenantRes as any)?.data || tenantRes?.tenant || tenantRes;
      if (tenant?.configuracion?.alias_pago) {
        setTenantAlias(tenant.configuracion.alias_pago);
      }

      // Cargar próximas clases (hoy y futuro, incluyendo turnos fijos asignados por el coach)
      const today = getLocalTodayStr();
      const futureReservas = (resData || []).filter(
        (r) => r.fecha_reserva >= today && r.estado !== "cancelada"
      );
      setReservations(futureReservas.slice(0, 5));
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      setProcessingId(id);
      await api.cancelReserva(id);
      toast({
        title: "Reserva cancelada",
        description: "Tu cupo ha sido liberado correctamente.",
      });
      await loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar la reserva.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmFixedClass = async (reserva: Reserva) => {
    try {
      setProcessingId(reserva.id);
      await api.createReserva({
        id_clase_gym: reserva.id_clase_gym,
        turno_id: reserva.turno_id,
        fecha_reserva: reserva.fecha_reserva,
        accion: "confirmar",
      });
      toast({
        title: "¡Asistencia confirmada!",
        description: `Confirmaste que asistís a ${reserva.clase?.nombre || "tu clase"}.`,
      });
      await loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo confirmar",
        description: error.message || "Ocurrió un error al confirmar tu asistencia.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleNoAsistoFixedClass = async (reserva: Reserva) => {
    try {
      setProcessingId(reserva.id);
      await api.createReserva({
        id_clase_gym: reserva.id_clase_gym,
        turno_id: reserva.turno_id,
        fecha_reserva: reserva.fecha_reserva,
        baja_fijo: true,
        accion: "no_asisto",
      });
      toast({
        title: "Inasistencia avisada",
        description: "Avisaste que no vas a esa clase. Tu lugar quedó liberado por ese día.",
      });
      await loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar el aviso.",
      });
    } finally {
      setProcessingId(null);
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

  const membership = profile.membresia;
  const creditosDisponibles =
    membership?.creditos ?? membership?.creditos_restantes ?? null;
  const isCreditPlan =
    membership?.tipo === "creditos" ||
    (creditosDisponibles !== null && creditosDisponibles !== undefined);

  const tieneTurnoFijo =
    !!profile.tiene_turno_fijo ||
    reservations.some((r) => r.es_turno_fijo);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-24 md:pb-6 text-foreground">
      <AppHeader
        userName={profile.nombre}
        userRole="client"
        userImage={profile.foto}
      />

      <main className="container mx-auto max-w-2xl space-y-5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-bold text-foreground">
              Hola, {(profile.nombre || "Socio").split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido a tu panel de control
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-100 px-3.5 py-2 dark:border-orange-900 dark:bg-orange-950/30">
            <div className="flex items-center gap-1">
              <Flame
                className={cn(
                  "h-5 w-5 text-orange-500",
                  profile.racha_actual > 0 && "fill-orange-500 animate-pulse"
                )}
              />
              <span className="text-xl font-black text-orange-600 dark:text-orange-500">
                {profile.racha_actual || 0}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600/70 dark:text-orange-400">
              Racha Días
            </span>
          </div>
        </div>

        {/* Membership Status Card */}
        {profile.tipo_persona === "instructor" ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Estado de Membresía</CardTitle>
                <StatusBadge
                  status={mapStatus(membership?.estado || "inactivo")}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="truncate font-semibold text-foreground">
                    {membership?.plan || "Sin plan"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Modalidad</p>
                  <p className="truncate font-semibold text-foreground">
                    {isCreditPlan ? "Por Créditos" : "Ilimitado (Tiempo)"}
                  </p>
                </div>
              </div>

              {isCreditPlan && (
                <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                  <p className="text-xs text-primary/80 font-medium">
                    Créditos disponibles
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {creditosDisponibles ?? 0}{" "}
                    <span className="text-sm font-normal">
                      {membership?.creditos_totales
                        ? `de ${membership.creditos_totales} clases`
                        : "clases"}
                    </span>
                  </p>
                </div>
              )}

              {Array.isArray(profile.clases_fijas) &&
                profile.clases_fijas.length > 0 && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground">
                      Clase asignada (Turno fijo)
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {profile.clases_fijas
                        .map(
                          (c: any) =>
                            `${c.nombre}${c.hora_inicio ? ` (${c.hora_inicio} hs)` : ""}`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                )}

              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Fecha de vencimiento
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {membership?.vencimiento
                    ? formatLocalDate(membership.vencimiento)
                    : "Sin vencimiento"}
                </p>
              </div>

              {tenantAlias &&
                ["por_vencer", "vencida", "vencido"].includes(
                  membership?.estado || ""
                ) && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Datos para renovar por transferencia:
                    </p>
                    <p className="text-sm font-mono font-bold text-foreground break-all select-all">
                      Alias / CBU: {tenantAlias}
                    </p>
                  </div>
                )}

              <Link href="/client/membership" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  <CreditCard className="mr-2 h-4 w-4 shrink-0" />
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
              <Clock className="h-5 w-5 text-primary shrink-0" />
              Tus Próximas Clases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  Sin clases próximas
                </p>
                <p className="text-sm font-medium">
                  No tienes clases ni reservas próximas
                </p>
                <Link href="/client/book">
                  <Button variant="link" size="sm" className="mt-1 h-auto p-0">
                    Ver programación de clases
                  </Button>
                </Link>
              </div>
            ) : (
              reservations.map((reserva) => {
                const isFixed = !!reserva.es_turno_fijo;
                const isConfirmed =
                  reserva.confirmado ||
                  reserva.estado === "reservada" ||
                  reserva.estado === "asistio";
                const isNoAsiste =
                  reserva.no_asiste || reserva.estado === "baja_fijo";
                const isBusy = processingId === reserva.id;

                return (
                  <div
                    key={reserva.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors",
                      isNoAsiste
                        ? "bg-muted/20 border-dashed opacity-75"
                        : "bg-muted/40"
                    )}
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-sm leading-none">
                          {reserva.clase?.nombre}
                        </p>
                        {reserva.estado === "asistio" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px]">
                            Asistido
                          </Badge>
                        ) : isFixed ? (
                          isNoAsiste ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
                            >
                              Avisaste que no vas
                            </Badge>
                          ) : isConfirmed ? (
                            <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20 text-[10px]">
                              Asistencia confirmada
                            </Badge>
                          ) : (
                            <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 text-[10px]">
                              Ya anotado · Turno fijo
                            </Badge>
                          )
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            Reservada
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 capitalize">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {new Date(
                            reserva.fecha_reserva + "T12:00:00"
                          ).toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {reserva.clase?.hora_inicio?.substring(0, 5)} hs
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      {reserva.estado === "asistio" ? null : isFixed ? (
                        <>
                          <Button
                            size="sm"
                            variant={isConfirmed && !isNoAsiste ? "default" : "outline"}
                            className={cn(
                              "h-8 px-2.5 text-xs gap-1",
                              isConfirmed &&
                                !isNoAsiste &&
                                "bg-green-600 hover:bg-green-700 text-white border-green-600"
                            )}
                            disabled={isBusy || (isConfirmed && !isNoAsiste)}
                            onClick={() => handleConfirmFixedClass(reserva)}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            {isConfirmed && !isNoAsiste ? "Confirmado" : "Voy"}
                          </Button>
                          <Button
                            size="sm"
                            variant={isNoAsiste ? "destructive" : "outline"}
                            className={cn(
                              "h-8 px-2.5 text-xs gap-1",
                              !isNoAsiste &&
                                "text-destructive border-destructive/30 hover:bg-destructive/10"
                            )}
                            disabled={isBusy || isNoAsiste}
                            onClick={() => handleNoAsistoFixedClass(reserva)}
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            No voy
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelReservation(reserva.id)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            <Link href="/client/book" className="block">
              <Button
                className="w-full justify-start h-auto py-3.5 px-4 whitespace-normal text-left"
                size="lg"
              >
                <Calendar className="mr-3 h-5 w-5 shrink-0" />
                <div className="flex min-w-0 flex-col items-start">
                  <span className="font-semibold">
                    {tieneTurnoFijo
                      ? "Mi Clase / Confirmar Asistencia"
                      : "Reservar Clase"}
                  </span>
                  <span className="text-xs font-normal opacity-90 leading-snug">
                    {tieneTurnoFijo
                      ? "Ya estás anotado en tu clase: confirma si vas o avisa si no asistes"
                      : "Reserva tu lugar en las clases disponibles"}
                  </span>
                </div>
              </Button>
            </Link>

            <Link href="/client/entrenamiento" className="block">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent h-auto py-3.5 px-4 whitespace-normal text-left"
                size="lg"
              >
                <Flame className="mr-3 h-5 w-5 shrink-0 text-primary" />
                <div className="flex min-w-0 flex-col items-start">
                  <span className="font-semibold">Mi Entrenamiento y RMs</span>
                  <span className="text-xs font-normal text-muted-foreground leading-snug">
                    Ver rutina de la semana, pesos por % RM y marcas
                  </span>
                </div>
              </Button>
            </Link>

            <Link href="/client/attendance" className="block">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent h-auto py-3.5 px-4 whitespace-normal text-left"
                size="lg"
              >
                <History className="mr-3 h-5 w-5 shrink-0" />
                <div className="flex min-w-0 flex-col items-start">
                  <span className="font-semibold">Mi Asistencia</span>
                  <span className="text-xs font-normal text-muted-foreground leading-snug">
                    Historial de visitas y racha del mes
                  </span>
                </div>
              </Button>
            </Link>

            <Link href="/client/profile" className="block">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent h-auto py-3.5 px-4 whitespace-normal text-left"
                size="lg"
              >
                <User className="mr-3 h-5 w-5 shrink-0" />
                <div className="flex min-w-0 flex-col items-start">
                  <span className="font-semibold">Mi Perfil</span>
                  <span className="text-xs font-normal text-muted-foreground leading-snug">
                    Editar información personal
                  </span>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <MobileNav role="client" />
    </div>
  );
}
