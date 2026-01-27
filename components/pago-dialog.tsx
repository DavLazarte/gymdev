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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Search, Info, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [openCombobox, setOpenCombobox] = useState(false);

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
      loadSocios("");
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) loadSocios(socioSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [socioSearch, open]);

  const loadSocios = async (search = "") => {
    setIsFetching(true);
    try {
      const response = await api.getSocios({ search, per_page: 50 }); // Bring more results for search
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
      const response: any = await api.getMembresias({ id_socio: socioId });
      const data = response.data || [];
      setMembresias(data);

      // Si tenemos un initialMembresiaId, buscamos su monto
      if (initialMembresiaId) {
        const target = data.find(
          (m: any) => String(m.id) === initialMembresiaId,
        );
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
      const activa = data.find((m: any) => m.estado === "activa");
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_persona">Socio *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {formData.id_persona
                    ? socios.find((s) => String(s.id) === formData.id_persona)
                        ?.nombre || "Socio seleccionado"
                    : "Seleccionar socio..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar socio..."
                    value={socioSearch}
                    onValueChange={setSocioSearch}
                  />
                  <CommandList>
                    {isFetching && (
                      <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                      </div>
                    )}

                    {!isFetching && socios.length === 0 && (
                      <CommandEmpty>No se encontraron socios.</CommandEmpty>
                    )}

                    {!isFetching && (
                      <CommandGroup>
                        {socios.map((socio) => (
                          <CommandItem
                            key={socio.id}
                            value={String(socio.id)} // Use ID as value for uniqueness
                            onSelect={(currentValue) => {
                              // currentValue might be normalized text, but we want the ID.
                              // Actually cmdk passes the value prop if set, or textContent.
                              // Let's trust we get the ID because we set value={String(socio.id)}.
                              // If cmdk normalizes, it might be lowercase.
                              // Better access selection by scope or key?
                              // Safe pattern: Use the ID from closure `socio.id`.
                              setFormData({
                                ...formData,
                                id_persona: String(socio.id),
                                id_membresia: "",
                              });
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.id_persona === String(socio.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {socio.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_membresia">Membresía *</Label>
            <Select
              value={formData.id_membresia}
              onValueChange={(value) => {
                const m = membresias.find((item) => String(item.id) === value);
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
                      (m) => String(m.id) === formData.id_membresia,
                    )?.monto_total ?? "0"}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-700">Saldo Pendiente:</span>
                  <span className="text-destructive">
                    $
                    {membresias.find(
                      (m) => String(m.id) === formData.id_membresia,
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
      </DialogContent>
    </Dialog>
  );
}
