"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Building2, Clock, Bell, Palette, Save, Loader2, CheckCircle2, CreditCard, Upload, Trash2, Moon, Sun, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { applyTenantThemeToDom } from "@/components/tenant-theme-provider"

const PRESET_COLORS = [
  { name: "Naranja Cross", hex: "#f97316" },
  { name: "Esmeralda", hex: "#10b981" },
  { name: "Azul Eléctrico", hex: "#3b82f6" },
  { name: "Rojo Intenso", hex: "#ef4444" },
  { name: "Lima Fitness", hex: "#84cc16" },
  { name: "Violeta Pro", hex: "#8b5cf6" },
  { name: "Ámbar", hex: "#f59e0b" },
  { name: "Cian", hex: "#06b6d4" },
]

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [gymData, setGymData] = useState({
    nombre: "",
    slug: "",
    direccion: "",
    telefono: "",
    email: "",
    descripcion: "",
    alias_pago: "",
    logo_url: "",
    color_primario: "#f97316",
    tema_modo: "dark" as "dark" | "light",
  })

  const [horarios, setHorarios] = useState<Record<string, { apertura: string; cierre: string; cerrado: boolean }>>({
    lunes: { apertura: "06:00", cierre: "23:00", cerrado: false },
    martes: { apertura: "06:00", cierre: "23:00", cerrado: false },
    miercoles: { apertura: "06:00", cierre: "23:00", cerrado: false },
    jueves: { apertura: "06:00", cierre: "23:00", cerrado: false },
    viernes: { apertura: "06:00", cierre: "23:00", cerrado: false },
    sabado: { apertura: "08:00", cierre: "20:00", cerrado: false },
    domingo: { apertura: "09:00", cierre: "15:00", cerrado: false },
  })

  const [notificaciones, setNotificaciones] = useState({
    recordatorioClases: true,
    alertaVencimiento: true,
    confirmacionPago: true,
    newsletterSemanal: false,
  })

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const res: any = await api.getTenantConfig()
      const tenant = res?.data || res?.tenant || res
      const cfg = tenant?.configuracion || {}
      const resolvedLogo = cfg.logo_url || tenant?.logo_url || ""
      const resolvedColor = tenant?.color_primario || cfg.color_primario || "#f97316"
      const resolvedTema = cfg.tema_modo === "light" ? "light" : "dark"

      const resolvedSlug =
        tenant?.slug ||
        cfg.slug ||
        (typeof window !== "undefined" ? localStorage.getItem("tenant_slug") : "") ||
        (tenant?.nombre ? tenant.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "")

      setGymData({
        nombre: tenant?.nombre || "Gimnasio",
        slug: resolvedSlug,
        direccion: cfg.direccion || "",
        telefono: cfg.telefono || "",
        email: cfg.email || "",
        descripcion: cfg.descripcion || "",
        alias_pago: cfg.alias_pago || "",
        logo_url: resolvedLogo,
        color_primario: resolvedColor,
        tema_modo: resolvedTema,
      })

      if (cfg.horarios && typeof cfg.horarios === "object") {
        setHorarios((prev) => ({ ...prev, ...cfg.horarios }))
      }

      if (cfg.notificaciones && typeof cfg.notificaciones === "object") {
        setNotificaciones((prev) => ({ ...prev, ...cfg.notificaciones }))
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo no válido",
        description: "Seleccioná una imagen (PNG, JPG, WEBP o SVG).",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxSize = 256
        let width = img.width
        let height = img.height
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL("image/png", 0.9)
          setGymData((prev) => ({ ...prev, logo_url: dataUrl }))
        }
      }
      if (typeof event.target?.result === "string") {
        img.src = event.target.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveGymData = async () => {
    try {
      setIsSaving(true)
      setSuccess(false)

      const res: any = await api.updateTenantConfig({
        nombre: gymData.nombre,
        color_primario: gymData.color_primario,
        configuracion: {
          direccion: gymData.direccion,
          telefono: gymData.telefono,
          email: gymData.email,
          descripcion: gymData.descripcion,
          alias_pago: gymData.alias_pago,
          logo_url: gymData.logo_url || null,
          color_primario: gymData.color_primario,
          tema_modo: gymData.tema_modo,
          horarios,
          notificaciones,
        },
      })

      const savedTenant = res?.data || res?.tenant
      const finalName = savedTenant?.nombre || gymData.nombre || "Gimnasio"
      const finalLogo =
        savedTenant?.configuracion?.logo_url ||
        savedTenant?.logo_url ||
        gymData.logo_url ||
        ""
      const finalColor =
        savedTenant?.color_primario ||
        savedTenant?.configuracion?.color_primario ||
        gymData.color_primario ||
        "#f97316"
      const finalTema =
        savedTenant?.configuracion?.tema_modo ||
        gymData.tema_modo ||
        "dark"

      try {
        localStorage.setItem(
          "tenant_branding",
          JSON.stringify({
            nombre: finalName,
            logo_url: finalLogo,
            color_primario: finalColor,
            tema_modo: finalTema,
          })
        )
        window.dispatchEvent(new Event("tenant-config-updated"))
      } catch {}

      setSuccess(true)

      toast({
        title: "Configuración guardada",
        description: "Los cambios del gimnasio se han guardado correctamente.",
      })

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No se pudo actualizar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    )
  }

      const landingSlug =
        gymData.slug ||
        gymData.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
        "box"
      const landingUrl = `/box/${landingSlug}`

      const handleOpenLanding = (e: React.MouseEvent) => {
        e.preventDefault()
        window.open(landingUrl, "_blank", "noopener,noreferrer")
      }

      return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground">Administra la configuración y datos de contacto del gimnasio</p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={handleOpenLanding}>
          <Building2 className="mr-1.5 h-4 w-4 text-primary" />
          Ver mi Landing Web Pública ↗
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos del Gimnasio
          </CardTitle>
          <CardDescription>Información general, contacto y datos de cobro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Landing Page Pública de tu Gimnasio</p>
                <p className="text-[11px] text-muted-foreground">
                  Compartí este enlace en tu Instagram o WhatsApp para captar nuevos alumnos y preventas:{" "}
                  <code className="text-primary font-mono">{landingUrl}</code>
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" type="button" onClick={handleOpenLanding} className="shrink-0">
              Abrir Landing Web ↗
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del gimnasio (Reemplaza el título en toda la app)</Label>
              <Input
                id="nombre"
                value={gymData.nombre}
                onChange={(e) => setGymData({ ...gymData, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
              <Input
                id="telefono"
                type="tel"
                value={gymData.telefono}
                onChange={(e) => setGymData({ ...gymData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={gymData.email}
                onChange={(e) => setGymData({ ...gymData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias_pago" className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Alias de Pago / CBU (Visible para alumnos al renovar)
              </Label>
              <Input
                id="alias_pago"
                placeholder="Ej: mi.gimnasio.mp"
                value={gymData.alias_pago}
                onChange={(e) => setGymData({ ...gymData, alias_pago: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={gymData.direccion}
              onChange={(e) => setGymData({ ...gymData, direccion: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={gymData.descripcion}
              onChange={(e) => setGymData({ ...gymData, descripcion: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios de Apertura
          </CardTitle>
          <CardDescription>Configura los horarios por día de la semana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(horarios).map(([dia, horario]) => (
            <div key={dia}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="w-24 font-medium capitalize text-foreground">{dia}</span>
                  {!horario.cerrado ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={horario.apertura}
                        onChange={(e) =>
                          setHorarios({
                            ...horarios,
                            [dia]: { ...horario, apertura: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={horario.cierre}
                        onChange={(e) =>
                          setHorarios({
                            ...horarios,
                            [dia]: { ...horario, cierre: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Cerrado</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`cerrado-${dia}`} className="text-sm">
                    Cerrado
                  </Label>
                  <Switch
                    id={`cerrado-${dia}`}
                    checked={horario.cerrado}
                    onCheckedChange={(checked) =>
                      setHorarios({
                        ...horarios,
                        [dia]: { ...horario, cerrado: checked },
                      })
                    }
                  />
                </div>
              </div>
              {dia !== "domingo" && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura las notificaciones automáticas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="recordatorioClases">Recordatorio de clases</Label>
              <p className="text-sm text-muted-foreground">Enviar recordatorios 1 hora antes de la clase</p>
            </div>
            <Switch
              id="recordatorioClases"
              checked={notificaciones.recordatorioClases}
              onCheckedChange={(checked) => setNotificaciones({ ...notificaciones, recordatorioClases: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="alertaVencimiento">Alerta de vencimiento</Label>
              <p className="text-sm text-muted-foreground">Notificar membresías próximas a vencer (7 días antes)</p>
            </div>
            <Switch
              id="alertaVencimiento"
              checked={notificaciones.alertaVencimiento}
              onCheckedChange={(checked) => setNotificaciones({ ...notificaciones, alertaVencimiento: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="confirmacionPago">Confirmación de pago</Label>
              <p className="text-sm text-muted-foreground">Enviar confirmación automática al registrar pagos</p>
            </div>
            <Switch
              id="confirmacionPago"
              checked={notificaciones.confirmacionPago}
              onCheckedChange={(checked) => setNotificaciones({ ...notificaciones, confirmacionPago: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="newsletterSemanal">Newsletter semanal</Label>
              <p className="text-sm text-muted-foreground">Enviar resumen semanal de actividades</p>
            </div>
            <Switch
              id="newsletterSemanal"
              checked={notificaciones.newsletterSemanal}
              onCheckedChange={(checked) => setNotificaciones({ ...notificaciones, newsletterSemanal: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalización y Colores del Box
          </CardTitle>
          <CardDescription>Logo, modo de fondo (Oscuro Carbono / Claro) y color principal de tu gimnasio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Logo del gimnasio</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoFileChange}
            />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
                {gymData.logo_url ? (
                  <img
                    src={gymData.logo_url}
                    alt="Logo del gimnasio"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  Cambiar logo
                </Button>
                {gymData.logo_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setGymData((prev) => ({ ...prev, logo_url: "" }))}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Quitar
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Seleccioná una imagen (PNG, JPG o SVG) y luego presioná "Guardar cambios".
            </p>
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label>Modo de Fondo</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGymData((prev) => ({ ...prev, tema_modo: "dark" }))
                    applyTenantThemeToDom({
                      nombre: gymData.nombre,
                      color_primario: gymData.color_primario,
                      tema_modo: "dark",
                    })
                  }}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                    gymData.tema_modo === "dark"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-zinc-100 border border-zinc-700">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Oscuro Carbono</div>
                    <div className="text-xs text-muted-foreground">Recomendado (#09090b)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGymData((prev) => ({ ...prev, tema_modo: "light" }))
                    applyTenantThemeToDom({
                      nombre: gymData.nombre,
                      color_primario: gymData.color_primario,
                      tema_modo: "light",
                    })
                  }}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                    gymData.tema_modo === "light"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-900 border border-zinc-300">
                    <Sun className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Modo Claro</div>
                    <div className="text-xs text-muted-foreground">Fondo limpio (#fafafa)</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Color Principal del Gimnasio</Label>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => {
                  const isSelected =
                    gymData.color_primario.toLowerCase() === preset.hex.toLowerCase()
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      title={preset.name}
                      onClick={() => {
                        setGymData((prev) => ({ ...prev, color_primario: preset.hex }))
                        applyTenantThemeToDom({
                          nombre: gymData.nombre,
                          color_primario: preset.hex,
                          tema_modo: gymData.tema_modo,
                        })
                      }}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        isSelected ? "scale-110 border-foreground ring-2 ring-primary/40" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    />
                  )
                })}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="color"
                  value={gymData.color_primario}
                  onChange={(e) => {
                    const hex = e.target.value
                    setGymData((prev) => ({ ...prev, color_primario: hex }))
                    applyTenantThemeToDom({
                      nombre: gymData.nombre,
                      color_primario: hex,
                      tema_modo: gymData.tema_modo,
                    })
                  }}
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <Input
                  value={gymData.color_primario}
                  onChange={(e) => {
                    const hex = e.target.value
                    setGymData((prev) => ({ ...prev, color_primario: hex }))
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                      applyTenantThemeToDom({
                        nombre: gymData.nombre,
                        color_primario: hex,
                        tema_modo: gymData.tema_modo,
                      })
                    }
                  }}
                  placeholder="#f97316"
                  className="w-32 font-mono text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  Vista previa en vivo. Guardá para aplicarlo a todos tus alumnos.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {success && (
        <Alert className="border-primary bg-primary/10">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">Configuración guardada correctamente</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadConfig} disabled={isSaving}>
          Restablecer
        </Button>
        <Button onClick={handleSaveGymData} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}


