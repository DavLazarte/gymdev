"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, Search, CheckCircle2, Calendar, Loader2 } from "lucide-react"
import { useRequireRole } from "@/hooks/useRequireRole"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function RegisterAttendancePage() {
  const { user, loading } = useRequireRole("gym_staff")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get("client")

  const [clients, setClients] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      try {
        const [sociosData, clasesData]: [any, any] = await Promise.all([
          api.getSocios({ per_page: 200 }).catch(() => []),
          api.getClases().catch(() => []),
        ])
        const sociosList = Array.isArray(sociosData)
          ? sociosData
          : sociosData?.socios || sociosData?.data || []
        const clasesList = Array.isArray(clasesData)
          ? clasesData
          : clasesData?.data || []
        setClients(sociosList)
        setClasses(clasesList)

        if (preselectedClientId) {
          setSelectedClient(String(preselectedClientId))
        }
      } catch (err) {
        console.error("Error cargando datos de asistencia:", err)
      }
    }
    loadData()
  }, [user, preselectedClientId])

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase().trim()
    if (!q) return false
    const dni = String(c.dni || c.documento || "").toLowerCase()
    const email = String(c.email || c.correo || "").toLowerCase()
    return (
      String(c.nombre || "").toLowerCase().includes(q) ||
      dni.includes(q) ||
      email.includes(q)
    )
  })

  const client = clients.find((c) => String(c.id) === String(selectedClient))
  const classSession = classes.find((c) => String(c.id) === String(selectedClass))

  const handleRegisterAttendance = async () => {
    if (!client) return
    try {
      setIsSubmitting(true)
      const claseId = selectedClass && selectedClass !== "free" ? Number(selectedClass) : null
      await api.marcarAsistencia({
        id_persona: Number(client.id),
        socio_id: String(client.id),
        id_clase_gym: claseId,
        clase_id: claseId ? String(claseId) : undefined,
        fecha: new Date().toISOString().split("T")[0],
        fecha_asistencia: new Date().toISOString().split("T")[0],
      })
      setSuccess(true)
      toast({
        title: "Asistencia registrada",
        description: `Se registró la asistencia de ${client.nombre}.`,
      })
      setTimeout(() => {
        setSuccess(false)
        setSelectedClient("")
        setSelectedClass("")
      }, 2500)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrar asistencia",
        description: error.message || "No se pudo registrar la asistencia.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader userName={user?.name || "Recepción"} userRole="reception" />

      <main className="container mx-auto max-w-2xl space-y-6 p-4">
        <div className="flex items-center gap-3">
          <Link href="/reception">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registrar Asistencia</h1>
            <p className="text-sm text-muted-foreground">Confirmar llegada de socio</p>
          </div>
        </div>

        {success && (
          <Alert className="border-primary bg-primary/10">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">Asistencia registrada correctamente</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Client */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">1. Buscar Socio</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar socio por nombre o DNI..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {clientSearch && (
            <div className="space-y-2">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClient(String(c.id))
                    setClientSearch("")
                  }}
                  className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
                >
                  <p className="font-medium text-foreground">{c.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    DNI: {c.dni || c.documento || "-"} · {c.email || c.correo || "Sin correo"}
                  </p>
                </button>
              ))}
            </div>
          )}

          {client && (
            <Card>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Socio seleccionado:</p>
                  <p className="font-semibold text-foreground">{client.nombre}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClient("")}>
                  Cambiar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step 2: Select Class or Free Access */}
        {client && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">2. Seleccionar Clase (Opcional)</h2>
            <p className="text-sm text-muted-foreground">Selecciona una clase o registra acceso libre</p>

            <div className="space-y-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(String(c.id))}
                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                    String(selectedClass) === String(c.id) ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{c.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {String(c.hora_inicio || "").substring(0, 5)} hs - {c.instructor_nombre || "Instructor"}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}

              <button
                onClick={() => setSelectedClass("free")}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  selectedClass === "free" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <p className="font-semibold text-foreground">Acceso Libre</p>
                <p className="text-sm text-muted-foreground">Sin clase específica</p>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {client && selectedClass && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <h3 className="mb-3 font-semibold text-foreground">Confirmar Asistencia</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Socio:</span>
                  <span className="font-medium text-foreground">{client.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clase:</span>
                  <span className="font-medium text-foreground">
                    {selectedClass === "free" ? "Acceso Libre" : classSession?.nombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium text-foreground">
                    {new Date().toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={handleRegisterAttendance} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirmar Asistencia
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav role="reception" />
    </div>
  )
}

