"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Search, Phone, Mail, Calendar, UserCheck, Loader2 } from "lucide-react"
import { useRequireRole } from "@/hooks/useRequireRole"
import { api } from "@/lib/api"
import Link from "next/link"

export default function SearchClientPage() {
  const { user, loading } = useRequireRole("gym_staff")
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)

  useEffect(() => {
    if (!user) return
    const loadSocios = async () => {
      try {
        setIsSearching(true)
        const data: any = await api.getSocios({ per_page: 200 })
        const list = Array.isArray(data) ? data : data?.socios || data?.data || []
        setClients(list)
      } catch (err) {
        console.error("Error cargando socios:", err)
      } finally {
        setIsSearching(false)
      }
    }
    loadSocios()
  }, [user])

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return false
    const dni = String(c.dni || c.documento || "").toLowerCase()
    const email = String(c.email || c.correo || "").toLowerCase()
    return (
      String(c.nombre || "").toLowerCase().includes(q) ||
      dni.includes(q) ||
      email.includes(q)
    )
  })

  const mapStatus = (status?: string) => {
    const s = String(status || "").toLowerCase()
    if (s === "activo" || s === "activa") return "Activa"
    if (s === "por_vencer" || s === "por vencer") return "Por Vencer"
    if (s === "vencido" || s === "vencida") return "Vencida"
    return "Sin Membresía"
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
            <h1 className="text-2xl font-bold text-foreground">Buscar Socio</h1>
            <p className="text-sm text-muted-foreground">Encuentra información por nombre, DNI o email</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI o correo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSelectedClient(null)
            }}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {searchQuery && !selectedClient && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isSearching
                ? "Buscando..."
                : `${filteredClients.length} ${filteredClients.length === 1 ? "resultado" : "resultados"}`}
            </p>
            {filteredClients.map((c) => (
              <Card key={c.id} className="cursor-pointer transition-colors hover:bg-accent/50">
                <CardContent className="p-4" onClick={() => setSelectedClient(c)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{c.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        DNI: {c.dni || c.documento || "-"} · {c.email || c.correo || "Sin correo"}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Client Profile */}
        {selectedClient && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedClient.nombre}</h2>
                      <p className="text-sm text-muted-foreground">
                        DNI: {selectedClient.dni || selectedClient.documento || "-"}
                      </p>
                    </div>
                    <StatusBadge
                      status={mapStatus(
                        selectedClient.membresia?.estado ||
                          selectedClient.estado_membresia ||
                          selectedClient.estado
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {selectedClient.email || selectedClient.correo || "Sin correo"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedClient.telefono || "Sin teléfono"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Información de Membresía</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium text-foreground">
                      {selectedClient.membresia?.plan ||
                        selectedClient.membresia_activa?.servicio_nombre ||
                        selectedClient.servicio_nombre ||
                        "Sin plan activo"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modalidad:</span>
                    <span className="font-medium text-foreground">
                      {selectedClient.tiene_turno_fijo
                        ? "Turno Fijo"
                        : selectedClient.membresia?.modalidad || "Por Clases / Libre"}
                    </span>
                  </div>
                  {(selectedClient.creditos_restantes !== null &&
                    selectedClient.creditos_restantes !== undefined) ||
                  (selectedClient.membresia?.creditos !== null &&
                    selectedClient.membresia?.creditos !== undefined) ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Créditos restantes:</span>
                      <span className="font-medium text-primary">
                        {selectedClient.creditos_restantes ?? selectedClient.membresia?.creditos}
                      </span>
                    </div>
                  ) : null}
                  {(selectedClient.membresia?.vencimiento ||
                    selectedClient.membresia_activa?.fecha_vencimiento ||
                    selectedClient.fecha_vencimiento) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <span className="font-medium text-foreground">
                        {new Date(
                          selectedClient.membresia?.vencimiento ||
                            selectedClient.membresia_activa?.fecha_vencimiento ||
                            selectedClient.fecha_vencimiento
                        ).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Link href={`/reception/book?client=${selectedClient.id}`}>
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Reservar Clase
                </Button>
              </Link>
              <Link href={`/reception/attendance?client=${selectedClient.id}`}>
                <Button variant="outline" className="w-full bg-transparent">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Registrar Asistencia
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <MobileNav role="reception" />
    </div>
  )
}

