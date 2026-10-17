"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Search, Calendar, Clock, Users, Loader2, CheckCircle2 } from "lucide-react"
import { useRequireRole } from "@/hooks/useRequireRole"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { getLocalToday } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function ReceptionBookClassPage() {
  const { user, loading } = useRequireRole("gym_staff")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get("client")

  const [clients, setClients] = useState<any[]>([])
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [clientSearch, setClientSearch] = useState("")
  const [isBookingId, setIsBookingId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [sociosData, clasesData]: [any, any] = await Promise.all([
        api.getSocios({ per_page: 200 }).catch(() => []),
        api.getAvailableClasses().catch(() => []),
      ])
      const sociosList = Array.isArray(sociosData)
        ? sociosData
        : sociosData?.socios || sociosData?.data || []
      const clasesList = Array.isArray(clasesData)
        ? clasesData
        : clasesData?.data || []
      setClients(sociosList)
      setAvailableClasses(clasesList)
      if (preselectedClientId && !selectedClient) {
        setSelectedClient(String(preselectedClientId))
      }
    } catch (err) {
      console.error("Error cargando reservas en recepción:", err)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
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

  const handleBookForClient = async (classItem: any) => {
    if (!client) return
    try {
      const key = `${classItem.id}-${classItem.fecha || ""}`
      setIsBookingId(key)
      await api.createReserva({
        id_clase_gym: String(classItem.id),
        clase_id: String(classItem.id),
        socio_id: String(client.id),
        id_persona: String(client.id),
        fecha_reserva: classItem.fecha || getLocalToday(),
      })
      toast({
        title: "Reserva confirmada",
        description: `Se reservó ${classItem.nombre} para ${client.nombre}.`,
      })
      loadData()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo reservar",
        description: error.message || "Error al crear la reserva.",
      })
    } finally {
      setIsBookingId(null)
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
            <h1 className="text-2xl font-bold text-foreground">Reservar Clase</h1>
            <p className="text-sm text-muted-foreground">Asignar turno a un socio</p>
          </div>
        </div>

        {/* Step 1: Select Client */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">1. Seleccionar Socio</h2>
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
            <div className="rounded-lg border border-primary bg-primary/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Socio seleccionado:</p>
                <p className="font-semibold text-foreground">{client.nombre}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient("")}>
                Cambiar
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Select Class */}
        {client && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">2. Seleccionar Clase Disponible</h2>

            <div className="space-y-3">
              {availableClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay clases disponibles para reservar.
                </p>
              ) : (
                availableClasses.map((classSession, idx) => {
                  const key = `${classSession.id}-${classSession.fecha || idx}`
                  const isFull = (classSession.cupos_disponibles ?? 1) <= 0
                  return (
                    <Card key={key}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{classSession.nombre}</p>
                            {classSession.modalidad === "fijo" && (
                              <Badge variant="outline" className="text-[10px]">
                                Turno Fijo
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {classSession.fecha && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {classSession.dia_nombre || classSession.fecha}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {String(classSession.hora_inicio || "").substring(0, 5)} hs
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {classSession.cupos_disponibles}/{classSession.cupo_maximo} disponibles
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={isFull || isBookingId === key}
                          onClick={() => handleBookForClient(classSession)}
                        >
                          {isBookingId === key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFull ? (
                            "Completo"
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1.5 h-4 w-4" />
                              Reservar
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )}
      </main>

      <MobileNav role="reception" />
    </div>
  )
}

