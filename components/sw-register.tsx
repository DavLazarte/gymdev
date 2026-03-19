"use client";

import { useEffect } from "react";

const APP_VERSION = "1.20.0"; // Incrementar para forzar limpieza total

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedVersion = localStorage.getItem("app_version");

      if (storedVersion !== APP_VERSION) {
        console.log(
          `[PWA] Nueva versión detectada (${APP_VERSION}). Realizando limpieza profunda...`,
        );

        //Nuclear Clear
        const clearAll = async () => {
          // 1. Borrar todos los caches
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));

          // 2. Desregistrar todos los service workers
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));

          // 3. Limpiar LocalStorage (excepto el token de auth si queremos ser gentiles,
          // pero mejor limpiar todo para asegurar resiliencia)
          const token = localStorage.getItem("auth_token");
          localStorage.clear();
          if (token) localStorage.setItem("auth_token", token);

          localStorage.setItem("app_version", APP_VERSION);

          console.log("[PWA] Limpieza completada. Recargando...");
          window.location.reload();
        };

        clearAll();
        return;
      }
    }

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Defer SW registration until after page load
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful:",
              registration.scope,
            );

            // Check for updates periodically
            setInterval(
              () => {
                registration.update();
              },
              60 * 60 * 1000,
            ); // Cada hora
          })
          .catch((err) => {
            console.log("ServiceWorker registration failed:", err);
          });

        // Force reload when new SW takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      });
    }
  }, []);

  return null;
}
