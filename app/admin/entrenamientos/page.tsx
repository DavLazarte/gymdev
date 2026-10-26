"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Dumbbell,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  GripVertical,
  ArrowRight,
  UserPlus,
  Trophy,
  Calculator,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WorkoutContentRenderer } from "@/components/workout-content-renderer";
import { StudentRMsView } from "@/components/student-rms-view";
import { CoachWorkoutView } from "@/components/coach-workout-view";
import type { Clase, Socio } from "@/lib/types";

const KANBAN_COLS = [
  {
    id: "planificacion",
    label: "En Planificación",
    subtitle: "Borrador (no visible aún)",
    icon: EyeOff,
    borderClass: "border-border bg-muted/20",
  },
  {
    id: "en-curso",
    label: "En Curso",
    subtitle: "Visible para los alumnos",
    icon: Eye,
    borderClass: "border-primary/40 bg-primary/5",
  },
  {
    id: "finalizado",
    label: "Finalizado",
    subtitle: "Semanas anteriores",
    icon: Calendar,
    borderClass: "border-border bg-card",
  },
] as const;

const PLAN_COLORS = [
  { label: "Naranja", value: "#f97316" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Verde", value: "#10b981" },
  { label: "Violeta", value: "#8b5cf6" },
  { label: "Rojo", value: "#ef4444" },
  { label: "Ámbar", value: "#f59e0b" },
];

export default function EntrenamientosAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("kanban");
  const [isLoading, setIsLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.role_name === "gym_staff" ||
          parsed?.role === "coach" ||
          parsed?.rol === "coach"
        ) {
          setIsCoach(true);
        }
      }
    } catch {}
  }, []);

  const [planes, setPlanes] = useState<any[]>([]);
  const [semanas, setSemanas] = useState<any[]>([]);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [draggedSemanaId, setDraggedSemanaId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Modales de Plan
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    nombre: "",
    tipo: "clase" as "clase" | "personalizado" | "general",
    grupo_id: "todas",
    color: "#f97316",
    descripcion: "",
  });
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Asignación de alumno a plan personalizado
  const [selectedSocioForPlan, setSelectedSocioForPlan] = useState<
    Record<string, string>
  >({});

  // Modal Nueva Semana
  const [isCreateSemanaOpen, setIsCreateSemanaOpen] = useState(false);
  const [newSemanaTitulo, setNewSemanaTitulo] = useState("");
  const [newSemanaFecha, setNewSemanaFecha] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isCreatingSemana, setIsCreatingSemana] = useState(false);

  // Sheet Editor de Semana
  const [selectedSemanaId, setSelectedSemanaId] = useState<string | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [dayContentDraft, setDayContentDraft] = useState("");
  const [isSavingDia, setIsSavingDia] = useState(false);
  const [newLinkTitulo, setNewLinkTitulo] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [coachCommentText, setCoachCommentText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pestaña Ejercicios y RMs
  const [rmSocioId, setRmSocioId] = useState<string>("");
  const [rmsAlumno, setRmsAlumno] = useState<any[]>([]);
  const [newRmEjercicioId, setNewRmEjercicioId] = useState<string>("");
  const [newRmValor, setNewRmValor] = useState<string>("");
  const [isSavingRm, setIsSavingRm] = useState(false);

  // Nuevo Ejercicio en Catálogo
  const [isEjercicioDialogOpen, setIsEjercicioDialogOpen] = useState(false);
  const [ejercicioForm, setEjercicioForm] = useState({
    nombre: "",
    categoria: "Fuerza",
    unidad: "kg" as "kg" | "reps" | "segundos",
  });

  // Calculadora rápida 1RM (Epley)
  const [calcPeso, setCalcPeso] = useState("");
  const [calcReps, setCalcReps] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [tableroRes, clasesRes] = await Promise.all([
        api.getTableroEntrenamiento(),
        api.getClases().catch(() => ({ clases: [] })),

      ]);

      const planesLoaded = tableroRes.planes || [];
      setPlanes(planesLoaded);
      setSemanas(tableroRes.semanas || []);
      setEjercicios(tableroRes.ejercicios || []);
      setClases(clasesRes.clases || []);



      if (planesLoaded.length > 0 && !selectedPlanId) {
        setSelectedPlanId(String(planesLoaded[0].id));
      }


    } catch (error: any) {
      console.error("Error cargando entrenamiento:", error);
      toast({
        title: "Error",
        description:
          error.message || "No se pudo cargar el módulo de entrenamientos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (rmSocioId) {
      loadRmsSocio(rmSocioId);
    }
  }, [rmSocioId]);

  useEffect(() => {
    if ((activeTab === "rms" || activeTab === "programas") && socios.length === 0) {
      api
        .getSocios({ estado: "activo" })
        .then((res) => {
          const list = res.socios || [];
          setSocios(list);
          if (list.length > 0 && !rmSocioId) {
            setRmSocioId(String(list[0].id));
          }
        })
        .catch((err) => console.warn("Error cargando socios:", err));
    }
  }, [activeTab]);

  const loadRmsSocio = async (socioId: string) => {
    try {
      const res = await api.getRms(socioId);
      setRmsAlumno(res.rms || []);
    } catch (error) {
      console.error("Error cargando RMs:", error);
    }
  };

  const selectedPlan = planes.find(
    (p) => String(p.id) === String(selectedPlanId)
  );
  const planSemanas = semanas.filter(
    (s) => String(s.plan_id) === String(selectedPlanId)
  );
  const selectedSemana = semanas.find(
    (s) => String(s.id) === String(selectedSemanaId)
  );
  const selectedDia = selectedSemana?.dias?.[selectedDayIdx] || null;

  useEffect(() => {
    if (selectedDia) {
      setDayContentDraft(selectedDia.contenido || "");
    }
  }, [selectedDia?.id]);

  // ─── Acciones de Programas / Planes ────────────────────────────────────────

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      nombre: "",
      tipo: "clase",
      grupo_id: "todas",
      color: "#f97316",
      descripcion: "",
    });
    setIsPlanDialogOpen(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      nombre: plan.nombre,
      tipo: plan.tipo || "personalizado",
      grupo_id: plan.grupo_id ? String(plan.grupo_id) : "todas",
      color: plan.color || "#f97316",
      descripcion: plan.descripcion || "",
    });
    setIsPlanDialogOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.nombre.trim()) return;
    setIsSavingPlan(true);
    try {
      const payload = {
        nombre: planForm.nombre,
        tipo: planForm.tipo,
        grupo_id:
          planForm.tipo === "clase" && planForm.grupo_id !== "todas"
            ? planForm.grupo_id
            : null,
        color: planForm.color,
        descripcion: planForm.descripcion,
      };

      if (editingPlan) {
        const res = await api.updatePlanEntrenamiento(editingPlan.id, payload);
        setPlanes((prev) =>
          prev.map((p) =>
            String(p.id) === String(editingPlan.id) ? res.plan : p
          )
        );
        toast({
          title: "Programa actualizado",
          description: "Se guardaron los cambios del programa.",
        });
      } else {
        const res = await api.createPlanEntrenamiento(payload);
        setPlanes((prev) => [...prev, res.plan]);
        setSelectedPlanId(String(res.plan.id));
        toast({
          title: "Programa creado",
          description: "Ya podés crear semanas en el tablero Kanban.",
        });
      }
      setIsPlanDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el programa",
        variant: "destructive",
      });
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await api.deletePlanEntrenamiento(planId);
      const remaining = planes.filter((p) => String(p.id) !== String(planId));
      setPlanes(remaining);
      if (String(selectedPlanId) === String(planId)) {
        setSelectedPlanId(remaining[0] ? String(remaining[0].id) : "");
      }
      toast({
        title: "Programa eliminado",
        description: "El programa fue dado de baja.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el programa",
        variant: "destructive",
      });
    }
  };

  const handleAssignSocioToPlan = async (planId: string) => {
    const socioId = selectedSocioForPlan[planId];
    if (!socioId) return;
    try {
      const res = await api.asignarAlumnoPlan(planId, { alumno_id: socioId });
      setPlanes((prev) =>
        prev.map((p) => (String(p.id) === String(planId) ? res.plan : p))
      );
      setSelectedSocioForPlan((prev) => ({ ...prev, [planId]: "" }));
      toast({
        title: "Alumno asignado",
        description: "El socio ya puede ver este plan en su cuenta.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el socio",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSocioFromPlan = async (
    planId: string,
    alumnoId: string
  ) => {
    try {
      const res = await api.desasignarAlumnoPlan(planId, alumnoId);
      setPlanes((prev) =>
        prev.map((p) => (String(p.id) === String(planId) ? res.plan : p))
      );
      toast({
        title: "Alumno desasignado",
        description: "Se quitó al socio de este plan personalizado.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo quitar al socio",
        variant: "destructive",
      });
    }
  };

  // ─── Acciones de Semanas y Días (Kanban) ───────────────────────────────────

  const handleCreateSemana = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemanaTitulo.trim() || !selectedPlanId) return;
    setIsCreatingSemana(true);
    try {
      const res = await api.createSemana({
        plan_id: selectedPlanId,
        titulo: newSemanaTitulo,
        fecha_inicio: newSemanaFecha,
        estado: "planificacion",
      });
      setSemanas((prev) => [res.semana, ...prev]);
      setIsCreateSemanaOpen(false);
      setNewSemanaTitulo("");
      toast({
        title: "Semana creada",
        description: "Hacé clic en la tarjeta para cargar los días Lunes a Sábado.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la semana",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSemana(false);
    }
  };

  const handleMoveSemanaEstado = async (
    semanaId: string,
    nuevoEstado: string
  ) => {
    const semanaActual = semanas.find(
      (s) => String(s.id) === String(semanaId)
    );
    if (!semanaActual || semanaActual.estado === nuevoEstado) return;

    // Optimistic update
    setSemanas((prev) =>
      prev.map((s) =>
        String(s.id) === String(semanaId) ? { ...s, estado: nuevoEstado } : s
      )
    );

    try {
      const res = await api.updateSemana(semanaId, { estado: nuevoEstado });
      setSemanas((prev) =>
        prev.map((s) => (String(s.id) === String(semanaId) ? res.semana : s))
      );
      toast({
        title: "Estado actualizado",
        description:
          nuevoEstado === "en-curso"
            ? "La semana está En Curso y ya es visible para los alumnos."
            : `Semana movida a ${nuevoEstado}.`,
      });
    } catch (error: any) {
      setSemanas((prev) =>
        prev.map((s) =>
          String(s.id) === String(semanaId) ? semanaActual : s
        )
      );
      toast({
        title: "Error",
        description: error.message || "No se pudo mover la semana",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSemanaHeader = async (
    semanaId: string,
    data: { titulo?: string; fecha_inicio?: string }
  ) => {
    try {
      const res = await api.updateSemana(semanaId, data);
      setSemanas((prev) =>
        prev.map((s) => (String(s.id) === String(semanaId) ? res.semana : s))
      );
      toast({ title: "Semana actualizada" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la semana",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateSemana = async (semanaId: string) => {
    try {
      const res = await api.duplicarSemana(semanaId);
      setSemanas((prev) => [res.semana, ...prev]);
      setSelectedSemanaId(String(res.semana.id));
      toast({
        title: "Semana duplicada",
        description: "Se creó una copia completa en la columna En Planificación.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo duplicar la semana",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSemana = async (semanaId: string) => {
    try {
      await api.deleteSemana(semanaId);
      setSemanas((prev) =>
        prev.filter((s) => String(s.id) !== String(semanaId))
      );
      setSelectedSemanaId(null);
      toast({ title: "Semana eliminada" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la semana",
        variant: "destructive",
      });
    }
  };

  const handleSaveDia = async (
    diaId: string,
    data: { contenido?: string; descanso?: boolean }
  ) => {
    setIsSavingDia(true);
    try {
      const res = await api.updateDia(diaId, data);
      setSemanas((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedSemanaId)) return s;
          return {
            ...s,
            dias: s.dias.map((d: any) =>
              String(d.id) === String(diaId) ? res.dia : d
            ),
          };
        })
      );
      toast({
        title: "Día guardado",
        description: "La planificación del día se actualizó.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el día",
        variant: "destructive",
      });
    } finally {
      setIsSavingDia(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el || !selectedDia) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const textBefore = dayContentDraft.substring(0, start);
    const selected = dayContentDraft.substring(start, end) || "texto";
    const textAfter = dayContentDraft.substring(end);
    const updated = textBefore + prefix + selected + suffix + textAfter;
    setDayContentDraft(updated);
    handleSaveDia(selectedDia.id, { contenido: updated });
  };

  const handleAddLinkDia = async () => {
    if (!selectedDia || !newLinkTitulo.trim() || !newLinkUrl.trim()) return;
    try {
      const res = await api.addLinkDia(selectedDia.id, {
        titulo: newLinkTitulo,
        url: newLinkUrl,
      });
      setSemanas((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedSemanaId)) return s;
          return {
            ...s,
            dias: s.dias.map((d: any) =>
              String(d.id) === String(selectedDia.id)
                ? { ...d, links: [...(d.links || []), res.link] }
                : d
            ),
          };
        })
      );
      setNewLinkTitulo("");
      setNewLinkUrl("");
      toast({ title: "Video / Link agregado" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLinkDia = async (linkId: string) => {
    if (!selectedDia) return;
    try {
      await api.deleteLinkDia(linkId);
      setSemanas((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedSemanaId)) return s;
          return {
            ...s,
            dias: s.dias.map((d: any) =>
              String(d.id) === String(selectedDia.id)
                ? {
                    ...d,
                    links: (d.links || []).filter(
                      (l: any) => String(l.id) !== String(linkId)
                    ),
                  }
                : d
            ),
          };
        })
      );
      toast({ title: "Enlace eliminado" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendCoachComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDia || !coachCommentText.trim()) return;
    try {
      const res = await api.addComentarioDia(selectedDia.id, {
        texto: coachCommentText,
      });
      setSemanas((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedSemanaId)) return s;
          return {
            ...s,
            dias: s.dias.map((d: any) =>
              String(d.id) === String(selectedDia.id)
                ? {
                    ...d,
                    comentarios: [...(d.comentarios || []), res.comentario],
                  }
                : d
            ),
          };
        })
      );
      setCoachCommentText("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el comentario",
        variant: "destructive",
      });
    }
  };

  // ─── Acciones de Ejercicios y RMs ──────────────────────────────────────────

  const handleCreateRm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmSocioId || !newRmEjercicioId || !newRmValor) return;
    setIsSavingRm(true);
    try {
      const res = await api.createRm({
        alumno_id: rmSocioId,
        ejercicio_id: newRmEjercicioId,
        kg: Number(newRmValor),
      });
      setRmsAlumno((prev) => [res.rm, ...prev]);
      setNewRmValor("");
      toast({
        title: "Marca Personal (RM) guardada",
        description: `${res.rm.ejercicio}: ${res.rm.kg} ${res.rm.unidad}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el RM",
        variant: "destructive",
      });
    } finally {
      setIsSavingRm(false);
    }
  };

  const handleDeleteRm = async (rmId: string) => {
    try {
      await api.deleteRm(rmId);
      setRmsAlumno((prev) => prev.filter((r) => String(r.id) !== String(rmId)));
      toast({ title: "Marca eliminada" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateEjercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ejercicioForm.nombre.trim()) return;
    try {
      const res = await api.createEjercicio(ejercicioForm);
      setEjercicios((prev) => [...prev, res.ejercicio]);
      setEjercicioForm({ nombre: "", categoria: "Fuerza", unidad: "kg" });
      setIsEjercicioDialogOpen(false);
      toast({ title: "Ejercicio agregado al catálogo" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const estimated1RM =
    Number(calcPeso) > 0 && Number(calcReps) > 0
      ? Math.round(Number(calcPeso) * (1 + Number(calcReps) / 30) * 10) / 10
      : null;

  if (!isLoading && isCoach) {
    return (
      <CoachWorkoutView
        initialPlanes={planes}
        initialSemanas={semanas}
        onDataUpdate={loadAll}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Entrenamientos y Planificación
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Armá la planificación semanal para tus Clases/Turnos o para Alumnos
            Personalizados
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          {/* Botones Admin */}
          {true && (
            <Button variant="outline" onClick={openCreatePlan} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Programa / Grupo
          </Button>
          )}
          {!isCoach && selectedPlanId && (
            <Button onClick={() => setIsCreateSemanaOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva Semana
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="inline-flex w-full sm:w-auto justify-start sm:justify-center">
            <TabsTrigger value="kanban" className="gap-2 whitespace-nowrap text-xs sm:text-sm">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Tablero Semanal</span>
              <span className="hidden sm:inline">(Kanban)</span>
            </TabsTrigger>
            <TabsTrigger value="programas" className="gap-2 whitespace-nowrap text-xs sm:text-sm">
              <Users className="h-4 w-4 shrink-0" />
              <span>Programas</span>
              <span className="hidden sm:inline">y Asignación</span>
              <span>({planes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rms" className="gap-2 whitespace-nowrap text-xs sm:text-sm">
              <Trophy className="h-4 w-4 shrink-0" />
              <span>RMs</span>
              <span className="hidden sm:inline">de Alumnos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB 1: TABLERO KANBAN ────────────────────────────────────────── */}
        <TabsContent value="kanban" className="space-y-5">
          {planes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <Dumbbell className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">
                  Creá tu primer Programa de Entrenamiento
                </h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Podés crear un programa para una Clase/Turno del gimnasio (ej.
                  CrossFit General, Funcional) o un programa Personalizado para
                  alumnos específicos.
                </p>
                <Button className="mt-4" onClick={openCreatePlan}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Programa
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selector de Programa activo */}
              <div className="flex flex-wrap items-center gap-2">
                {planes.map((p) => {
                  const isSelected = String(p.id) === String(selectedPlanId);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlanId(String(p.id))}
                      className={cn(
                        "flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all",
                        isSelected
                          ? "text-white shadow-md"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        isSelected
                          ? { backgroundColor: p.color, borderColor: p.color }
                          : {}
                      }
                    >
                      <span>{p.nombre}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] uppercase",
                          isSelected
                            ? "bg-black/20 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p.tipo === "clase"
                          ? p.grupo_nombre
                            ? `Clase: ${p.grupo_nombre}`
                            : "Clases"
                          : p.tipo === "general"
                          ? "General"
                          : `${p.alumnos_asignados?.length || 0} alumnos`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Columnas Kanban */}
              <div className="grid gap-4 md:grid-cols-3">
                {KANBAN_COLS.map((col) => {
                  const colSemanas = planSemanas.filter(
                    (s) => s.estado === col.id
                  );
                  const Icon = col.icon;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCol(col.id);
                      }}
                      onDragLeave={() => setDragOverCol(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCol(null);
                        if (!isCoach && draggedSemanaId) {
                          handleMoveSemanaEstado(draggedSemanaId, col.id);
                          setDraggedSemanaId(null);
                        }
                      }}
                      className={cn(
                        "flex min-h-[160px] sm:min-h-[420px] flex-col rounded-xl border-2 transition-colors",
                        col.borderClass,
                        dragOverCol === col.id &&
                          "border-primary bg-primary/10"
                      )}
                    >
                      <div className="border-b border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            {col.label}
                          </h3>
                          <Badge variant="secondary">{colSemanas.length}</Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          {col.subtitle}
                        </p>
                      </div>

                      <div className="flex-1 space-y-3 p-3">
                        {colSemanas.length === 0 ? (
                          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                            Arrastrá una semana aquí
                          </div>
                        ) : (
                          colSemanas.map((semana) => {
                            const diasActivos = (semana.dias || []).filter(
                              (d: any) => !d.descanso
                            ).length;
                            const diasCargados = (semana.dias || []).filter(
                              (d: any) =>
                                !d.descanso &&
                                d.contenido &&
                                d.contenido.trim().length > 0
                            ).length;

                            return (
                              <Card
                                key={semana.id}
                                draggable={!isCoach}
                                onDragStart={() =>
                                  !isCoach && setDraggedSemanaId(String(semana.id))
                                }
                                onClick={() => {
                                  setSelectedSemanaId(String(semana.id));
                                  setSelectedDayIdx(0);
                                }}
                                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                              >
                                <CardContent className="p-3.5">
                                  <div className="flex items-start gap-2">
                                    {true && (
                                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                          <span
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                              backgroundColor:
                                                selectedPlan?.color || "#f97316",
                                            }}
                                          />
                                          Semana {semana.numero}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {semana.fecha_inicio}
                                        </span>
                                      </div>

                                      <h4 className="mt-1 truncate text-sm font-semibold text-foreground">
                                        {semana.titulo}
                                      </h4>

                                      <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                          {diasCargados}/{diasActivos} días con
                                          rutina
                                        </span>

                                        {/* Botones rápidos para mover de columna sin arrastrar */}
                                        <div
                                          className="flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {!isCoach && col.id === "planificacion" && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-[11px]"
                                              onClick={() =>
                                                handleMoveSemanaEstado(
                                                  String(semana.id),
                                                  "en-curso"
                                                )
                                              }
                                            >
                                              Publicar{" "}
                                              <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                          )}
                                          {!isCoach && col.id === "en-curso" && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-[11px]"
                                              onClick={() =>
                                                handleMoveSemanaEstado(
                                                  String(semana.id),
                                                  "finalizado"
                                                )
                                              }
                                            >
                                              Finalizar{" "}
                                              <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── TAB 2: PROGRAMAS Y ASIGNACIÓN (CLASES VS PERSONALIZADOS) ─────── */}
        <TabsContent value="programas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {planes.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: plan.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                        <CardDescription>
                          {plan.tipo === "clase"
                            ? plan.grupo_nombre
                              ? `Vinculado a la Clase: ${plan.grupo_nombre}`
                              : "Visible para todas las Clases / Turnos"
                            : plan.tipo === "general"
                            ? "Visible para todos los socios del gimnasio"
                            : "Planificación personalizada por alumno"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => !isCoach && openEditPlan(plan)}
                        className={cn(isCoach && "hidden")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-destructive", isCoach && "hidden")}
                        onClick={() => !isCoach && handleDeletePlan(String(plan.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {plan.descripcion && (
                    <p className="text-sm text-muted-foreground">
                      {plan.descripcion}
                    </p>
                  )}

                  {/* Asignación de socios si es personalizado (o adicional) */}
                  <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Alumnos asignados directamente (
                      {plan.alumnos_asignados?.length || 0})
                    </Label>

                    <div className={cn("flex flex-col sm:flex-row gap-2", isCoach && "hidden")}>
                      <Select
                        value={selectedSocioForPlan[plan.id] || ""}
                        onValueChange={(val) =>
                          setSelectedSocioForPlan((prev) => ({
                            ...prev,
                            [plan.id]: val,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Seleccionar socio para este plan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {socios.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-8 text-xs shrink-0 w-full sm:w-auto"
                        onClick={() => handleAssignSocioToPlan(String(plan.id))}
                        disabled={!selectedSocioForPlan[plan.id]}
                      >
                        <UserPlus className="mr-1 h-3.5 w-3.5" />
                        Asignar
                      </Button>
                    </div>

                    {plan.alumnos_asignados &&
                      plan.alumnos_asignados.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {plan.alumnos_asignados.map((al: any) => (
                            <Badge
                              key={al.id}
                              variant="secondary"
                              className="flex items-center gap-1.5 py-1"
                            >
                              <span>{al.nombre}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  !isCoach && handleRemoveSocioFromPlan(
                                    String(plan.id),
                                    String(al.id)
                                  )
                                }
                                className={cn("text-muted-foreground hover:text-destructive", isCoach && "hidden")}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── TAB 3: VER RECORDS PERSONALES (RM) DE ALUMNOS ─────────────── */}
        <TabsContent value="rms" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Consultar RMs de Alumnos</CardTitle>
                  <CardDescription>
                    El alumno carga sus propias marcas desde su portal y el
                    sistema calcula automáticamente los porcentajes en su rutina.
                    Seleccioná un alumno para ver sus marcas actuales.
                  </CardDescription>
                </div>
                <div className="w-full sm:w-72">
                  <Select value={rmSocioId} onValueChange={setRmSocioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir alumno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {socios.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StudentRMsView
                alumno={socios.find((s) => String(s.id) === String(rmSocioId))}
                rms={rmsAlumno}
                readOnly
                onRefresh={() => rmSocioId && loadRmsSocio(rmSocioId)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── SHEET EDITOR DE SEMANA (DÍAS LUNES A SÁBADO) ─────────────────── */}
      <Sheet
        open={!!selectedSemana}
        onOpenChange={(open) => !open && setSelectedSemanaId(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          {selectedSemana && (
            <>
              <div className="border-b p-5">
                <SheetHeader>
                  <SheetTitle asChild>
                    <div className="space-y-2 pr-6">
                      <Input
                        defaultValue={selectedSemana.titulo}
                        disabled={isCoach}
                        onBlur={(e) => {
                          if (!isCoach && e.target.value !== selectedSemana.titulo) {
                            handleUpdateSemanaHeader(
                              String(selectedSemana.id),
                              { titulo: e.target.value }
                            );
                          }
                        }}
                        className="text-lg font-bold"
                      />
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Inicia:</span>
                        <Input
                          type="date"
                          defaultValue={selectedSemana.fecha_inicio}
                          disabled={isCoach}
                          onBlur={(e) => {
                            if (
                              !isCoach && e.target.value !== selectedSemana.fecha_inicio
                            ) {
                              handleUpdateSemanaHeader(
                                String(selectedSemana.id),
                                { fecha_inicio: e.target.value }
                              );
                            }
                          }}
                          className="h-7 w-36 text-xs"
                        />
                        <Badge variant="outline">
                          {selectedSemana.tipoPlan?.nombre}
                        </Badge>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {/* Selector de Día (Lun a Sáb) */}
                <div className="flex flex-wrap gap-1.5">
                  {(selectedSemana.dias || []).map((d: any, idx: number) => (
                    <Button
                      key={d.id}
                      size="sm"
                      variant={selectedDayIdx === idx ? "default" : "outline"}
                      onClick={() => setSelectedDayIdx(idx)}
                    >
                      {d.nombre.slice(0, 3)}
                      {d.descanso && (
                        <span className="ml-1 text-[10px] opacity-75">(D)</span>
                      )}
                    </Button>
                  ))}
                </div>

                {selectedDia && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold">
                        {selectedDia.nombre}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="switch-descanso" className="text-xs">
                          Día de Descanso
                        </Label>
                        <Switch
                          id="switch-descanso"
                          disabled={isCoach}
                          checked={selectedDia.descanso}
                          onCheckedChange={(val) =>
                            !isCoach &&
                            handleSaveDia(String(selectedDia.id), {
                              descanso: val,
                            })
                          }
                        />
                      </div>
                    </div>

                    {selectedDia.descanso ? (
                      <div className="rounded-lg border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                        🏖️ Día marcado como descanso activo.
                      </div>
                    ) : (
                      <Tabs defaultValue={isCoach ? "preview" : "editar"} className="w-full">
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Contenido del día
                          </Label>
                          <TabsList className={cn("h-8", isCoach && "hidden")}>
                            <TabsTrigger value="editar" className="text-xs">
                              Editar
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="text-xs">
                              Vista Previa
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="editar" className={cn("space-y-2", isCoach && "hidden")}>
                          {/* Barra de herramientas Markdown igual a cross-fit-coach-app */}
                          <div className="flex w-fit flex-wrap items-center gap-1 rounded-md bg-secondary/50 p-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => insertFormatting("# ", "")}
                              title="Título Principal"
                            >
                              <span className="text-xs font-bold tracking-tighter">
                                H1
                              </span>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => insertFormatting("## ", "")}
                              title="Subtítulo"
                            >
                              <span className="text-xs font-bold tracking-tighter">
                                H2
                              </span>
                            </Button>
                            <div className="mx-1 h-4 w-px bg-border" />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => insertFormatting("**", "**")}
                              title="Negrita"
                            >
                              <Bold className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => insertFormatting("*", "*")}
                              title="Cursiva"
                            >
                              <Italic className="h-3.5 w-3.5" />
                            </Button>
                            <div className="mx-1 h-4 w-px bg-border" />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => insertFormatting("- ", "")}
                              title="Lista"
                            >
                              <List className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => {
                                const url = window.prompt(
                                  "Ingresá la URL del video o página:"
                                );
                                if (url) insertFormatting("[", `](${url})`);
                              }}
                              title="Enlace (Link)"
                            >
                              <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <Textarea
                            ref={textareaRef}
                            value={dayContentDraft}
                            onChange={(e) => setDayContentDraft(e.target.value)}
                            onBlur={() => {
                              if (dayContentDraft !== selectedDia.contenido) {
                                !isCoach &&
                            handleSaveDia(String(selectedDia.id), {
                                  contenido: dayContentDraft,
                                });
                              }
                            }}
                            placeholder={
                              "**Fuerza principal**\nBack Squat\n- 4x5 - 75%\n- 2x3 - 80% a 85%\n\n**WOD**\n21-15-9 Thrusters / Pull Ups"
                            }
                            className="min-h-[230px] font-sans text-sm leading-relaxed"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">
                              {isSavingDia
                                ? "Guardando planificación..."
                                : 'Se guarda automáticamente al salir del campo. El porcentaje (ej. Back Squat + 75%) se calcula solo según el RM de cada alumno.'}
                            </span>
                            <Button
                              size="sm"
                              onClick={() =>
                                !isCoach &&
                            handleSaveDia(String(selectedDia.id), {
                                  contenido: dayContentDraft,
                                })
                              }
                              disabled={isSavingDia}
                            >
                              Guardar Día
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="preview">
                          <div className="min-h-[230px] rounded-lg border bg-card p-4">
                            <WorkoutContentRenderer
                              contenido={dayContentDraft}
                              previewMode
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}

                    {/* Links / Videos de referencia del día */}
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-xs font-semibold">
                        Links / Videos de referencia ({selectedDia.links?.length || 0})
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Título (ej. Técnica Snatch)"
                          
                          value={newLinkTitulo}
                          onChange={(e) => setNewLinkTitulo(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          placeholder="https://youtube.com/..."
                          
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={handleAddLinkDia}
                          style={{ display: isCoach ? "none" : undefined }}
                        >
                          <LinkIcon className="mr-1 h-3.5 w-3.5" />
                          Sumar
                        </Button>
                      </div>
                      {(selectedDia.links || []).map((l: any) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between rounded border px-3 py-1.5 text-xs"
                        >
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {l.titulo}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteLinkDia(String(l.id))}
                            className={cn("text-muted-foreground hover:text-destructive", isCoach && "hidden")}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Comentarios de los alumnos en este día */}
                    <div className="space-y-2 border-t pt-4">
                      <Label className="flex items-center gap-1.5 text-xs font-semibold">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Comentarios y Feedback del Día (
                        {selectedDia.comentarios?.length || 0})
                      </Label>
                      <div className="max-h-40 space-y-2 overflow-y-auto">
                        {(selectedDia.comentarios || []).map((c: any) => (
                          <div
                            key={c.id}
                            className="rounded-lg bg-muted/50 px-3 py-2 text-xs"
                          >
                            <div className="flex justify-between font-semibold">
                              <span>{c.autor_nombre}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {c.fecha}
                              </span>
                            </div>
                            <p className="mt-0.5 text-muted-foreground">
                              {c.texto}
                            </p>
                          </div>
                        ))}
                      </div>
                      <form
                        onSubmit={handleSendCoachComment}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="Dejar nota o respuesta del coach..."
                          value={coachCommentText}
                          onChange={(e) => setCoachCommentText(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button type="submit" size="sm" className="h-8">
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              <div className={cn("flex gap-2 border-t bg-card p-4", isCoach && "hidden")}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    handleDuplicateSemana(String(selectedSemana.id))
                  }
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Duplicar Semana
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeleteSemana(String(selectedSemana.id))}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Eliminar Semana
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── MODAL CREAR / EDITAR PROGRAMA (CLASE O PERSONALIZADO) ─────────── */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlan
                ? "Editar Programa de Entrenamiento"
                : "Nuevo Programa de Entrenamiento"}
            </DialogTitle>
            <DialogDescription>
              Definí si esta planificación es para una Clase/Turno del gimnasio
              o para Alumnos Personalizados
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre del Programa *</Label>
              <Input
                placeholder="Ej: WOD Clases CrossFit, Funcional, Personalizado Competidores..."
                value={planForm.nombre}
                onChange={(e) =>
                  setPlanForm({ ...planForm, nombre: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Destino de la Planificación *</Label>
              <Select
                value={planForm.tipo}
                onValueChange={(
                  val: "clase" | "personalizado" | "general"
                ) => setPlanForm({ ...planForm, tipo: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clase">
                    Para Clases / Turnos del Gimnasio
                  </SelectItem>
                  <SelectItem value="personalizado">
                    Para Alumnos Personalizados (Asignación individual)
                  </SelectItem>
                  <SelectItem value="general">
                    General (Visible para todos los socios activos)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {planForm.tipo === "clase" && (
              <div className="space-y-1.5">
                <Label>Clase / Turno asociado</Label>
                <Select
                  value={planForm.grupo_id}
                  onValueChange={(val) =>
                    setPlanForm({ ...planForm, grupo_id: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las clases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">
                      Todas las Clases del Gimnasio
                    </SelectItem>
                    {clases.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre} ({c.hora_inicio}hs - {c.dias_semana})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Color identificatorio</Label>
              <div className="flex gap-2">
                {PLAN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setPlanForm({ ...planForm, color: c.value })
                    }
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform",
                      planForm.color === c.value
                        ? "scale-110 border-foreground"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción (Opcional)</Label>
              <Input
                placeholder="Descripción breve del objetivo..."
                value={planForm.descripcion}
                onChange={(e) =>
                  setPlanForm({ ...planForm, descripcion: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPlanDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingPlan}>
                {isSavingPlan ? "Guardando..." : "Guardar Programa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL NUEVA SEMANA ────────────────────────────────────────────── */}
      <Dialog open={isCreateSemanaOpen} onOpenChange={setIsCreateSemanaOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              Nueva Semana — {selectedPlan?.nombre}
            </DialogTitle>
            <DialogDescription>
              Se creará la semana con los 6 días (Lunes a Sábado) en la columna
              En Planificación.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSemana} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título de la Semana *</Label>
              <Input
                placeholder="Ej: Semana 1 - Bloque de Fuerza"
                value={newSemanaTitulo}
                onChange={(e) => setNewSemanaTitulo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                value={newSemanaFecha}
                onChange={(e) => setNewSemanaFecha(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateSemanaOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingSemana}>
                {isCreatingSemana ? "Creando..." : "Crear Semana"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
