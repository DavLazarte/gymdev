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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, CalendarIcon, Info, Search, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import type { Membresia, Socio, Plan, Clase } from "@/lib/types";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface MembresiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membresia?: Membresia;
  initialSocioId?: string;
  onSave: (data: any) => Promise<void>;
}

export function MembresiaDialog({
  open,
  onOpenChange,
  membresia,
  initialSocioId,
  onSave,
}: MembresiaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);

  const [formData, setFormData] = useState({
    id_socio: "",
    id_plan: "",
    id_clase_fija: "ninguna",
    fecha_inicio: format(new Date(), "yyyy-MM-dd"),
    // Campos de pago
    registrar_pago: false,
    metodo_pago: "efectivo",
    monto_pago: "",
    observaciones_pago: "",
  });

  const [socioSearch, setSocioSearch] = useState("");

  // Para mostrar info del plan seleccionado
  const selectedPlan = planes.find((p) => p.id === formData.id_plan);

  // Filtrar socios localmente
  const filteredSocios = socios.filter(
    (s) =>
      s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(socioSearch.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (membresia) {
      setFormData({
        id_socio: membresia.idpersona ? String(membresia.idpersona) : "",
        id_plan: membresia.idservicio ? String(membresia.idservicio) : "",
        id_clase_fija: "ninguna",
        fecha_inicio: membresia.fecha_inicio
          ? format(new Date(membresia.fecha_inicio), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        registrar_pago: false,
        metodo_pago: "efectivo",
        monto_pago: "",
        observaciones_pago: "",
      });
    } else {
      setFormData({
        id_socio: initialSocioId || "",
        id_plan: "",
        id_clase_fija: "ninguna",
        fecha_inicio: format(new Date(), "yyyy-MM-dd"),
        registrar_pago: false,
        metodo_pago: "efectivo",
        monto_pago: "",
        observaciones_pago: "",
      });
    }
    setSocioSearch(""); // Reset search on open
  }, [membresia, initialSocioId, open]);

  // Actualizar monto si cambia el plan
  useEffect(() => {
    if (selectedPlan && !membresia) {
      setFormData((prev) => ({
        ...prev,
        monto_pago: selectedPlan.precio.toString(),
      }));
    }
  }, [selectedPlan, membresia]);

  const fetchData = async () => {
    setIsFetchingData(true);
    try {
      const [sociosRaw, planesRaw, clasesRaw] = await Promise.all([
        api.getSocios({ all: true }), // Fetch all socios without pagination
        api.getPlanes(),
        api.getClases(),
      ]);

      // Adaptar socios: mapear idpersona -> id (SocioController ya lo manda como id)
      const adaptedSocios = (sociosRaw?.socios || []).map((s: any) => ({
        ...s,
        id: String(s.id || s.idpersona || Math.random()),
      }));

      // Adaptar planes: mapear idservicio -> id
      const adaptedPlanes = (planesRaw || []).map((p: any) => ({
        ...p,
        id: p.idservicio ? String(p.idservicio) : String(Math.random()),
      }));

      setSocios(adaptedSocios);
      setPlanes(adaptedPlanes);
      setClases(
        (clasesRaw?.clases || []).filter((c: Clase) => c.estado === "activa")
      );
    } catch (error) {
      console.error("Error fetching data for MembresiaDialog:", error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        id_clase_fija:
          formData.id_clase_fija && formData.id_clase_fija !== "ninguna"
            ? formData.id_clase_fija
            : undefined,
      };
      await onSave(payload);
    } catch (error) {
      console.error("Error saving membership:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResume = () => {
    if (!selectedPlan) return null;

    let resume = "";

    if (selectedPlan.duracion_dias) {
      const fin = addDays(
        new Date(formData.fecha_inicio),
        selectedPlan.duracion_dias,
      );
      resume += `Vencerá el ${format(fin, "PPPP", {
        locale: es,
      })}.`;
    }

    if (selectedPlan.creditos) {
      resume += ` ${resume ? "Además, tendrá" : "Tendrá"} un total de ${
        selectedPlan.creditos
      } clases.`;
    }

    return resume || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {membresia ? "Editar Membresía" : "Asignar Membresía"}
          </DialogTitle>
          <DialogDescription>
            {membresia
              ? "Modifica los detalles de la membresía activa."
              : "Selecciona un socio y un plan para crear una nueva membresía."}
          </DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="socio">Socio *</Label>
              <Select
                value={formData.id_socio}
                onValueChange={(val) =>
                  setFormData({ ...formData, id_socio: val })
                }
                disabled={!!initialSocioId || !!membresia}
                required
              >
                <SelectTrigger id="socio">
                  <SelectValue placeholder="Seleccionar socio" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center border-b px-3 pb-2 sticky top-0 bg-popover z-10">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Buscar socio..."
                      value={socioSearch}
                      onChange={(e) => setSocioSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredSocios.length === 0 ? (
                      <div className="py-6 text-center text-sm">
                        No se encontraron socios.
                      </div>
                    ) : (
                      filteredSocios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select
                value={formData.id_plan}
                onValueChange={(val) =>
                  setFormData({ ...formData, id_plan: val })
                }
                disabled={!!membresia}
                required
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {planes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} (${p.precio})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!membresia && clases.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="id_clase_fija">
                  Turno Fijo / Clase asignada (Opcional)
                </Label>
                <Select
                  value={formData.id_clase_fija}
                  onValueChange={(val) =>
                    setFormData({ ...formData, id_clase_fija: val })
                  }
                >
                  <SelectTrigger id="id_clase_fija">
                    <SelectValue placeholder="Sin turno fijo (Modalidad libre)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">
                      Sin turno fijo (El socio reserva libremente)
                    </SelectItem>
                    {clases.map((c) => {
                      const ocupados = c.inscritos_fijos ?? 0;
                      const lleno = ocupados >= c.cupo_maximo;
                      return (
                        <SelectItem
                          key={c.id}
                          value={String(c.id)}
                          disabled={lleno}
                        >
                          {c.nombre} ({c.hora_inicio}hs - {c.dias_semana}) [
                          {ocupados}/{c.cupo_maximo}]
                          {c.modalidad === "fijo" ? " • Turno Fijo" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Si el gimnasio trabaja con turnos fijos, seleccioná aquí el
                  horario del alumno para dejarlo inscripto.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fecha_inicio"
                  type="date"
                  className="pl-9"
                  value={formData.fecha_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_inicio: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {selectedPlan && (
              <div className="rounded-lg bg-muted p-3 flex gap-3 items-start">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Resumen del Plan:</p>
                  <p className="text-muted-foreground">{getResume()}</p>
                </div>
              </div>
            )}

            {!membresia && (
              <>
                <Separator className="my-2" />
                <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <Label
                        htmlFor="registrar_pago"
                        className="font-semibold cursor-pointer"
                      >
                        Registrar cobro inicial
                      </Label>
                    </div>
                    <Switch
                      id="registrar_pago"
                      checked={formData.registrar_pago}
                      onCheckedChange={(val) =>
                        setFormData({ ...formData, registrar_pago: val })
                      }
                    />
                  </div>

                  {formData.registrar_pago && (
                    <div className="grid gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid gap-1">
                        <Label htmlFor="metodo_pago" className="text-xs">
                          Método de pago
                        </Label>
                        <Select
                          value={formData.metodo_pago}
                          onValueChange={(val) =>
                            setFormData({ ...formData, metodo_pago: val })
                          }
                        >
                          <SelectTrigger
                            id="metodo_pago"
                            className="h-8 text-xs"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="transferencia">
                              Transferencia
                            </SelectItem>
                            <SelectItem value="mercadopago">
                              Mercado Pago
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="monto_pago" className="text-xs">
                          Monto cobrado
                        </Label>
                        <Input
                          id="monto_pago"
                          type="number"
                          className="h-8 text-xs"
                          value={formData.monto_pago}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              monto_pago: e.target.value,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
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
              <Button
                type="submit"
                disabled={isLoading || !formData.id_plan || !formData.id_socio}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {membresia ? "Actualizando..." : "Asignando..."}
                  </>
                ) : membresia ? (
                  "Actualizar"
                ) : (
                  "Asignar y Cobrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
