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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { mockPlanes } from "@/lib/mock-admin-data";
import type { Socio } from "@/lib/types";

interface SocioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socio?: Socio;
  onSave: (socio: Socio | Omit<Socio, "id">) => void;
}

export function SocioDialog({
  open,
  onOpenChange,
  socio,
  onSave,
}: SocioDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "",
    dni: "",
    foto: "",
    crearUsuario: false,
    password: "",
    resetPassword: false,
  });

  useEffect(() => {
    if (socio) {
      setFormData({
        nombre: socio.nombre,
        email: socio.email,
        telefono: socio.telefono,
        direccion: socio.direccion || "",
        fechaNacimiento: socio.fechaNacimiento || "",
        dni: socio.dni || "",
        foto: socio.foto || "",
        crearUsuario: false,
        password: "",
        resetPassword: false,
      });
    } else {
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        fechaNacimiento: "",
        dni: "",
        foto: "",
        crearUsuario: false,
        password: "",
        resetPassword: false,
      });
    }
  }, [socio, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const socioData = {
      ...formData,
      planNombre: "Sin plan", // Default value
      estado: "activo" as Socio["estado"], // Default estado
    };

    if (socio) {
      onSave({ ...socioData, id: socio.id });
    } else {
      onSave(socioData);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{socio ? "Editar Socio" : "Nuevo Socio"}</DialogTitle>
          <DialogDescription>
            {socio
              ? "Actualiza la información del socio"
              : "Completa los datos para registrar un nuevo socio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) =>
                setFormData({ ...formData, direccion: e.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fechaNacimiento: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI/CUIT</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) =>
                  setFormData({ ...formData, dni: e.target.value })
                }
              />
            </div>
          </div>

          {!socio && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="crearUsuario">Crear cuenta de acceso</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Permite al socio acceder con su email y contraseña
                  </p>
                </div>
                <Switch
                  id="crearUsuario"
                  checked={formData.crearUsuario}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      crearUsuario: checked,
                      password: checked ? formData.password : "", // Clear password when unchecked
                    })
                  }
                />
              </div>

              {formData.crearUsuario && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="password">Contraseña temporal *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={formData.crearUsuario}
                    minLength={8}
                  />
                </div>
              )}
            </div>
          )}

          {socio && socio.tieneUsuario && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="resetPassword">Restablecer contraseña</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Cambiar la contraseña de acceso del socio
                  </p>
                </div>
                <Switch
                  id="resetPassword"
                  checked={formData.resetPassword}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      resetPassword: checked,
                      password: checked ? formData.password : "",
                    })
                  }
                />
              </div>

              {formData.resetPassword && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="new-password">Nueva contraseña *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={formData.resetPassword}
                    minLength={8}
                  />
                </div>
              )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : socio ? (
                "Actualizar"
              ) : (
                "Crear Socio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
