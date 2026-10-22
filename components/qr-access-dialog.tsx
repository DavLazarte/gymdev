"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  Printer,
  Copy,
  Check,
  Download,
  ExternalLink,
  Share2,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QrAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymName?: string;
  gymLogo?: string | null;
  slug?: string;
}

export function QrAccessDialog({
  open,
  onOpenChange,
  gymName = "Gimnasio",
  gymLogo,
  slug,
}: QrAccessDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrMode, setQrMode] = useState<"login" | "landing">("login");
  const [targetUrl, setTargetUrl] = useState("");

  const effectiveSlug =
    slug ||
    (typeof window !== "undefined"
      ? localStorage.getItem("tenant_slug") || ""
      : "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (qrMode === "landing" && effectiveSlug) {
        setTargetUrl(`${origin}/box/${effectiveSlug}`);
      } else {
        setTargetUrl(
          effectiveSlug
            ? `${origin}/login?box=${effectiveSlug}`
            : `${origin}/login`
        );
      }
    }
  }, [effectiveSlug, qrMode, open]);

  const qrImageUrl = targetUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=450x450&margin=10&data=${encodeURIComponent(
        targetUrl
      )}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "El link de acceso directo fue copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar automáticamente.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `qr-acceso-${effectiveSlug || "gym"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast({
        title: "QR descargado",
        description: "Se guardó la imagen del código QR en tu dispositivo.",
      });
    } catch {
      // Fallback: abrir imagen en pestaña nueva para guardar
      window.open(qrImageUrl, "_blank");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `¡Hola! Acá tenés el acceso a tu portal de socio en ${gymName} para ver tus rutinas, clases y cuotas: ${targetUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-card border-border">
          <DialogHeader className="p-5 pb-3 border-b border-border text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg">
                  QR de Acceso para Alumnos
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Mostralo desde tu celular o imprimilo para la recepción
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Selector de modo si tiene slug */}
            {effectiveSlug && (
              <div className="flex rounded-lg bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setQrMode("login")}
                  className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all ${
                    qrMode === "login"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Acceso / Login Alumnos
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode("landing")}
                  className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all ${
                    qrMode === "landing"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Web Pública / Pre-venta
                </button>
              </div>
            )}

            {/* Tarjeta Visual de Alto Contraste para Celular */}
            <div className="relative flex flex-col items-center justify-center rounded-2xl bg-white text-zinc-900 p-5 shadow-inner border border-zinc-200">
              {/* Encabezado con Logo y Nombre del Box */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-full bg-zinc-900 text-white flex items-center justify-center overflow-hidden shrink-0">
                  {gymLogo && gymLogo !== "/logo.jpeg" ? (
                    <img
                      src={gymLogo}
                      alt={gymName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Dumbbell className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="font-bold text-sm tracking-tight text-zinc-900">
                  {gymName}
                </span>
              </div>

              {/* Imagen del Código QR */}
              <div className="relative h-60 w-60 sm:h-64 sm:w-64 bg-white flex items-center justify-center rounded-xl overflow-hidden shadow-sm">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt={`QR de acceso para ${gymName}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-zinc-400 text-xs">
                    Generando código...
                  </div>
                )}
              </div>

              {/* Mensaje de Escaneo */}
              <p className="mt-3 text-xs font-semibold text-zinc-600 text-center flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Escaneá con la cámara de tu celular
              </p>
            </div>

            {/* Enlace directo */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Enlace de destino
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={targetUrl}
                  className="h-9 text-xs font-mono bg-muted/50 select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-9 px-3 shrink-0"
                  title="Copiar enlace"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs flex items-center justify-center gap-1.5 h-9"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Imprimir</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs flex items-center justify-center gap-1.5 h-9"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Descargar</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleWhatsAppShare}
                className="text-xs flex items-center justify-center gap-1.5 h-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          PLANTILLA EXCLUSIVA PARA IMPRESIÓN (window.print())
          Visible ÚNICAMENTE en la hoja impresa (A4 / Carta)
          ========================================================================= */}
      <div
        id="devgym-printable-poster"
        className="hidden print:flex fixed inset-0 z-[999999] bg-white text-zinc-950 flex-col items-center justify-between p-12 text-center box-border"
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#ffffff",
          color: "#09090b",
        }}
      >
        {/* Encabezado del Gimnasio */}
        <div className="flex flex-col items-center space-y-3 pt-4">
          <div className="h-20 w-20 rounded-2xl bg-zinc-950 text-white flex items-center justify-center overflow-hidden border border-zinc-200">
            {gymLogo && gymLogo !== "/logo.jpeg" ? (
              <img
                src={gymLogo}
                alt={gymName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Dumbbell className="h-10 w-10 text-white" />
            )}
          </div>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-zinc-900">
            {gymName}
          </h1>
          <p className="text-xl font-semibold text-zinc-600 tracking-wide uppercase">
            {qrMode === "landing"
              ? "¡Sumate a entrenar con nosotros!"
              : "Portal de Socios y Entrenamientos"}
          </p>
        </div>

        {/* Código QR Gigante y Nítido */}
        <div className="flex flex-col items-center my-6">
          <div className="p-6 bg-white rounded-3xl border-4 border-zinc-950 shadow-sm">
            <img
              src={qrImageUrl}
              alt="Código QR de Acceso"
              className="w-72 h-72 object-contain"
            />
          </div>
          <p className="mt-4 text-lg font-bold uppercase tracking-wider text-zinc-900">
            Escaneá con la cámara de tu celular
          </p>
        </div>

        {/* Instrucciones Paso a Paso */}
        <div className="w-full max-w-md bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Pasos para ingresar:
          </p>
          <div className="flex items-center gap-3 text-sm text-zinc-800">
            <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>Abrí la cámara de tu teléfono móvil</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-800">
            <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>Apuntá al código QR superior</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-800">
            <span className="h-6 w-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <span>
              Ingresá con tu email (contraseña inicial:{" "}
              <strong className="text-zinc-950 font-bold">12345678</strong>)
            </span>
          </div>
        </div>

        {/* Link Escrito y Pie de Página */}
        <div className="pt-6 border-t border-zinc-200 w-full text-center space-y-1">
          <p className="text-xs text-zinc-500 font-mono">
            O ingresá desde tu navegador a: <strong>{targetUrl}</strong>
          </p>
          <p className="text-[11px] text-zinc-400 font-medium">
            devgym · Sistema de Gestión de Gimnasios y Entrenamiento
          </p>
        </div>
      </div>
    </>
  );
}
