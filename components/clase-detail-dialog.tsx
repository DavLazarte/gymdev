"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  Clock,
  Calendar,
  Users,
  Pencil,
  UserPlus,
  Trash2,
  Search,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Clase, Socio } from "@/lib/types";

interface ClaseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clase: Clase | null;
  onEdit?: (clase: Clase) => void;
  onChanged?: (updatedClase: Clase) => void;
  isCoach?: boolean;
}

export function ClaseDetailDialog({
  open,
  onOpenChange,
  clase,
  onEdit,
  onChanged,
  isCoach = false,
}: ClaseDetailDialogProps) {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [selectedSocioId, setSelectedSocioId] = useState("");
  const [socioSearch, setSocioSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSelectedSocioId("");
      setSocioSearch("");
      loadSocios();
    }
  }, [open]);

  const loadSocios = async () => {
    try {
      const res = await api.getSocios({ all: true });
      setSocios(res?.socios || []);
    } catch (error) {
      console.error("Error cargando socios:", error);
    }
  };

  if (!clase) return null;

  const alumnosFijos = clase.alumnos_fijos || [];
  const idsYaInscriptos = new Set(alumnosFijos.map((a) => String(a.id)));

  const sociosDisponibles = socios.filter(
    (s) =>
      !idsYaInscriptos.has(String(s.id)) &&
      (s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
        (s.dni && s.dni.toLowerCase().includes(socioSearch.toLowerCase())))
  );

  const handleAddAlumno = async () => {
    if (!selectedSocioId) return;
    setIsAdding(true);
    try {
      const res = await api.inscribirAlumnoFijo(clase.id, selectedSocioId);
      toast({
        title: "Alumno asignado",
        description: "El socio fue agregado al turno fijo de la clase.",
      });
      setSelectedSocioId("");
      if (res.clase && onChanged) {
        onChanged(res.clase);
      }
    } catch (error: any) {
      toast({
        title: "No se pudo agregar",
        description: error.message || "Error al inscribir al socio en la clase",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAlumno = async (alumnoId: string) => {
    setRemovingId(alumnoId);
    try {
      const res = await api.desinscribirAlumnoFijo(clase.id, alumnoId);
      toast({
        title: "Alumno dado de baja",
        description: "Se quitó al socio del turno fijo de esta clase.",
      });
      if (res.clase && onChanged) {
        onChanged(res.clase);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo quitar al socio de la clase",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const esTurnoFijo = clase.modalidad === "fijo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>Detalle y Alumnos de la Clase</DialogTitle>
            {!isCoach && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(clase)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar Clase
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {clase.nombre}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant={esTurnoFijo ? "default" : "outline"}>
                  {esTurnoFijo ? (
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Turno Fijo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Unlock className="h-3 w-3" /> Clase Abierta (Reserva)
                    </span>
                  )}
                </Badge>
                <Badge
                  variant={clase.estado === "activa" ? "default" : "secondary"}
                >
                  {clase.estado === "activa" ? "Activa" : "Cancelada"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Instructor</p>
                <p className="text-sm text-muted-foreground">
                  {clase.coach?.nombre}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Horario</p>
                <p className="text-sm text-muted-foreground">
                  {clase.hora_inicio} - {clase.hora_fin} (
                  {clase.duracion_minutos} min)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Días</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {clase.dias_semana.split(",").map((dia) => (
                    <Badge key={dia} variant="outline" className="text-xs">
                      {dia}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Cupo de la Clase
                </p>
                <p className="text-sm text-muted-foreground">
                  {alumnosFijos.length} fijos / {clase.cupo_maximo} plazas
                  totales
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Gestión de Alumnos Fijos en la Clase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">
                  Alumnos Asignados al Turno ({alumnosFijos.length}/
                  {clase.cupo_maximo})
                </h4>
                <p className="text-xs text-muted-foreground">
                  {esTurnoFijo
                    ? "Estos alumnos tienen su lugar fijo asegurado en todos los días de esta clase."
                    : "Aunque la clase es abierta por reserva, también podés asignar alumnos con lugar fijo."}
                </p>
              </div>
            </div>

            {/* Selector para agregar socio a la clase */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <Select
                  value={selectedSocioId}
                  onValueChange={setSelectedSocioId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar socio para agregar a esta clase..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="flex items-center border-b px-3 pb-2 sticky top-0 bg-popover z-10">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Buscar por nombre o DNI..."
                        value={socioSearch}
                        onChange={(e) => setSocioSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {sociosDisponibles.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No hay socios disponibles para agregar.
                        </div>
                      ) : (
                        sociosDisponibles.map((socio) => (
                          <SelectItem key={socio.id} value={String(socio.id)}>
                            {socio.nombre}{" "}
                            {socio.dni ? `(DNI: ${socio.dni})` : ""}
                            {!isCoach
                              ? ` - ${socio.planNombre || "Sin plan"}`
                              : ""}
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddAlumno}
                disabled={
                  !selectedSocioId ||
                  isAdding ||
                  alumnosFijos.length >= clase.cupo_maximo
                }
              >
                {isAdding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Agregar al Turno
              </Button>
            </div>

            {/* Lista de alumnos inscriptos */}
            {alumnosFijos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Aún no hay alumnos fijos asignados a esta clase.
              </div>
            ) : (
              <div className="max-h-[240px] divide-y overflow-y-auto rounded-lg border">
                {alumnosFijos.map((alumno) => (
                  <div
                    key={alumno.id}
                    className="flex items-center justify-between px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {alumno.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alumno.dni ? `DNI: ${alumno.dni}` : alumno.email}
                        {alumno.telefono ? ` • Tel: ${alumno.telefono}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCoach && (
                        <Badge
                          variant={
                            alumno.tiene_membresia_activa ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {alumno.tiene_membresia_activa
                            ? "Membresía activa"
                            : "Sin membresía"}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAlumno(String(alumno.id))}
                        disabled={removingId === String(alumno.id)}
                        title="Quitar del turno fijo"
                      >
                        {removingId === String(alumno.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
