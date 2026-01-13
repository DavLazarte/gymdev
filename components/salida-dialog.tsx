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
import type { Socio } from "@/lib/types";

interface SalidaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export function SalidaDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
}: SalidaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [personas, setPersonas] = useState<Socio[]>([]);
  const [personaSearch, setPersonaSearch] = useState("");

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDates, setCalcDates] = useState({ start: "", end: "" });
  const [calcStats, setCalcStats] = useState<{
    total_classes: number;
    details: any[];
  } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_persona: "",
    monto: "",
    descripcion: "",
    tipo_salida: "servicio",
    fecha: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      loadPersonas();
      if (initialData) {
        setFormData({
          id_persona: initialData.id_persona || "",
          monto: initialData.monto || "",
          descripcion: initialData.descripcion || "",
          tipo_salida: initialData.tipo_salida || "servicio",
          fecha: initialData.fecha
            ? initialData.fecha.split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      } else {
        setFormData({
          id_persona: "",
          monto: "",
          descripcion: "",
          tipo_salida: "servicio",
          fecha: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, initialData]);

  const loadPersonas = async () => {
    setIsFetching(true);
    try {
      // Explicitly load instructors only
      const instructors = await api.getInstructores({ per_page: 100 });
      const mapped = (instructors || []).map((s: any) => ({
        ...s,
        id: String(s.id || s.idpersona),
        tipo_persona: "instructor",
      }));
      setPersonas(mapped);
    } catch (error) {
      console.error("Error loading personas:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const filteredPersonas = personas.filter((p) => {
    return p.nombre.toLowerCase().includes(personaSearch.toLowerCase());
  });

  // State for rate input
  const [rate, setRate] = useState("");

  const handleCalculateClasses = async () => {
    if (!formData.id_persona || !calcDates.start || !calcDates.end) return;

    setCalcLoading(true);
    try {
      const stats = await api.getInstructorStats(
        formData.id_persona,
        calcDates.start,
        calcDates.end
      );
      setCalcStats(stats);
    } catch (error) {
      console.error(error);
    } finally {
      setCalcLoading(false);
    }
  };

  const applyCalculation = () => {
    if (!calcStats) return;

    // Calculate total amount
    const totalAmount = calcStats.total_classes * (Number(rate) || 0);

    setFormData((prev) => ({
      ...prev,
      monto: totalAmount.toString(),
      descripcion: `Pago por ${calcStats.total_classes} clases dadas (${calcDates.start} al ${calcDates.end})`,
    }));
    // setShowCalculator(false); // Can keep it open or close it
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        ...formData,
        monto: Number(formData.monto),
        id_persona: formData.id_persona || null,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling usually done in parent
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Gasto" : "Registrar Gasto"}
          </DialogTitle>
          <DialogDescription>
            Registra una nueva salida de dinero o gasto.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Tipo de Gasto (First, as requested) */}
            <div className="space-y-2">
              <Label htmlFor="tipo_salida">Tipo de Gasto *</Label>
              <Select
                value={formData.tipo_salida}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_salida: value })
                }
              >
                <SelectTrigger id="tipo_salida">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servicio">
                    Servicio (Luz, Agua, etc)
                  </SelectItem>
                  <SelectItem value="pago_instructor">
                    Pago a Instructor
                  </SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="insumos">Insumos</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* FLOW A: Pago a Instructor */}
            {formData.tipo_salida === "pago_instructor" ? (
              <div className="space-y-4 border-l-2 border-primary pl-4">
                {/* Rate & Instructor */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Valor por Clase ($)</Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="Ej: 5000"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_persona">Instructor</Label>
                    <Select
                      value={formData.id_persona}
                      onValueChange={(value) =>
                        setFormData({ ...formData, id_persona: value })
                      }
                    >
                      <SelectTrigger id="id_persona">
                        <SelectValue placeholder="Seleccionar Instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="flex items-center border-b px-3 pb-2 sticky top-0 bg-popover z-10">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Buscar instructor..."
                            value={personaSearch}
                            onChange={(e) => setPersonaSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredPersonas.length > 0 ? (
                            filteredPersonas.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted">
                              No se encontraron instructores
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range & Calculator */}
                <div className="p-3 bg-muted rounded-md space-y-3">
                  <Label>Calcular Clases Dadas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Desde</Label>
                      <Input
                        type="date"
                        value={calcDates.start}
                        onChange={(e) =>
                          setCalcDates((prev) => ({
                            ...prev,
                            start: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hasta</Label>
                      <Input
                        type="date"
                        value={calcDates.end}
                        onChange={(e) =>
                          setCalcDates((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    size="sm"
                    variant="secondary"
                    onClick={handleCalculateClasses}
                    disabled={
                      calcLoading ||
                      !formData.id_persona ||
                      !calcDates.start ||
                      !calcDates.end
                    }
                  >
                    {calcLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Verificar Clases y Calcular Monto"
                    )}
                  </Button>

                  {calcStats && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="text-sm font-medium text-center">
                        {calcStats.total_classes} clases encontradas
                      </div>
                      {/* Details List */}
                      <div className="max-h-[100px] overflow-y-auto text-xs space-y-1 bg-background p-2 rounded border">
                        {calcStats.details.map((d: any, i) => (
                          <div key={i} className="flex justify-between">
                            <span>
                              {d.date} ({d.day})
                            </span>
                            <span className="font-medium">{d.time}</span>
                          </div>
                        ))}
                        {calcStats.details.length === 0 && (
                          <p className="text-muted-foreground text-center">
                            No se encontraron clases dadas (con
                            reservas/asistencia).
                          </p>
                        )}
                      </div>

                      {rate && calcStats.total_classes > 0 && (
                        <div className="flex flex-col gap-2">
                          <div className="text-center text-sm font-bold text-primary">
                            Total Calculado: $
                            {(
                              calcStats.total_classes * Number(rate)
                            ).toLocaleString()}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={applyCalculation}
                          >
                            Aplicar al Formulario
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Resulting Fields (Auto-filled but editable) */}
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha de Pago</Label>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto Final ($) *</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) =>
                        setFormData({ ...formData, monto: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción *</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* FLOW B: Otros Gastos */
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto ($) *</Label>
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) =>
                        setFormData({ ...formData, monto: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    placeholder="Ej: Pago factura luz Enero"
                    required
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
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
                ) : (
                  "Guardar Gasto"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
