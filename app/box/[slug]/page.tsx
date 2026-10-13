"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Loader2,
  ShieldCheck,
  User,
  Users,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { applyTenantThemeToDom } from "@/components/tenant-theme-provider"

export default function PublicBoxLandingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const slug = (params?.slug as string) || ""

  const [isLoading, setIsLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [planes, setPlanes] = useState<any[]>([])
  const [clases, setClases] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    objetivo: "Acondicionamiento Físico",
    plan_interes: "",
    mensaje: "",
  })

  useEffect(() => {
    if (!slug) return
    loadData()
  }, [slug])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const res = await api.getPublicBoxData(slug)
      const t = res.tenant
      setTenant(t)
      setPlanes(res.planes || [])
      setClases(res.clases || [])

      // Aplicar dinámicamente colores y modo del Box
      if (t) {
        applyTenantThemeToDom({
          nombre: t.nombre,
          color_primario: t.color_primario || "#f97316",
          tema_modo: t.tema_modo || "dark",
        })
      }
    } catch (error: any) {
      toast({
        title: "Gimnasio no encontrado",
        description: error?.message || "No pudimos cargar la información de este gimnasio.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.email.trim() || !formData.telefono.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completá tu nombre, email y teléfono / WhatsApp.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const res = await api.registerBoxLead(slug, formData)
      setSubmitted(true)
      toast({
        title: "¡Inscripción recibida!",
        description: res.message || "Te contactaremos a la brevedad.",
      })
    } catch (error: any) {
      toast({
        title: "Error al enviar",
        description: error?.message || "No se pudo registrar tu solicitud.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">Cargando gimnasio...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-xl font-bold">Gimnasio no disponible</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            El Box o Gimnasio que buscás no existe o se encuentra inactivo.
          </p>
          <Button asChild variant="outline">
            <Link href="/login">Ir al Inicio de Sesión</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const cleanPhone = tenant.telefono?.replace(/\D/g, "")
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola ${tenant.nombre}! Quiero consultar para empezar a entrenar.`)}`
    : null

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Header Público */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.nombre} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-base md:text-lg tracking-tight block leading-tight truncate">
                {tenant.nombre}
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:block">
                Box & Entrenamiento
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {whatsappUrl && (
              <Button size="sm" variant="outline" asChild className="hidden sm:inline-flex">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-500" />
                  WhatsApp
                </a>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={`/login?box=${tenant.slug}`}>
                <User className="mr-1.5 h-4 w-4" />
                <span>Soy Socio</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-8 sm:py-14 md:py-20 border-b border-border bg-gradient-to-b from-card to-background">
        <div className="max-w-6xl mx-auto px-4 grid gap-8 lg:gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Preventa y Clases Abiertas</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] break-words">
              Entrená al máximo en <span className="text-primary">{tenant.nombre}</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              {tenant.descripcion ||
                "Unite a nuestra comunidad, alcanzá tus metas y llevá tu rendimiento al siguiente nivel con planes personalizados y los mejores entrenadores."}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 sm:pt-2 w-full sm:w-auto">
              <Button size="lg" asChild className="shadow-lg shadow-primary/20 w-full sm:w-auto text-center justify-center">
                <a href="#inscribirme">
                  Anotarme / Clase de Prueba
                  <ArrowRight className="ml-2 h-4 w-4 inline" />
                </a>
              </Button>
              {whatsappUrl && (
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-center justify-center">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4 text-emerald-500 inline" />
                    Consultar por WhatsApp
                  </a>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-4 border-t border-border/60 text-xs text-muted-foreground">
              {tenant.direccion && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate max-w-[220px]">{tenant.direccion}</span>
                </div>
              )}
              {tenant.telefono && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>{tenant.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Cupos Limitados</span>
              </div>
            </div>
          </div>

          {/* Formulario de Captación / Lead */}
          <div id="inscribirme" className="lg:col-span-5 scroll-mt-20 w-full">
            <Card className="border-primary/40 shadow-2xl bg-card overflow-hidden">
              <CardHeader className="pb-3 p-5 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary shrink-0" />
                  <span>¡Sumate a entrenar!</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Dejanos tus datos para asegurar tu cupo o coordinar tu primera clase.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 pt-0 sm:pt-0">
                {submitted ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto border border-primary/30">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">¡Solicitud Recibida!</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        Ya registramos tus datos en {tenant.nombre}. Nuestro equipo se pondrá en contacto con vos por WhatsApp.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                      Enviar otra consulta
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="nombre" className="text-xs">Nombre *</Label>
                        <Input
                          id="nombre"
                          required
                          placeholder="Tu nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="apellido" className="text-xs">Apellido</Label>
                        <Input
                          id="apellido"
                          placeholder="Tu apellido"
                          value={formData.apellido}
                          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="telefono" className="text-xs">Teléfono / WhatsApp *</Label>
                      <Input
                        id="telefono"
                        type="tel"
                        required
                        placeholder="Ej: +54 9 11 1234-5678"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="tuemail@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="objetivo" className="text-xs">¿Cuál es tu objetivo principal?</Label>
                      <select
                        id="objetivo"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={formData.objetivo}
                        onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                      >
                        <option value="Empezar a entrenar / Ponerme en forma">Empezar a entrenar / Ponerme en forma</option>
                        <option value="Ganar fuerza y masa muscular">Ganar fuerza y masa muscular</option>
                        <option value="CrossFit / Rendimiento deportivo">CrossFit / Rendimiento deportivo</option>
                        <option value="Bajar de peso y salud">Bajar de peso y salud</option>
                        <option value="Quiero conocer el lugar y probar una clase">Quiero conocer el lugar y probar una clase</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="mensaje" className="text-xs">¿En qué horarios podés entrenar o qué dudas tenés?</Label>
                      <Textarea
                        id="mensaje"
                        rows={2}
                        placeholder="Ej: Puedo entrenar por la mañana / tarde..."
                        value={formData.mensaje}
                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full py-5 text-sm font-semibold" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando solicitud...
                        </>
                      ) : (
                        "Enviar Solicitud"
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Planes y Modalidades (Sin precios, orientados a asesoramiento) */}
      {planes.length > 0 && (
        <section className="py-8 sm:py-12 md:py-16 border-b border-border max-w-6xl mx-auto px-4 w-full">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8 sm:mb-10">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Membresías
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Nuestros Planes</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Contamos con diferentes modalidades según tu frecuencia de entrenamiento y objetivos.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {planes.map((plan) => (
              <Card key={plan.id} className="relative flex flex-col justify-between border-border hover:border-primary/60 transition-all p-5 sm:p-6">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base sm:text-lg text-foreground">{plan.nombre}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {plan.modalidad === "creditos" ? `${plan.creditos ?? 10} Clases` : "Mensual"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {plan.descripcion || "Acceso guiado por entrenadores y seguimiento personalizado."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      mensaje: `Quiero consultar por el plan "${plan.nombre}".`,
                    }))
                    const el = document.getElementById("inscribirme")
                    el?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Consultar por este plan ↗
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Disciplinas y Horarios */}
      {clases.length > 0 && (
        <section className="py-8 sm:py-12 md:py-16 border-b border-border max-w-6xl mx-auto px-4 w-full">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8 sm:mb-10">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Actividades
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Nuestras Clases</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Variedad de turnos y disciplinas dictadas por coaches certificados.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {clases.map((clase) => (
              <div key={clase.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground truncate">{clase.nombre}</h3>
                  <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                    {clase.modalidad || "Grupo"}
                  </Badge>
                </div>
                {clase.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{clase.descripcion}</p>
                )}
                {clase.hora_inicio && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{clase.hora_inicio.slice(0, 5)} - {clase.hora_fin?.slice(0, 5) || "Fin"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Botón flotante WhatsApp en Mobile */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="fixed bottom-5 right-5 z-50 sm:hidden flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 bg-card/60">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-foreground">{tenant.nombre}</span>
            <span>·</span>
            <span>
              Potenciado por{" "}
              <a
                href="https://devsign.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
              >
                devsign.ar
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`/login?box=${tenant.slug}`} className="hover:text-foreground transition-colors">
              Acceso a Socios
            </Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                WhatsApp Directo
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
