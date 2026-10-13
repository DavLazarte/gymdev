"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { api } from "@/lib/api";
import { Dumbbell } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [brandName, setBrandName] = useState("Gimnasio");
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("tenant_branding");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.nombre) setBrandName(parsed.nombre);
        if (parsed.logo_url && parsed.logo_url !== "/logo.jpeg") {
          setBrandLogo(parsed.logo_url);
        }
      }
    } catch {}

    api
      .getTenantConfig()
      .then((res: any) => {
        const tenant = res?.data || res?.tenant || res;
        const nombre = tenant?.nombre;
        const logo =
          tenant?.configuracion?.logo_url || tenant?.logo_url || null;
        if (nombre) setBrandName(nombre);
        if (logo && logo !== "/logo.jpeg") setBrandLogo(logo);
      })
      .catch(() => {});

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
      if (roleName === "gym_owner" || roleName === "gym_admin") {
        router.push("/admin");
      } else if (roleName === "gym_staff" || roleName === "coach") {
        router.push("/admin/reservas");
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
            <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-primary text-primary-foreground overflow-hidden shadow-lg shadow-primary/20">
              {brandLogo && brandLogo !== "/logo.jpeg" ? (
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-28 w-28 rounded-2xl object-cover"
                />
              ) : (
                <Dumbbell className="h-12 w-12" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{brandName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Verificando sesión...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar formulario de login
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-primary text-primary-foreground overflow-hidden shadow-lg shadow-primary/20">
            {brandLogo && brandLogo !== "/logo.jpeg" ? (
              <img
                src={brandLogo}
                alt={brandName}
                className="h-28 w-28 rounded-2xl object-cover"
              />
            ) : (
              <Dumbbell className="h-12 w-12" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{brandName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sistema de gestión y entrenamiento
          </p>
        </div>

        <LoginForm />

        <div className="pt-2 text-center text-xs text-muted-foreground">
          <span>Potenciado por </span>
          <a
            href="https://devsign.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
          >
            devsign.ar
          </a>
        </div>
      </div>
    </div>
  );
}
