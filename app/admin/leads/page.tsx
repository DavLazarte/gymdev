"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  ArrowRight,
  RefreshCw,
  FileText,
  Check,
  Loader2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatLocalDate, getLocalToday } from "@/lib/utils";

interface LeadItem {
  id: number | string;
  tenant_id: number | string;
  grupo_id?: number | string | null;
  plan_interes_id?: number | string | null;
  alumno_id?: number | string | null;
  nombre: string;
  apellido?: string | null;
  nombre_completo?: string;
  email: string;
  telefono: string;
  mensaje?: string | null;
  estado: "pendiente" | "contactado" | "convertido" | "descartado" | "espera";
  notas_admin?: string | null;
  fecha_registro?: string | null;
  created_at?: string | null;
  grupo?: {
    id: number | string;
    nombre: string;
    hora_inicio?: string;
    dias_semana?: string;
    cupo_default?: number;
    coach?: {
      nombre_completo?: string;
    };
  } | null;
  plan_interes?: {
    id: number | string;
    nombre: string;
    precio?: number;
  } | null;
  alumno?: any;
}

export default function LeadsAdminPage() {
  const { toast } = useToast();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    contactados: 0,
    espera: 0,
    convertidos: 0,
    descartados: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Estado para el modal de "Convertir a Socio"
  const [convertingLead, setConvertingLead] = useState<LeadItem | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [planes, setPlanes] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);

  const [convertForm, setConvertForm] = useState({
    tipo_membresia_id: "",
    grupo_id: "",
    fecha_inicio: getLocalToday(),
    registrar_pago: true,
    metodo_pago: "efectivo",
    monto_pago: "",
    notas_admin: "",
  });

  // Estado para editar notas rápidas
  const [editingNotesLead, setEditingNotesLead] = useState<LeadItem | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [debouncedSearch, filterEstado]);

  // Cargar catálogo de planes y clases una sola vez para el diálogo de conversión
  useEffect(() => {
    loadCatalogos();
  }, []);

  const loadCatalogos = async () => {
    try {
      setIsLoadingCatalogos(true);
      const [resPlanes, resClases] = await Promise.allSettled([
        api.getPlanes(),
        api.getClases(),
      ]);

      if (resPlanes.status === "fulfilled") {
        const raw = resPlanes.value;
        const list = Array.isArray(raw)
          ? raw
          : (raw as any)?.servicios || (raw as any)?.data || [];
        setPlanes(
          list.map((p: any) => ({
            ...p,
            id: String(p.id || p.idservicio || ""),
            precio: p.precio !== undefined ? Number(p.precio) : 0,
          }))
        );
      } else {
        console.warn("Fallo al cargar planes:", resPlanes.reason);
      }

      if (resClases.status === "fulfilled") {
        const raw = resClases.value;
        const list =
          (raw as any)?.clases || (raw as any)?.data || (Array.isArray(raw) ? raw : []);
        setClases(
          list.map((c: any) => ({
            ...c,
            id: String(c.id || c.id_clase_gym || ""),
          }))
        );
      } else {
        console.warn("Fallo al cargar clases:", resClases.reason);
      }
    } catch (e) {
      console.warn("No se pudieron cargar catálogos para conversión:", e);
    } finally {
      setIsLoadingCatalogos(false);
    }
  };

  // Sincronizar plan por defecto si se terminan de cargar los planes con el modal abierto
  useEffect(() => {
    if (convertingLead && planes.length > 0 && !convertForm.tipo_membresia_id) {
      const planEncontrado = convertingLead.plan_interes_id
        ? planes.find((p) => String(p.id) === String(convertingLead.plan_interes_id)) || planes[0]
        : planes[0];

      if (planEncontrado) {
        setConvertForm((prev) => ({
          ...prev,
          tipo_membresia_id: String(planEncontrado.id),
          monto_pago: prev.monto_pago || (planEncontrado.precio ? String(planEncontrado.precio) : ""),
        }));
      }
    }
  }, [planes, convertingLead]);

  // Sincronizar clase por defecto si se terminan de cargar las clases con el modal abierto
  useEffect(() => {
    if (convertingLead && clases.length > 0 && !convertForm.grupo_id) {
      const targetGrupoId = convertingLead.grupo_id || convertingLead.grupo?.id;
      if (targetGrupoId) {
        setConvertForm((prev) => ({
          ...prev,
          grupo_id: String(targetGrupoId),
        }));
      }
    }
  }, [clases, convertingLead]);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const res = await api.getLeads({
        search: debouncedSearch,
        estado: filterEstado,
        per_page: 100,
      });

      setLeads(res.data || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (error: any) {
      console.error("Error al cargar leads:", error);
      toast({
        title: "Error al cargar prospectos",
        description: error?.message || "No se pudieron obtener los datos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEstado = async (leadId: string | number, newEstado: string) => {
    try {
      await api.updateLead(leadId, { estado: newEstado });
      toast({
        title: "Estado actualizado",
        description: `El prospecto ahora está en estado "${newEstado}".`,
      });
      loadLeads();
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error?.message || "No se pudo cambiar el estado.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = async (lead: LeadItem) => {
    const nombre = lead.nombre_completo || lead.nombre;
    if (!confirm(`¿Eliminar o descartar la consulta de "${nombre}"? El cupo del turno fijo se liberará inmediatamente para otros interesados.`)) {
      return;
    }

    try {
      await api.deleteLead(lead.id);
      toast({
        title: "Lead descartado",
        description: "El lugar en el turno fijo ha quedado libre en la landing page.",
      });
      loadLeads();
    } catch (error: any) {
      toast({
        title: "Error al descartar",
        description: error?.message || "No se pudo eliminar el prospecto.",
        variant: "destructive",
      });
    }
  };

  const openConvertModal = (lead: LeadItem) => {
    setConvertingLead(lead);

    // Si los catálogos aún no están en memoria, los cargamos
    if (planes.length === 0 || clases.length === 0) {
      loadCatalogos();
    }

    const grupoId = lead.grupo_id ? String(lead.grupo_id) : (lead.grupo?.id ? String(lead.grupo.id) : "");
    const planId = lead.plan_interes_id ? String(lead.plan_interes_id) : "";

    const planEncontrado = planes.find((p) => String(p.id) === planId) || (planId ? null : planes[0]);
    const monto = planEncontrado?.precio ? String(planEncontrado.precio) : "";

    setConvertForm({
      tipo_membresia_id: planId || (planEncontrado?.id ? String(planEncontrado.id) : ""),
      grupo_id: grupoId,
      fecha_inicio: getLocalToday(),
      registrar_pago: true,
      metodo_pago: "efectivo",
      monto_pago: monto,
      notas_admin: lead.notas_admin || "",
    });
  };

  const handlePlanChange = (planId: string) => {
    const plan = planes.find((p) => String(p.id) === planId);
    setConvertForm((prev) => ({
      ...prev,
      tipo_membresia_id: planId,
      monto_pago: plan?.precio ? String(plan.precio) : prev.monto_pago,
    }));
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    try {
      setIsConverting(true);
      const res = await api.convertLead(convertingLead.id, {
        tipo_membresia_id: convertForm.tipo_membresia_id || undefined,
        grupo_id: convertForm.grupo_id || undefined,
        fecha_inicio: convertForm.fecha_inicio,
        registrar_pago: convertForm.registrar_pago,
        metodo_pago: convertForm.registrar_pago ? convertForm.metodo_pago : undefined,
        monto_pago: convertForm.registrar_pago && convertForm.monto_pago ? Number(convertForm.monto_pago) : undefined,
        notas_admin: convertForm.notas_admin,
      });

      toast({
        title: "¡Socio dado de alta con éxito!",
        description: res.message || "Se asignó su membresía y su turno fijo mensual.",
      });

      setConvertingLead(null);
      loadLeads();
    } catch (error: any) {
      toast({
        title: "Error al convertir",
        description: error?.message || "No se pudo dar de alta al socio.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const openNotesModal = (lead: LeadItem) => {
    setEditingNotesLead(lead);
    setAdminNotes(lead.notas_admin || "");
  };

  const handleSaveNotes = async () => {
    if (!editingNotesLead) return;
    try {
      setIsSavingNotes(true);
      await api.updateLead(editingNotesLead.id, { notas_admin: adminNotes });
      toast({
        title: "Notas guardadas",
        description: "Se actualizaron las notas internas del prospecto.",
      });
      setEditingNotesLead(null);
      loadLeads();
    } catch (error: any) {
      toast({
        title: "Error al guardar notas",
        description: error?.message || "No se pudo actualizar.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const formatDias = (dias?: string) => {
    if (!dias) return "";
    const map: Record<string, string> = {
      "1": "Lun",
      "2": "Mar",
      "3": "Mié",
      "4": "Jue",
      "5": "Vie",
      "6": "Sáb",
      "0": "Dom",
      "7": "Dom",
    };
    return dias
      .split(",")
      .map((d) => map[d.trim()] || d.trim())
      .join(", ");
  };

  const getWhatsAppLink = (lead: LeadItem) => {
    const cleanPhone = lead.telefono?.replace(/\D/g, "");
    if (!cleanPhone) return null;

    const nombre = lead.nombre;
    const turnoTxt = lead.grupo
      ? `el horario de ${lead.grupo.nombre} (${formatDias(lead.grupo.dias_semana)} ${lead.grupo.hora_inicio?.slice(0, 5) || ""}hs)`
      : "empezar a entrenar";

    const msg = lead.estado === "espera"
      ? `¡Hola ${nombre}! Te escribo del box respecto a tu solicitud en la Lista de Espera para ${turnoTxt}. ¡Tenemos novedades para vos!`
      : `¡Hola ${nombre}! Te escribo del box para coordinar tu lugar en ${turnoTxt}. ¿Cómo estás?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
            Pendiente · Reserva Provisoria
          </Badge>
        );
      case "contactado":
        return (
          <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
            Contactado
          </Badge>
        );
      case "espera":
        return (
          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
            Lista de Espera
          </Badge>
        );
      case "convertido":
        return (
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            Convertido a Socio
          </Badge>
        );
      case "descartado":
        return (
          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
            Descartado · Cupo Libre
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pre-venta y Leads
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {stats.total} consultas
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión de prospectos, pre-reservas de turnos fijos y lista de espera para el inicio del Box.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => loadLeads()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Tarjetas de Métricas de Pre-venta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Consultas</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Interesados en la Landing</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Cupos Pre-reservados</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pendientes}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Descontando cupo en turnos</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Lista de Espera</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.espera}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">En horarios agotados</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Convertidos a Socios</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.convertidos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Con membresía y turno fijo</p>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, WhatsApp, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "todos", label: "Todos" },
            { id: "pendiente", label: `Pendientes (${stats.pendientes})` },
            { id: "contactado", label: `Contactados (${stats.contactados})` },
            { id: "espera", label: `Lista de Espera (${stats.espera})` },
            { id: "convertido", label: `Convertidos (${stats.convertidos})` },
            { id: "descartado", label: "Descartados" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filterEstado === tab.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={() => setFilterEstado(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabla de Leads */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando consultas de pre-venta...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold text-base">No hay consultas registradas</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {filterEstado !== "todos"
                  ? `No se encontraron prospectos con el filtro "${filterEstado}".`
                  : "Las personas que completen el formulario en la landing aparecerán automáticamente aquí."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Prospecto</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Horario / Turno Fijo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const nombre = lead.nombre_completo || `${lead.nombre} ${lead.apellido || ""}`.trim();
                  const waLink = getWhatsAppLink(lead);

                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/40 transition-colors">
                      {/* Nombre y Mensaje */}
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{nombre}</div>
                        {lead.mensaje && (
                          <p className="text-xs text-muted-foreground line-clamp-1 italic mt-0.5" title={lead.mensaje}>
                            "{lead.mensaje}"
                          </p>
                        )}
                        {lead.notas_admin && (
                          <div className="text-[11px] text-primary/90 mt-1 flex items-center gap-1">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{lead.notas_admin}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Teléfono / WhatsApp y Email */}
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{lead.telefono}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[180px]">{lead.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Turno Fijo Elegido */}
                      <TableCell>
                        {lead.grupo ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                              <span>{lead.grupo.nombre}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="h-3 w-3 text-primary shrink-0" />
                              <span>{formatDias(lead.grupo.dias_semana)}</span>
                              {lead.grupo.hora_inicio && (
                                <>
                                  <span>·</span>
                                  <Clock className="h-3 w-3 text-primary shrink-0" />
                                  <span>{lead.grupo.hora_inicio.slice(0, 5)}hs</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Horario a convenir
                          </span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <div className="space-y-1.5">
                          {getEstadoBadge(lead.estado)}

                          {lead.estado !== "convertido" && (
                            <select
                              className="block text-[11px] rounded border border-input bg-background px-1.5 py-0.5 text-muted-foreground focus:outline-none"
                              value={lead.estado}
                              onChange={(e) => handleUpdateEstado(lead.id, e.target.value)}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="contactado">Contactado</option>
                              <option value="espera">Lista de Espera</option>
                              <option value="descartado">Descartar (Liberar cupo)</option>
                            </select>
                          )}
                        </div>
                      </TableCell>

                      {/* Fecha de Registro */}
                      <TableCell className="text-xs text-muted-foreground">
                        {lead.fecha_registro
                          ? formatLocalDate(lead.fecha_registro)
                          : lead.created_at
                          ? formatLocalDate(lead.created_at)
                          : "Hoy"}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón WhatsApp */}
                          {waLink && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                              asChild
                              title="Abrir chat de WhatsApp"
                            >
                              <a href={waLink} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </Button>
                          )}

                          {/* Botón Notas */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => openNotesModal(lead)}
                            title="Ver / Editar notas"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          {/* Botón Convertir a Socio */}
                          {lead.estado !== "convertido" && (
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => openConvertModal(lead)}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Convertir</span>
                            </Button>
                          )}

                          {/* Botón Descartar */}
                          {lead.estado !== "descartado" && lead.estado !== "convertido" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteLead(lead)}
                              title="Descartar y liberar cupo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Diálogo para Convertir Lead a Socio */}
      <Dialog open={!!convertingLead} onOpenChange={(open) => !open && setConvertingLead(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-500" />
              <span>Convertir a Socio Oficial</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirmá los datos para crear el perfil activo del alumno, asociarle su membresía y asignarlo a su horario fijo mensual.
            </DialogDescription>
          </DialogHeader>

          {convertingLead && (
            <form onSubmit={handleConvertSubmit} className="space-y-4 pt-2">
              {/* Tarjeta resumen del alumno */}
              <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1 text-xs">
                <div className="font-semibold text-foreground text-sm">
                  {convertingLead.nombre_completo || `${convertingLead.nombre} ${convertingLead.apellido || ""}`}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  <span>📱 {convertingLead.telefono}</span>
                  <span>✉️ {convertingLead.email}</span>
                </div>
              </div>

              {/* Selección de Turno Fijo / Clase */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="convert_grupo" className="text-xs font-semibold">
                    Turno Fijo Mensual *
                  </Label>
                  {isLoadingCatalogos && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" /> Cargando turnos...
                    </span>
                  )}
                </div>
                <select
                  id="convert_grupo"
                  required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={convertForm.grupo_id}
                  onChange={(e) => setConvertForm({ ...convertForm, grupo_id: e.target.value })}
                >
                  <option value="">-- Seleccionar horario / turno fijo --</option>
                  {clases.map((clase) => {
                    const dias = formatDias(clase.dias_semana);
                    const hora = clase.hora_inicio ? clase.hora_inicio.slice(0, 5) : "";
                    return (
                      <option key={clase.id} value={String(clase.id)}>
                        {clase.nombre} ({dias} {hora}hs)
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Al confirmar, el alumno quedará inscripto automáticamente en los días de esta clase fija.
                </p>
              </div>

              {/* Selección de Plan Comercial / Membresía */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="convert_plan" className="text-xs font-semibold">
                    Plan de Membresía *
                  </Label>
                  {isLoadingCatalogos && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" /> Cargando planes...
                    </span>
                  )}
                </div>
                <select
                  id="convert_plan"
                  required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={convertForm.tipo_membresia_id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="">-- Seleccionar plan comercial --</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={String(plan.id)}>
                      {plan.nombre} {plan.precio ? `· $${plan.precio}` : ""} {plan.modalidad === "creditos" ? `(${plan.creditos} clases)` : "(Pase mensual)"}
                    </option>
                  ))}
                </select>
                {planes.length === 0 && !isLoadingCatalogos && (
                  <p className="text-[11px] text-amber-500">
                    No se encontraron planes cargados en el Box. Podés crear uno en Planes o continuar sin membresía inicial.
                  </p>
                )}
              </div>

              {/* Fecha de Inicio */}
              <div className="space-y-1.5">
                <Label htmlFor="fecha_inicio" className="text-xs font-semibold">
                  Fecha de Inicio de Actividades *
                </Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  required
                  value={convertForm.fecha_inicio}
                  onChange={(e) => setConvertForm({ ...convertForm, fecha_inicio: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              {/* Switch Registrar Cobro */}
              <div className="pt-2 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer" htmlFor="reg_pago">
                      Registrar cobro inicial ahora
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Genera el comprobante de pago en el módulo de Caja.
                    </p>
                  </div>
                  <Switch
                    id="reg_pago"
                    checked={convertForm.registrar_pago}
                    onCheckedChange={(checked) => setConvertForm({ ...convertForm, registrar_pago: checked })}
                  />
                </div>

                {convertForm.registrar_pago && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="metodo" className="text-xs">Medio de Pago</Label>
                      <Select
                        value={convertForm.metodo_pago}
                        onValueChange={(val) => setConvertForm({ ...convertForm, metodo_pago: val })}
                      >
                        <SelectTrigger id="metodo" className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                          <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="monto" className="text-xs">Monto Cobrado ($)</Label>
                      <Input
                        id="monto"
                        type="number"
                        min="0"
                        placeholder="Monto"
                        value={convertForm.monto_pago}
                        onChange={(e) => setConvertForm({ ...convertForm, monto_pago: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-border gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertingLead(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isConverting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Dando de alta...
                    </>
                  ) : (
                    "Confirmar Alta y Turno"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Notas Internas */}
      <Dialog open={!!editingNotesLead} onOpenChange={(open) => !open && setEditingNotesLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Notas del Prospecto</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Anotaciones internas del coach o recepción sobre este contacto.
            </DialogDescription>
          </DialogHeader>

          {editingNotesLead && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-foreground">
                {editingNotesLead.nombre_completo || editingNotesLead.nombre} ({editingNotesLead.telefono})
              </div>

              {editingNotesLead.mensaje && (
                <div className="p-2.5 rounded bg-muted/50 border text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Mensaje original:</span> {editingNotesLead.mensaje}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="admin_notes" className="text-xs">Notas internas</Label>
                <Textarea
                  id="admin_notes"
                  rows={4}
                  placeholder="Ej: Hablamos por WhatsApp, empieza la semana que viene con su pareja..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingNotesLead(null)}
                >
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? "Guardando..." : "Guardar Notas"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
