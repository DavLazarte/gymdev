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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Socio, Clase } from "@/lib/types";

interface AsistenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (asistencia: any) => Promise<void> | void;
}

export function AsistenciaDialog({
  open,
  onOpenChange,
  onSave,
}: AsistenciaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [socioSearch, setSocioSearch] = useState("");

  const [formData, setFormData] = useState({
    socioId: "",
    fecha: new Date().toISOString().split("T")[0],
    horaEntrada: new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    tipo: "libre" as "libre" | "clase",
    claseId: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsFetchingData(true);
    try {
      const [sociosRes, clasesRes] = await Promise.all([
        api.getSocios({ all: true }),
        api.getClases(),
      ]);
      const mappedSocios = (sociosRes?.socios || []).map((s: any) => ({
        ...s,
        id: String(s.id || s.idpersona),
      }));
      setSocios(mappedSocios);
      setClases(clasesRes?.clases || []);
    } catch (error) {
      console.error("Error cargando datos para asistencia:", error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const filteredSocios = socios.filter((s) =>
    s.nombre.toLowerCase().includes(socioSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.socioId) return;

    setIsLoading(true);
    try {
      await onSave({
        id_persona: formData.socioId,
        id_clase_gym:
          formData.tipo === "clase" && formData.claseId
            ? formData.claseId
            : undefined,
        fecha: formData.fecha,
        hora_entrada: formData.horaEntrada,
        tipo: formData.tipo,
      });
      setFormData({
        socioId: "",
        fecha: new Date().toISOString().split("T")[0],
        horaEntrada: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        tipo: "libre",
        claseId: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Asistencia</DialogTitle>
          <DialogDescription>
            Registra la entrada de un socio al gimnasio
          </DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="socioId">Socio *</Label>
              <Select
                value={formData.socioId}
                onValueChange={(value) =>
                  setFormData({ ...formData, socioId: value })
                }
              >
                <SelectTrigger id="socioId">
                  <SelectValue placeholder="Seleccionar socio" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center border-b px-3 pb-2 sticky top-0 bg-popover z-10">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Buscar socio..."
                      value={socioSearch}
                      onChange={(e) => setSocioSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredSocios.map((socio) => (
                      <SelectItem key={socio.id} value={socio.id}>
                        {socio.nombre}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaEntrada">Hora de entrada *</Label>
                <Input
                  id="horaEntrada"
                  type="time"
                  value={formData.horaEntrada}
                  onChange={(e) =>
                    setFormData({ ...formData, horaEntrada: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de acceso *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "libre" | "clase") =>
                  setFormData({ ...formData, tipo: value, claseId: "" })
                }
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Acceso Libre</SelectItem>
                  <SelectItem value="clase">Clase Programada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === "clase" && (
              <div className="space-y-2">
                <Label htmlFor="claseId">Clase</Label>
                <Select
                  value={formData.claseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, claseId: value })
                  }
                >
                  <SelectTrigger id="claseId">
                    <SelectValue placeholder="Seleccionar clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {clases
                      .filter((c) => c.estado === "activa")
                      .map((clase) => (
                        <SelectItem key={clase.id} value={String(clase.id)}>
                          {clase.nombre} - {clase.hora_inicio}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !formData.socioId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
