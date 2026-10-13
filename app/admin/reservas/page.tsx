"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ClassSlot, Reserva, Socio } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Filter,
  Trash2,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AdminReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [classes, setClasses] = useState<ClassSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSlot | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [allSocios, setAllSocios] = useState<Socio[]>([]);
  const [searchSocio, setSearchSocio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSocio, setIsAddingSocio] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const { toast } = useToast();

  const parseDateToLocal = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.role_name === "gym_staff" ||
          parsed?.role === "coach" ||
          parsed?.rol === "coach"
        ) {
          setIsCoach(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const slots = await api.getAvailableClasses(selectedDate, selectedDate);
      setClasses(slots || []);

      if (slots && slots.length > 0) {
        const targetSlot =
          (selectedClass &&
            slots.find((s) => s.clase_id === selectedClass.clase_id)) ||
          slots[0];
        setSelectedClass(targetSlot);
        await loadReservas(targetSlot.clase_id);
      } else {
        setSelectedClass(null);
        setReservas([]);
      }
    } catch (error) {
      console.error("Error loading slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchSocios = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setAllSocios([]);
      return;
    }

    try {
      const response = await api.getSocios({
        search: searchTerm,
        per_page: 15,
      });
      const mapped = (response?.socios || []).map((s: any) => ({
        ...s,
        id: String(s.id || s.idpersona),
      }));
      setAllSocios(mapped);
    } catch (error) {
      console.error("Error searching socios:", error);
    }
  };

  const loadReservas = async (claseId: string) => {
    try {
      const data = await api.getReservas({ fecha: selectedDate });
      const filtered = (data || []).filter(
        (r: any) => String(r.id_clase_gym) === String(claseId)
      );
      setReservas(filtered);
    } catch (error) {
      console.error("Error loading reservas:", error);
    }
  };

  const handleSelectClass = (slot: ClassSlot) => {
    setSelectedClass(slot);
    loadReservas(slot.clase_id);
  };

  const handleAddSocio = async (socio: Socio) => {
    if (!selectedClass) return;

    setIsAddingSocio(true);
    try {
      await api.createReserva({
        id_clase_gym: selectedClass.clase_id,
        turno_id: selectedClass.turno_id,
        fecha_reserva: selectedDate,
        id_persona: socio.id,
        accion: "confirmar",
      });
      toast({
        title: "Socio anotado",
        description: `${socio.nombre} ha sido agregado a la clase.`,
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo anotar al socio.",
      });
    } finally {
      setIsAddingSocio(false);
    }
  };

  const handleToggleAttendance = async (reserva: Reserva) => {
    try {
      if (reserva.estado === "asistio") {
        return;
      }

      await api.marcarAsistencia({
        id_persona: reserva.id_persona,
        id_clase_gym: reserva.id_clase_gym,
        turno_id: reserva.turno_id,
        id_reserva: reserva.id,
        fecha: selectedDate,
      });

      toast({
        title: "Asistencia registrada",
        description: `Se marcó la asistencia de ${reserva.persona?.nombre || "el socio"}.`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar asistencia.",
      });
    }
  };

  const handleRestoreFixedSocio = async (reserva: Reserva) => {
    try {
      await api.createReserva({
        id_clase_gym: reserva.id_clase_gym,
        turno_id: reserva.turno_id,
        fecha_reserva: selectedDate,
        id_persona: reserva.id_persona,
        accion: "confirmar",
      });
      toast({
        title: "Socio reanotado",
        description: `${reserva.persona?.nombre || "El socio"} volvió a quedar confirmado en la clase de hoy.`,
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo reanotar al socio.",
      });
    }
  };

  const handleDeleteReserva = async (reserva: Reserva) => {
    const isFixed = !!reserva.es_turno_fijo;
    const msg = isFixed
      ? `¿Marcar que ${reserva.persona?.nombre || "el socio"} NO asiste hoy (liberar su cupo del día)?`
      : `¿Estás seguro de que deseas cancelar la reserva de ${reserva.persona?.nombre || "el socio"}?`;

    if (!confirm(msg)) {
      return;
    }

    try {
      await api.cancelReserva(reserva.id);
      toast({
        title: isFixed ? "Baja del día registrada" : "Reserva eliminada",
        description: isFixed
          ? "Se liberó el lugar del socio para la clase de esta fecha."
          : "La reserva ha sido cancelada correctamente.",
      });
      await loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo procesar la baja.",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchSocios(searchSocio);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchSocio]);

  const filteredSocios = allSocios;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isCoach
              ? "Mis Clases — Turnos del Día y Presente"
              : "Gestión de Reservas y Asistencias"}
          </h1>
          <p className="text-muted-foreground">
            {isCoach
              ? "Visualiza tus clases, suma alumnos en el día y marca el presente."
              : "Administra quiénes asisten a cada clase hoy."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData()}
            className={isLoading ? "animate-spin" : ""}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de clases del día */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Clases del Día
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : classes.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                No hay clases programadas para esta fecha.
              </p>
            ) : (
              classes.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => handleSelectClass(slot)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClass?.id === slot.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{slot.nombre}</span>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted">
                      {slot.hora.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{slot.instructor}</span>
                    <span>
                      {slot.inscritos}/{slot.capacidad} inscritos
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detalle de la clase y Socios inscritos */}
        <Card className="lg:col-span-2">
          {selectedClass ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedClass.nombre}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(
                      parseDateToLocal(selectedDate),
                      "EEEE d 'de' MMMM",
                      {
                        locale: es,
                      }
                    )}{" "}
                    • {selectedClass.hora}
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Anotar Socio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Anotar Socio en {selectedClass.nombre}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o DNI..."
                          className="pl-9"
                          value={searchSocio}
                          onChange={(e) => setSearchSocio(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {searchSocio.length < 2 ? (
                          <p className="text-center py-8 text-sm text-muted-foreground">
                            Escribe al menos 2 caracteres para buscar...
                          </p>
                        ) : filteredSocios.length === 0 ? (
                          <p className="text-center py-8 text-sm text-muted-foreground">
                            No se encontraron socios con ese criterio.
                          </p>
                        ) : (
                          filteredSocios.map((socio) => (
                            <div
                              key={socio.id}
                              className="flex items-center justify-between p-2 rounded-md border text-sm"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {socio.nombre}
                                </span>
                                {socio.dni && (
                                  <span className="text-xs text-muted-foreground">
                                    DNI: {socio.dni}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddSocio(socio)}
                                disabled={
                                  isAddingSocio ||
                                  selectedClass.inscritos >=
                                    selectedClass.capacidad
                                }
                              >
                                Agregar
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservas.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No hay socios inscriptos aún en esta clase.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="text-left border-b font-medium text-muted-foreground">
                            <th className="p-3">Socio</th>
                            <th className="p-3">Estado en la Clase</th>
                            <th className="p-3 text-center">Asistencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reservas.map((reserva: any) => {
                            const isFixed = !!reserva.es_turno_fijo;
                            const isNoAsiste =
                              reserva.no_asiste ||
                              reserva.estado === "baja_fijo";
                            const isConfirmed =
                              reserva.confirmado ||
                              reserva.estado === "reservada" ||
                              reserva.estado === "asistio";

                            return (
                              <tr
                                key={reserva.id}
                                className={cn(
                                  isNoAsiste && "bg-muted/20 opacity-75"
                                )}
                              >
                                <td className="p-3">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {reserva.persona?.nombre ||
                                          `Socio #${reserva.id_persona}`}
                                      </span>
                                      {isFixed && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          Turno Fijo
                                        </Badge>
                                      )}
                                    </div>
                                    {!isCoach && reserva.persona?.plan_nombre && (
                                      <span className="text-xs text-muted-foreground">
                                        {reserva.persona.plan_nombre}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {reserva.estado === "asistio" ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 font-medium">
                                      Asistió (Presente)
                                    </span>
                                  ) : isNoAsiste ? (
                                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium">
                                      Avisó que no va (Cupo liberado)
                                    </span>
                                  ) : isFixed ? (
                                    isConfirmed ? (
                                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 font-medium">
                                        Confirmó que va
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                                        Anotado (Sin confirmar)
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                                      Reserva Confirmada
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {isNoAsiste ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 text-xs"
                                        onClick={() =>
                                          handleRestoreFixedSocio(reserva)
                                        }
                                        title="Volver a anotar al socio en esta fecha"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reanotar hoy
                                      </Button>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant={
                                            reserva.estado === "asistio"
                                              ? "default"
                                              : "outline"
                                          }
                                          className={
                                            reserva.estado === "asistio"
                                              ? "bg-green-600 hover:bg-green-700 text-white"
                                              : ""
                                          }
                                          onClick={() =>
                                            handleToggleAttendance(reserva)
                                          }
                                        >
                                          {reserva.estado === "asistio" ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                          ) : (
                                            "Presente"
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                          onClick={() =>
                                            handleDeleteReserva(reserva)
                                          }
                                          title={
                                            isFixed
                                              ? "Marcar que no asiste hoy"
                                              : "Cancelar reserva"
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                <Filter className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">Selecciona una clase</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Elige una clase de la lista para ver los inscriptos y gestionar
                las asistencias.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
