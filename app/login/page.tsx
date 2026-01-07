"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      setChecking(false);
      return;
    }

    try {
      // Verificar si el token es válido
      const response = await api.getUser();
      const roleName = response.user.role_name;

      // Ya está logueado, redirigir según rol
      if (roleName === "gym_owner") {
        router.push("/admin");
      } else if (roleName === "gym_staff") {
        router.push("/reception");
      } else if (roleName === "gym_socio") {
        router.push("/client");
      } else {
        router.push("/client");
      }
    } catch (error) {
      // Token inválido o expirado, mostrar login
      console.log("Sesión expirada o inválida");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setChecking(false);
    }
  };

  // Mostrar loading mientras verifica
  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-primary">
              <img
                src="logo.jpeg"
                alt="logo"
                className="h-32 w-32 rounded-2xl"
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Vertice</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Verificando sesión...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar formulario de login
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-primary">
            <img src="logo.jpeg" alt="logo" className="h-32 w-32 rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Vertice</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de gestión
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
