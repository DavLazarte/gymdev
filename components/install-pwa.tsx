"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install button
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-4 sm:w-[350px] animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Instalar App</p>
            <p className="text-xs opacity-90">Acceso rápido desde tu inicio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstallClick}
            className="font-bold shadow-sm"
          >
            Instalar
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
