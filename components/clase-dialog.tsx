"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Clase, Instructor } from "@/lib/types";

interface ClaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clase?: Clase;
  onSave: () => void;
}

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function ClaseDialog({
  open,
  onOpenChange,
  clase,
  onSave,
}: ClaseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    idservicio: "",
    id_coach: "",
    dias_semana: [] as string[],
    hora_inicio: "",
    hora_fin: "",
    duracion_minutos: "60",
    cupo_maximo: "20",
    estado: "activa" as Clase["estado"],
    minutos_limite_reserva: "",
    minutos_limite_cancelacion: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const data = await api.getInstructores();
      // Adaptar datos como se hace en la página de instructores
      const adapted = data.map((item: any) => ({
        id: String(item.id),
        nombre: item.nombre,
        email: item.email,
        telefono: item.telefono,
        estado:
          (item.estado || "").toLowerCase() === "activo"
            ? "activo"
            : "inactivo",
      })) as Instructor[];
      setInstructores(adapted);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => {
    if (clase) {
      setFormData({
        nombre: clase.nombre,
        idservicio: clase.idservicio || "",
        id_coach: clase.id_coach,
        dias_semana: clase.dias_semana.split(","),
        hora_inicio: clase.hora_inicio,
        hora_fin: clase.hora_fin,
        duracion_minutos: String(clase.duracion_minutos),
        cupo_maximo: String(clase.cupo_maximo),
        estado: clase.estado,
        minutos_limite_reserva: clase.minutos_limite_reserva
          ? String(clase.minutos_limite_reserva)
          : "",
        minutos_limite_cancelacion: clase.minutos_limite_cancelacion
          ? String(clase.minutos_limite_cancelacion)
          : "",
      });
    } else {
      setFormData({
        nombre: "",
        idservicio: "",
        id_coach: "",
        dias_semana: [],
        hora_inicio: "",
        hora_fin: "",
        duracion_minutos: "60",
        cupo_maximo: "20",
        estado: "activa",
        minutos_limite_reserva: "",
        minutos_limite_cancelacion: "",
      });
    }
  }, [clase, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSave = {
        nombre: formData.nombre,
        idservicio: formData.idservicio || null,
        id_coach: formData.id_coach,
        dias_semana: formData.dias_semana.join(","),
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        duracion_minutos: Number(formData.duracion_minutos),
        cupo_maximo: Number(formData.cupo_maximo),
        estado: formData.estado,
        minutos_limite_reserva: formData.minutos_limite_reserva
          ? Number(formData.minutos_limite_reserva)
          : null,
        minutos_limite_cancelacion: formData.minutos_limite_cancelacion
          ? Number(formData.minutos_limite_cancelacion)
          : null,
      };
      if (clase) {
        await api.updateClase(clase.id, dataToSave);
        toast({
          title: "Clase actualizada",
          description: "El horario se actualizó correctamente.",
        });
      } else {
        await api.createClase(dataToSave);
        toast({
          title: "Clase creada",
          description: "El horario ha sido registrado exitosamente.",
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la clase",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDia = (dia: string) => {
    setFormData({
      ...formData,
      dias_semana: formData.dias_semana.includes(dia)
        ? formData.dias_semana.filter((d) => d !== dia)
        : [...formData.dias_semana, dia],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{clase ? "Editar Clase" : "Nueva Clase"}</DialogTitle>
          <DialogDescription>
            {clase
              ? "Actualiza la información de la clase"
              : "Completa los datos para crear una nueva clase"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Clase *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej: Yoga Mañana, CrossFit Intensivo..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_coach">Instructor *</Label>
            <Select
              value={formData.id_coach}
              onValueChange={(value) =>
                setFormData({ ...formData, id_coach: value })
              }
            >
              <SelectTrigger id="id_coach">
                <SelectValue placeholder="Seleccionar instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructores
                  .filter((i) => i.estado === "activo")
                  .map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Días de la semana *</Label>
            <div className="grid grid-cols-2 gap-2">
              {diasSemana.map((dia) => (
                <div key={dia} className="flex items-center space-x-2">
                  <Checkbox
                    id={dia}
                    checked={formData.dias_semana.includes(dia)}
                    onCheckedChange={() => toggleDia(dia)}
                  />
                  <label
                    htmlFor={dia}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {dia}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora inicio *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, hora_inicio: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_fin">Hora fin *</Label>
              <Input
                id="hora_fin"
                type="time"
                value={formData.hora_fin}
                onChange={(e) =>
                  setFormData({ ...formData, hora_fin: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duracion_minutos">Duración (min) *</Label>
              <Input
                id="duracion_minutos"
                type="number"
                value={formData.duracion_minutos}
                onChange={(e) =>
                  setFormData({ ...formData, duracion_minutos: e.target.value })
                }
                placeholder="60"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cupo_maximo">Cupo máximo *</Label>
              <Input
                id="cupo_maximo"
                type="number"
                value={formData.cupo_maximo}
                onChange={(e) =>
                  setFormData({ ...formData, cupo_maximo: e.target.value })
                }
                placeholder="20"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minutos_limite_reserva">
                Anticipación mínima para reservar (minutos)
              </Label>
              <Input
                id="minutos_limite_reserva"
                type="number"
                min="0"
                value={formData.minutos_limite_reserva}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minutos_limite_reserva: e.target.value,
                  })
                }
                placeholder="0 = sin límite"
              />
              <p className="text-xs text-muted-foreground">
                Ej: 30 = solo se puede reservar si faltan al menos 30 minutos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutos_limite_cancelacion">
                Anticipación mínima para cancelar (minutos)
              </Label>
              <Input
                id="minutos_limite_cancelacion"
                type="number"
                min="0"
                value={formData.minutos_limite_cancelacion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minutos_limite_cancelacion: e.target.value,
                  })
                }
                placeholder="0 = sin límite"
              />
              <p className="text-xs text-muted-foreground">
                Ej: 60 = solo se puede cancelar si faltan al menos 60 minutos
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <Select
              value={formData.estado}
              onValueChange={(value: Clase["estado"]) =>
                setFormData({ ...formData, estado: value })
              }
            >
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : clase ? (
                "Actualizar"
              ) : (
                "Crear Clase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
