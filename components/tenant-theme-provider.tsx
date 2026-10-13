"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export function applyTenantThemeToDom(config: {
  nombre?: string;
  logo_url?: string;
  color_primario?: string;
  tema_modo?: "dark" | "light";
}) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const modo = config.tema_modo || "dark";

  if (modo === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }

  const color = (config.color_primario || "").trim();
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
    root.style.setProperty("--primary", color);
    root.style.setProperty("--ring", color);
    root.style.setProperty("--sidebar-primary", color);
    root.style.setProperty("--sidebar-ring", color);
    root.style.setProperty("--chart-1", color);
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--sidebar-primary-foreground", "#ffffff");
  }

  if (config.nombre) {
    document.title = `${config.nombre} - Sistema de Gestión`;
  }
}

export function TenantThemeProvider() {
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const raw = localStorage.getItem("tenant_branding");
        if (raw) {
          const parsed = JSON.parse(raw);
          applyTenantThemeToDom(parsed);
        }
      } catch {}
    };

    syncFromStorage();

    api
      .getTenantConfig()
      .then((res: any) => {
        const tenant = res?.data || res?.tenant || res;
        if (!tenant) return;
        const cfg = tenant.configuracion || {};
        const branding = {
          id: tenant.id,
          nombre: tenant.nombre || "Gimnasio",
          logo_url: cfg.logo_url || tenant.logo_url || "",
          color_primario:
            tenant.color_primario || cfg.color_primario || "#f97316",
          tema_modo: (cfg.tema_modo as "dark" | "light") || "dark",
        };
        try {
          localStorage.setItem("tenant_branding", JSON.stringify(branding));
        } catch {}
        applyTenantThemeToDom(branding);
      })
      .catch(() => {});

    window.addEventListener("tenant-config-updated", syncFromStorage);
    return () => {
      window.removeEventListener("tenant-config-updated", syncFromStorage);
    };
  }, []);

  return null;
}
