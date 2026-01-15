"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { Plan } from "@/lib/types";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan;
  onSave: (plan: any) => Promise<void>;
}

export function PlanDialog({
  open,
  onOpenChange,
  plan,
  onSave,
}: PlanDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    tipo_plan: "fecha" as "fecha" | "creditos",
    duracion_dias: "",
    creditos: "",
    estado: true,
  });

  useEffect(() => {
    if (plan) {
      // Determine type based on existing data
      let tipo: "fecha" | "creditos" = "fecha";
      if (plan.creditos && plan.creditos > 0) tipo = "creditos";
      if (plan.duracion_dias && plan.duracion_dias > 0) tipo = "fecha";

      setFormData({
        nombre: plan.nombre,
        descripcion: plan.descripcion || "",
        precio: plan.precio.toString(),
        tipo_plan: tipo,
        duracion_dias: plan.duracion_dias ? plan.duracion_dias.toString() : "",
        creditos: plan.creditos ? plan.creditos.toString() : "",
        estado: plan.estado,
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        tipo_plan: "fecha",
        duracion_dias: "30", // Default 30 days
        creditos: "10", // Default 10 credits
        estado: true,
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSave: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio) || 0,
        estado: formData.estado,
        tipo_servicio: "plan",
        duracion_dias: parseInt(formData.duracion_dias) || null,
        creditos:
          formData.tipo_plan === "creditos"
            ? parseInt(formData.creditos) || null
            : null,
      };

      if (plan) {
        dataToSave.id = plan.id;
      }

      await onSave(dataToSave);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "Modifica los detalles del plan de membresía."
              : "Crea un nuevo plan o paquete de clases."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Plan *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Pase Mensual, Pack 10 Clases"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Detalles sobre qué incluye este plan..."
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    value={formData.precio}
                    onChange={(e) =>
                      setFormData({ ...formData, precio: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Estado</Label>
                  <div className="text-[0.8rem] text-muted-foreground">
                    {formData.estado ? "Activo" : "Inactivo"}
                  </div>
                </div>
                <Switch
                  checked={formData.estado}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, estado: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Tipo de Consumo</Label>
              <RadioGroup
                value={formData.tipo_plan}
                onValueChange={(val: "fecha" | "creditos") =>
                  setFormData({ ...formData, tipo_plan: val })
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="fecha"
                    id="tipo-fecha"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="tipo-fecha"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="mb-1 text-lg">📅</span>
                    <span className="font-semibold">Por Tiempo</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Acceso ilimitado por días/meses
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="creditos"
                    id="tipo-creditos"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="tipo-creditos"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="mb-1 text-lg">🎫</span>
                    <span className="font-semibold">Por Créditos</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Pack de clases o pases limitados
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="duracion">
                  {formData.tipo_plan === "creditos"
                    ? "Vigencia Máxima (Días) *"
                    : "Vigencia (Días) *"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="duracion"
                    type="number"
                    min="1"
                    value={formData.duracion_dias}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duracion_dias: e.target.value,
                      })
                    }
                    required
                  />
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() =>
                        setFormData({ ...formData, duracion_dias: "30" })
                      }
                    >
                      30d
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() =>
                        setFormData({ ...formData, duracion_dias: "90" })
                      }
                    >
                      3m
                    </Button>
                  </div>
                </div>
                <p className="text-[0.7rem] text-muted-foreground">
                  {formData.tipo_plan === "creditos"
                    ? "Tiempo máximo para usar los créditos desde la asignación. Los créditos vencen al agotar este plazo o al usarlos todos."
                    : "Días de acceso ilimitado desde el momento de la asignación."}
                </p>
              </div>

              {formData.tipo_plan === "creditos" && (
                <div className="space-y-2">
                  <Label htmlFor="creditos">
                    Cantidad de Créditos/Clases *
                  </Label>
                  <Input
                    id="creditos"
                    type="number"
                    min="1"
                    value={formData.creditos}
                    onChange={(e) =>
                      setFormData({ ...formData, creditos: e.target.value })
                    }
                    required={formData.tipo_plan === "creditos"}
                  />
                  <p className="text-[0.7rem] text-muted-foreground">
                    Número de clases o usos incluidos en este plan.
                  </p>
                </div>
              )}
            </div>
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
              ) : plan ? (
                "Actualizar Plan"
              ) : (
                "Crear Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
