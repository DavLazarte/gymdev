"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRequireRole } from "@/hooks/useRequireRole";
import { api } from "@/lib/api";
import { Reserva } from "@/lib/types";
import { ChevronLeft, Calendar, Clock, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ReservationsPage() {
  const { user, loading: roleLoading } = useRequireRole("gym_socio");
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(
    null
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadReservas();
    }
  }, [user]);

  const loadReservas = async () => {
    try {
      setIsLoading(true);
      const data = await api.getReservas();
      setReservations(data);
    } catch (error) {
      console.error("Error loading reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingReservations = reservations.filter(
    (r) => r.estado === "reservada"
  );
  const pastReservations = reservations.filter(
    (r) =>
      r.estado === "asistio" ||
      r.estado === "cancelada" ||
      r.estado === "ausente"
  );

  const handleCancelClick = (id: string) => {
    setSelectedReservation(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedReservation) return;

    try {
      setIsCancelling(true);
      await api.cancelReserva(selectedReservation);
      toast({
        title: "Reserva cancelada",
        description: "Tu cupo ha sido liberado correctamente.",
      });
      loadReservas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar la reserva.",
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    }
  };

  if (roleLoading || (user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 text-foreground">
      <AppHeader
        userName={user.name}
        userRole="client"
        userImage={(user as any).foto}
      />

      <main className="container mx-auto max-w-2xl space-y-6 p-4">
        <div className="flex items-center gap-3">
          <Link href="/client">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Reservas</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus clases reservadas
            </p>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Próximas ({upcomingReservations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Historial ({pastReservations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 pt-4">
            {upcomingReservations.length > 0 ? (
              upcomingReservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground">
                            {reservation.clase?.nombre}
                          </h3>
                        </div>
                        <StatusBadge status={reservation.estado} />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              reservation.fecha_reserva
                            ).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>
                            {reservation.clase?.hora_inicio.substring(0, 5)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleCancelClick(reservation.id)}
                        disabled={isCancelling}
                      >
                        {isCancelling &&
                        selectedReservation === reservation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Cancelar reserva
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No tienes reservas próximas
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Reserva una clase para comenzar tu entrenamiento
                </p>
                <Link href="/client/book">
                  <Button className="mt-4">Reservar clase</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 pt-4">
            {pastReservations.length > 0 ? (
              pastReservations.map((reservation) => (
                <Card key={reservation.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground">
                            {reservation.clase?.nombre}
                          </h3>
                        </div>
                        <StatusBadge status={reservation.estado} />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              reservation.fecha_reserva
                            ).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>
                            {reservation.clase?.hora_inicio.substring(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  Sin historial
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tus reservas pasadas aparecerán aquí
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav role="client" />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] rounded-xl sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Sí, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
