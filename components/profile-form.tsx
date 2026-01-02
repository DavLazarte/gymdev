"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    nombre: user.nombre || user.name || "", // Fallback for name variation
    email: user.email || "",
    telefono: user.telefono || user.phone || "",
    password: "",
    password_confirmation: "",
    foto: user.foto || user.image || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setFormData((prev) => ({ ...prev, foto: compressedBase64 }));
      } catch (error) {
        console.error("Error compressing image:", error);
        setError("Error al procesar la imagen");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);
    setError("");

    try {
      await api.updateProfile(formData);

      if (formData.password) {
        setSuccess(true);
        // Pequeño delay para que el usuario vea el éxito antes de salir
        setTimeout(async () => {
          try {
            await api.logout();
          } catch (e) {}
          router.push("/login");
        }, 1500);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>Actualiza tus datos de contacto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="foto">Foto de Perfil</Label>
            <div className="flex items-center gap-4">
              {formData.foto && (
                <img
                  src={formData.foto}
                  alt="Preview"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <div className="p-3 bg-muted rounded-md text-sm font-medium">
              {formData.nombre}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña (Opcional)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              disabled={isLoading}
              placeholder="Dejar en blanco para mantener la actual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={formData.password_confirmation}
              onChange={(e) =>
                handleChange("password_confirmation", e.target.value)
              }
              disabled={isLoading}
              placeholder="Repetir nueva contraseña"
            />
          </div>

          {success && (
            <Alert className="border-primary bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                {formData.password
                  ? "Contraseña actualizada. Redirigiendo al login..."
                  : "Perfil actualizado correctamente"}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando cambios...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
