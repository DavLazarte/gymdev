"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Building2,
  Plus,
  ShieldCheck,
  Users,
  UserCheck,
  Globe,
  Palette,
  Power,
  Edit,
  ExternalLink,
  KeyRound,
  Loader2,
  Moon,
  Sun,
  ArrowLeft,
  CheckCircle2,
  Lock,
  LogOut,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { applyTenantThemeToDom } from "@/components/tenant-theme-provider"

const PRESET_COLORS = [
  "#f97316",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#84cc16",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
]

export default function SuperAdminPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [masterKey, setMasterKey] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<any | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    dominio: "",
    color_primario: "#f97316",
    tema_modo: "dark" as "dark" | "light",
    telefono: "",
    direccion: "",
    alias_pago: "",
    admin_nombre: "",
    admin_email: "",
    admin_password: "",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentTenantId = localStorage.getItem("tenant_id")
      setActiveTenantId(currentTenantId)

      // Solo desbloquea automáticamente si ya ingresaste la clave en esta sesión del navegador
      const savedKey = sessionStorage.getItem("superadmin_key")
      if (savedKey) {
        setMasterKey(savedKey)
        loadTenants(savedKey)
      }
    }
  }, [])

  const loadTenants = async (keyToUse = masterKey) => {
    if (!keyToUse.trim()) {
      toast({
        title: "Clave requerida",
        description: "Ingresá la Clave Maestra SuperAdmin.",
        variant: "destructive",
      })
      return
    }
    try {
      setIsLoading(true)
      const res = await api.getSuperAdminTenants(keyToUse.trim())
      setTenants(res.tenants || [])
      setIsUnlocked(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("superadmin_key", keyToUse.trim())
      }
    } catch (error: any) {
      setIsUnlocked(false)
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("superadmin_key")
      }
      toast({
        title: "Acceso denegado",
        description: error?.message || "La clave maestra ingresada no es válida.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLockSession = () => {
    setIsUnlocked(false)
    setMasterKey("")
    setTenants([])
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("superadmin_key")
    }
  }

  const handleOpenCreate = () => {
    setEditingTenant(null)
    setFormData({
      nombre: "",
      slug: "",
      dominio: "",
      color_primario: "#f97316",
      tema_modo: "dark",
      telefono: "",
      direccion: "",
      alias_pago: "",
      admin_nombre: "Administrador",
      admin_email: "",
      admin_password: "",
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (tenant: any) => {
    setEditingTenant(tenant)
    setFormData({
      nombre: tenant.nombre || "",
      slug: tenant.slug || "",
      dominio: tenant.dominio || "",
      color_primario: tenant.color_primario || "#f97316",
      tema_modo: tenant.tema_modo === "light" ? "light" : "dark",
      telefono: tenant.configuracion?.telefono || "",
      direccion: tenant.configuracion?.direccion || "",
      alias_pago: tenant.configuracion?.alias_pago || "",
      admin_nombre: tenant.admin?.nombre || "Administrador",
      admin_email: tenant.admin?.email || "",
      admin_password: "",
    })
    setIsDialogOpen(true)
  }

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Ingresá el nombre del Box o Gimnasio.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      if (editingTenant) {
        await api.updateSuperAdminTenant(masterKey, editingTenant.id, formData)
        toast({
          title: "Box actualizado",
          description: `Se actualizaron los datos de "${formData.nombre}".`,
        })
      } else {
        await api.createSuperAdminTenant(masterKey, formData)
        toast({
          title: "Nuevo Box creado",
          description: `Se creó "${formData.nombre}" con su usuario administrador (clave por defecto: 12345678 si no ingresaste otra).`,
        })
      }
      setIsDialogOpen(false)
      loadTenants(masterKey)
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error?.message || "No se pudo guardar el gimnasio.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (tenant: any) => {
    try {
      const res = await api.toggleSuperAdminTenant(masterKey, tenant.id)
      toast({
        title: res.activo ? "Gimnasio activado" : "Gimnasio pausado",
        description: res.message,
      })
      loadTenants(masterKey)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo cambiar el estado.",
        variant: "destructive",
      })
    }
  }

  const handleSelectTenantContext = (tenant: any) => {
    if (typeof window === "undefined") return
    localStorage.setItem("tenant_id", tenant.id)
    localStorage.setItem("tenant_slug", tenant.slug || "")
    if (tenant.dominio) {
      localStorage.setItem("tenant_host", tenant.dominio)
    } else {
      localStorage.removeItem("tenant_host")
    }
    const branding = {
      nombre: tenant.nombre,
      logo_url: tenant.logo_url || "/logo.jpeg",
      color_primario: tenant.color_primario || "#f97316",
      tema_modo: tenant.tema_modo || "dark",
    }
    localStorage.setItem("tenant_branding", JSON.stringify(branding))
    applyTenantThemeToDom(branding)
    window.dispatchEvent(new Event("tenant-config-updated"))
    setActiveTenantId(tenant.id)

    toast({
      title: `Conectado a ${tenant.nombre}`,
      description: `Ahora estás operando sobre este Box (${tenant.admin?.email || "sin admin"}).`,
    })
  }

  const handleEnterTenantLogin = (tenant: any) => {
    handleSelectTenantContext(tenant)
    api.clearToken()
    localStorage.removeItem("user_data")
    router.push("/login")
  }

  // Pantalla de bloqueo si no ingresó la Clave Maestra
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Acceso SuperAdmin</CardTitle>
            <CardDescription className="text-xs">
              Ingresá tu Clave Maestra (<code className="text-foreground">SUPERADMIN_KEY</code> en el <code className="text-foreground">.env</code> de Laravel) para gestionar los Boxes y Gimnasios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                loadTenants(masterKey)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="masterKey">Clave Maestra</Label>
                <Input
                  id="masterKey"
                  type="password"
                  required
                  autoFocus
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Desbloquear Panel Multi-Tenant
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Panel SuperAdmin · Multi-Tenant</h1>
                <p className="text-xs text-muted-foreground">
                  Administración central de Boxes, Gimnasios, dominios, colores y cuentas de administrador
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Ir al Panel Admin
              </Link>
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo Box / Gimnasio
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLockSession} title="Cerrar sesión SuperAdmin">
              <LogOut className="mr-1.5 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* Listado de Tenants */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => {
              const isCurrent = activeTenantId === tenant.id
              return (
                <Card
                  key={tenant.id}
                  className={`relative overflow-hidden transition-all ${
                    isCurrent ? "border-primary ring-1 ring-primary" : "border-border"
                  }`}
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: tenant.color_primario || "#f97316" }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted overflow-hidden shrink-0">
                          {tenant.logo_url ? (
                            <img
                              src={tenant.logo_url}
                              alt={tenant.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {tenant.nombre}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono">
                            ?box={tenant.slug}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={tenant.activo ? "default" : "destructive"} className="text-[10px]">
                          {tenant.activo ? "Activo" : "Pausado"}
                        </Badge>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                            <CheckCircle2 className="h-3 w-3" /> En uso
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-semibold text-foreground">{tenant.socios_count ?? 0}</div>
                          <div className="text-[11px] text-muted-foreground">Socios</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-semibold text-foreground">{tenant.coaches_count ?? 0}</div>
                          <div className="text-[11px] text-muted-foreground">Coaches</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" /> Dominio:
                        </span>
                        <span className="font-mono text-foreground">
                          {tenant.dominio || "(usa dominio general)"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5" /> Tema / Color:
                        </span>
                        <span className="flex items-center gap-1.5 font-mono">
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                            style={{ backgroundColor: tenant.color_primario || "#f97316" }}
                          />
                          {tenant.color_primario || "#f97316"} ·{" "}
                          {tenant.tema_modo === "light" ? "Claro" : "Oscuro"}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-border/60">
                        <div className="text-muted-foreground text-[11px]">Admin del Box:</div>
                        {tenant.admin ? (
                          <div className="flex items-center justify-between font-medium text-foreground mt-0.5">
                            <span>{tenant.admin.nombre}</span>
                            <span className="font-mono text-xs text-primary">{tenant.admin.email}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Sin usuario admin</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant={isCurrent ? "secondary" : "default"}
                        className="flex-1 text-xs"
                        onClick={() => handleSelectTenantContext(tenant)}
                      >
                        {isCurrent ? "Box Seleccionado" : "Activar en este navegador"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        title="Ver Landing Page pública del Box"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          window.open(`/box/${tenant.slug}`, "_blank", "noopener,noreferrer")
                        }}
                      >
                        <Globe className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        title="Ir al Login de este Box"
                        onClick={() => handleEnterTenantLogin(tenant)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        title="Editar Box y Admin"
                        onClick={() => handleOpenEdit(tenant)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className={`text-xs ${tenant.activo ? "text-destructive hover:text-destructive" : "text-emerald-500"}`}
                        title={tenant.activo ? "Pausar Box" : "Reactivar Box"}
                        onClick={() => handleToggleActive(tenant)}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Box */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? `Editar Box: ${editingTenant.nombre}` : "Crear Nuevo Box / Gimnasio"}
            </DialogTitle>
            <DialogDescription>
              Configurá los datos del gimnasio, su apariencia y las credenciales de su administrador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTenant} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre del Gimnasio / Box *</Label>
                <Input
                  id="nombre"
                  required
                  placeholder="Ej: Kratos CrossFit"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Identificador (Slug)</Label>
                <Input
                  id="slug"
                  placeholder="ej: kratos-box"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dominio">Dominio / Subdominio (Opcional)</Label>
                <Input
                  id="dominio"
                  placeholder="ej: kratos.devsign.ar"
                  value={formData.dominio}
                  onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alias_pago">Alias de Pago / CBU</Label>
                <Input
                  id="alias_pago"
                  placeholder="ej: kratos.box.mp"
                  value={formData.alias_pago}
                  onChange={(e) => setFormData({ ...formData, alias_pago: e.target.value })}
                />
              </div>
            </div>

            {/* Tema y Color */}
            <div className="rounded-lg border border-border p-3.5 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personalización Visual del Box
              </Label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={formData.tema_modo === "dark" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, tema_modo: "dark" })}
                  className="flex-1"
                >
                  <Moon className="mr-1.5 h-3.5 w-3.5" />
                  Oscuro Carbono
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={formData.tema_modo === "light" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, tema_modo: "light" })}
                  className="flex-1"
                >
                  <Sun className="mr-1.5 h-3.5 w-3.5" />
                  Modo Claro
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, color_primario: hex })}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      formData.color_primario.toLowerCase() === hex.toLowerCase()
                        ? "scale-110 border-foreground"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color_primario}
                  onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                  className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
                <Input
                  value={formData.color_primario}
                  onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                  className="w-28 h-8 font-mono text-xs"
                />
              </div>
            </div>

            {/* Datos del Usuario Administrador */}
            <div className="rounded-lg border border-border p-3.5 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Usuario Administrador del Box
              </Label>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="admin_nombre">Nombre del Admin</Label>
                  <Input
                    id="admin_nombre"
                    placeholder="Administrador"
                    value={formData.admin_nombre}
                    onChange={(e) => setFormData({ ...formData, admin_nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin_email">Email de acceso *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    required={!editingTenant}
                    placeholder="admin@kratosbox.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin_password">
                  {editingTenant
                    ? "Nueva Contraseña (dejar en blanco para no cambiar)"
                    : "Contraseña inicial (si lo dejás vacío será 12345678)"}
                </Label>
                <Input
                  id="admin_password"
                  type="text"
                  placeholder="12345678"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingTenant ? "Guardar Cambios" : "Crear Box y Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
