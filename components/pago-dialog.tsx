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
import { Loader2, Search, Info } from "lucide-react";
import { api } from "@/lib/api";
import type { Socio, Membresia } from "@/lib/types";

interface PagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
  initialSocioId?: string;
  initialMembresiaId?: string;
}

export function PagoDialog({
  open,
  onOpenChange,
  onSave,
  initialSocioId,
  initialMembresiaId,
}: PagoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [membresias, setMembresias] = useState<any[]>([]);
  const [socioSearch, setSocioSearch] = useState("");

  const [formData, setFormData] = useState({
    id_persona: "",
    id_membresia: "",
    monto: "",
    metodo_pago: "efectivo",
    fecha_pago: new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  useEffect(() => {
    if (open) {
      loadSocios();
      // Si recibimos IDs iniciales, los seteamos
      setFormData((prev) => ({
        ...prev,
        id_persona: initialSocioId || "",
        id_membresia: initialMembresiaId || "",
        monto: "", // Se cargará al cargar membresías
      }));
    }
  }, [open, initialSocioId, initialMembresiaId]);

  useEffect(() => {
    if (formData.id_persona) {
      loadMembresias(formData.id_persona);
    } else {
      setMembresias([]);
    }
  }, [formData.id_persona]);

  const loadSocios = async () => {
    setIsFetching(true);
    try {
      const response = await api.getSocios();
      const mappedSocios = (response?.socios || []).map((s: any) => ({
        ...s,
        id: String(s.id || s.idpersona),
      }));
      setSocios(mappedSocios);
    } catch (error) {
      console.error("Error loading socios:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const loadMembresias = async (socioId: string) => {
    try {
      const data = await api.getMembresias({ id_socio: socioId });
      setMembresias(data);

      // Si tenemos un initialMembresiaId, buscamos su monto
      if (initialMembresiaId) {
        const target = data.find((m) => String(m.id) === initialMembresiaId);
        if (target) {
          setFormData((prev) => ({
            ...prev,
            id_membresia: initialMembresiaId,
            monto:
              target.saldo_pendiente?.toString() ||
              target.plan?.precio?.toString() ||
              prev.monto,
          }));
          return;
        }
      }

      // De lo contrario, auto-seleccionar activa si existe
      const activa = data.find((m) => m.estado === "activa");
      if (activa) {
        setFormData((prev) => ({
          ...prev,
          id_membresia: String(activa.id),
          monto:
            activa.saldo_pendiente?.toString() ||
            activa.plan?.precio?.toString() ||
            "",
        }));
      }
    } catch (error) {
      console.error("Error loading membresias:", error);
    }
  };

  const filteredSocios = socios.filter((s) =>
    s.nombre.toLowerCase().includes(socioSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        id_persona: formData.id_persona,
        id_membresia: formData.id_membresia,
        monto: Number(formData.monto),
        metodo_pago: formData.metodo_pago,
        fecha_pago: formData.fecha_pago,
        observaciones: formData.observaciones,
      });
      onOpenChange(false);
      setFormData({
        id_persona: "",
        id_membresia: "",
        monto: "",
        metodo_pago: "efectivo",
        fecha_pago: new Date().toISOString().split("T")[0],
        observaciones: "",
      });
    } catch (error) {
      console.error("Error saving payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra un nuevo pago vinculado a una membresía
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id_persona">Socio *</Label>
              <Select
                value={formData.id_persona}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    id_persona: value,
                    id_membresia: "",
                  })
                }
                required
              >
                <SelectTrigger id="id_persona">
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

            <div className="space-y-2">
              <Label htmlFor="id_membresia">Membresía *</Label>
              <Select
                value={formData.id_membresia}
                onValueChange={(value) => {
                  const m = membresias.find(
                    (item) => String(item.id) === value
                  );
                  setFormData({
                    ...formData,
                    id_membresia: value,
                    monto:
                      m?.saldo_pendiente?.toString() ||
                      m?.plan?.precio?.toString() ||
                      "",
                  });
                }}
                disabled={!formData.id_persona || membresias.length === 0}
                required
              >
                <SelectTrigger id="id_membresia">
                  <SelectValue
                    placeholder={
                      formData.id_persona
                        ? "Seleccionar membresía"
                        : "Primero selecciona un socio"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {membresias.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.plan?.nombre} ({m.estado})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.id_membresia && (
                <div className="flex flex-col gap-1 mt-2 p-2 rounded bg-amber-50 border border-amber-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-700 font-medium">
                      Costo Total:
                    </span>
                    <span className="text-amber-900">
                      $
                      {membresias.find(
                        (m) => String(m.id) === formData.id_membresia
                      )?.monto_total ?? "0"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-700">Saldo Pendiente:</span>
                    <span className="text-destructive">
                      $
                      {membresias.find(
                        (m) => String(m.id) === formData.id_membresia
                      )?.saldo_pendiente ?? "0"}
                    </span>
                  </div>
                </div>
              )}
              {formData.id_persona && membresias.length === 0 && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> Este socio no tiene membresías
                  registradas.
                </p>
              )}
            </div>

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
                <Label htmlFor="fecha_pago">Fecha *</Label>
                <Input
                  id="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_pago: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de pago *</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value) =>
                  setFormData({ ...formData, metodo_pago: value })
                }
              >
                <SelectTrigger id="metodo_pago">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                placeholder="Dato adicional del pago..."
              />
            </div>

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
                disabled={isLoading || !formData.id_membresia}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
