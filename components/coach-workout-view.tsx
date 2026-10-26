"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dumbbell,
  Trophy,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WorkoutContentRenderer } from "@/components/workout-content-renderer";
import { StudentRMsView } from "@/components/student-rms-view";
import type { Socio } from "@/lib/types";

interface CoachWorkoutViewProps {
  initialPlanes?: any[];
  initialSemanas?: any[];
  onDataUpdate?: () => void;
}

export function CoachWorkoutView({
  initialPlanes = [],
  initialSemanas = [],
  onDataUpdate,
}: CoachWorkoutViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rutina");
  const [isLoading, setIsLoading] = useState(false);

  const [planes, setPlanes] = useState<any[]>(initialPlanes);
  const [semanas, setSemanas] = useState<any[]>(initialSemanas);
  const [socios, setSocios] = useState<Socio[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedSemanaId, setSelectedSemanaId] = useState<string>("");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Comentarios del Coach
  const [coachCommentText, setCoachCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Consulta de RMs de alumnos
  const [rmSocioId, setRmSocioId] = useState<string>("");
  const [rmsAlumno, setRmsAlumno] = useState<any[]>([]);
  const [isLoadingRms, setIsLoadingRms] = useState(false);

  // Inicializar día de hoy (0=Dom -> 0 Lun, 1 Lun -> 0 Lun, 2 Mar -> 1 Mar, etc.)
  useEffect(() => {
    const dow = new Date().getDay();
    const idx = dow === 0 ? 0 : Math.min(5, dow - 1);
    setSelectedDayIdx(idx);
  }, []);

  // Actualizar planes y semanas cuando cambien desde props
  useEffect(() => {
    if (initialPlanes.length > 0) {
      setPlanes(initialPlanes);
      if (!selectedPlanId) {
        setSelectedPlanId(String(initialPlanes[0].id));
      }
    }
  }, [initialPlanes]);

  useEffect(() => {
    if (initialSemanas.length > 0) {
      setSemanas(initialSemanas);
    }
  }, [initialSemanas]);

  // Si no tenemos datos iniciales, cargarlos del backend
  useEffect(() => {
    if (planes.length === 0) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTableroEntrenamiento();
      const loadedPlanes = res.planes || [];
      const loadedSemanas = res.semanas || [];
      setPlanes(loadedPlanes);
      setSemanas(loadedSemanas);
      if (loadedPlanes.length > 0 && !selectedPlanId) {
        setSelectedPlanId(String(loadedPlanes[0].id));
      }
    } catch (err: any) {
      console.error("Error cargando entrenamientos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar lista de socios solo al entrar al tab de RMs
  useEffect(() => {
    if (activeTab === "rms" && socios.length === 0) {
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

  // Cargar RMs del socio seleccionado
  useEffect(() => {
    if (rmSocioId) {
      loadRmsSocio(rmSocioId);
    }
  }, [rmSocioId]);

  const loadRmsSocio = async (socioId: string) => {
    setIsLoadingRms(true);
    try {
      const res = await api.getRms(socioId);
      setRmsAlumno(res.rms || []);
    } catch (error) {
      console.error("Error cargando RMs:", error);
    } finally {
      setIsLoadingRms(false);
    }
  };

  // El coach solo ve las programaciones de clases y generales del box (no planes personalizados)
  const planesClase = planes.filter((p) => p.tipo !== "personalizado");

  const activePlanId = selectedPlanId || (planesClase[0] ? String(planesClase[0].id) : "");

  // Filtrar semanas del plan activo
  const planSemanas = semanas.filter(
    (s) => String(s.plan_id) === String(activePlanId)
  );

  // Semana activa: seleccionada o por defecto la que está en curso
  const semanaEnCurso =
    planSemanas.find((s) => s.estado === "en-curso") ||
    planSemanas.find((s) => s.estado === "planificacion") ||
    planSemanas[0] ||
    null;

  const currentSemana =
    planSemanas.find((s) => String(s.id) === String(selectedSemanaId)) ||
    semanaEnCurso;

  const currentDia = currentSemana?.dias?.[selectedDayIdx] || null;

  // Enviar comentario de feedback del coach
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDia || !coachCommentText.trim() || isSendingComment) return;

    setIsSendingComment(true);
    try {
      const res = await api.addComentarioDia(currentDia.id, {
        texto: coachCommentText,
      });

      setSemanas((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(currentSemana?.id)) return s;
          return {
            ...s,
            dias: s.dias.map((d: any) =>
              String(d.id) === String(currentDia.id)
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
      toast({ title: "Comentario publicado en la rutina" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSendingComment(false);
    }
  };

  if (isLoading && planes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Encabezado limpio para el Coach */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Planificación de Entrenamientos
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Programación semanal en curso y rutina de las clases
        </p>
      </div>

      {/* Tabs principales: Rutina de la semana vs RMs de alumnos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="rutina" className="gap-1.5 text-xs sm:text-sm">
            <Dumbbell className="h-4 w-4" />
            Rutina de la Semana
          </TabsTrigger>
          <TabsTrigger value="rms" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4" />
            RMs de Alumnos
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: RUTINA SEMANAL (VISTA IDÉNTICA A LA DEL ALUMNO) ────────── */}
        <TabsContent value="rutina" className="space-y-4">
          {/* Selector de Plan / Programa de Clase si hay más de 1 */}
          {planesClase.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {planesClase.map((p) => {
                const isSelected = String(p.id) === String(activePlanId);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPlanId(String(p.id));
                      setSelectedSemanaId("");
                    }}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                      isSelected
                        ? "text-white shadow-sm ring-2 ring-primary/40"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    style={
                      isSelected
                        ? { backgroundColor: p.color || "#f97316" }
                        : {}
                    }
                  >
                    {p.nombre}
                  </button>
                );
              })}
            </div>
          )}

          {!currentSemana ? (
            <Card>
              <CardContent className="py-14 text-center text-sm text-muted-foreground">
                <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">
                  No hay semanas en curso actualmente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  El administrador publicará la planificación de la semana en breve.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Card de la Semana */}
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            currentSemana.estado === "en-curso"
                              ? "bg-primary/20 text-primary hover:bg-primary/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {currentSemana.estado === "en-curso"
                            ? "En Curso"
                            : currentSemana.estado}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Semana {currentSemana.numero} • {currentSemana.fecha_inicio}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-foreground">
                        {currentSemana.titulo}
                      </h2>
                    </div>

                    {/* Selector de otra semana del plan (si hay más de 1) */}
                    {planSemanas.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Semana:
                        </span>
                        <Select
                          value={String(currentSemana.id)}
                          onValueChange={(val) => {
                            setSelectedSemanaId(val);
                            setSelectedDayIdx(0);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {planSemanas.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                Sem. {s.numero}: {s.titulo}{" "}
                                {s.estado === "en-curso" ? "⭐" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Selector de Días L M M J V S */}
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    {(currentSemana.dias || []).map((dia: any, idx: number) => {
                      const active = selectedDayIdx === idx;
                      const tieneContenido =
                        dia.contenido && dia.contenido.trim().length > 0;
                      return (
                        <button
                          key={dia.id}
                          onClick={() => setSelectedDayIdx(idx)}
                          className={cn(
                            "relative flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "border-border bg-card text-muted-foreground hover:bg-muted",
                            tieneContenido &&
                              !active &&
                              "border-primary/40 text-foreground"
                          )}
                        >
                          <span>{dia.nombre.slice(0, 3)}</span>
                          {dia.descanso && (
                            <span className="text-[10px] opacity-75 font-normal">
                              Desc
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Card de Rutina del Día Seleccionado */}
              {currentDia && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                    <div>
                      <CardTitle className="text-lg">
                        {currentDia.nombre}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {currentDia.descanso
                          ? "Día de Recuperación Activa"
                          : "Sesión de Entrenamiento"}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-5">
                    {currentDia.descanso ? (
                      <div className="space-y-3 py-10 text-center">
                        <div className="text-5xl">🏖️</div>
                        <h3 className="text-xl font-bold uppercase italic">
                          Descanso Activo
                        </h3>
                        <p className="mx-auto max-w-md text-sm text-muted-foreground">
                          {currentDia.contenido ||
                            "Día de recuperación. Movilidad, estiramientos y descanso para los alumnos."}
                        </p>
                      </div>
                    ) : !currentDia.contenido ||
                      currentDia.contenido.trim() === "" ? (
                      <div className="space-y-2 py-10 text-center">
                        <div className="text-4xl">🏋️</div>
                        <h3 className="text-base font-bold uppercase italic text-muted-foreground">
                          Rutina en Preparación
                        </h3>
                        <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                          Todavía no se ha cargado el entrenamiento para este día.
                        </p>
                      </div>
                    ) : (
                      <WorkoutContentRenderer
                        contenido={currentDia.contenido}
                        previewMode
                      />
                    )}

                    {/* Links / Videos de referencia */}
                    {currentDia.links && currentDia.links.length > 0 && (
                      <div className="space-y-3 border-t pt-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Videos y Enlaces de Referencia
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {currentDia.links.map((l: any) => {
                            const ytMatch = l.url?.match(
                              /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/
                            );
                            const ytId = ytMatch ? ytMatch[1] : null;

                            if (ytId) {
                              return (
                                <div
                                  key={l.id}
                                  className="overflow-hidden rounded-xl border border-border/50 bg-card/50"
                                >
                                  <div className="relative aspect-video w-full bg-black">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${ytId}`}
                                      title={l.titulo}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="h-full w-full border-0"
                                    />
                                  </div>
                                  <div className="p-3">
                                    <span className="block text-sm font-bold text-foreground">
                                      {l.titulo}
                                    </span>
                                    <a
                                      href={l.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block truncate text-xs text-primary hover:underline"
                                    >
                                      Abrir en YouTube
                                    </a>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <a
                                key={l.id}
                                href={l.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col rounded-xl border border-border/50 bg-card/50 p-3 transition-all hover:border-primary/50"
                              >
                                <span className="text-sm font-bold text-foreground">
                                  {l.titulo}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {l.url}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Feedback y Comentarios del Día */}
                    <div className="space-y-2.5 border-t pt-4">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        Feedback y Comentarios del Día
                      </p>
                      {(currentDia.comentarios || []).length === 0 ? (
                        <p className="py-4 text-center text-xs italic text-muted-foreground">
                          Sin comentarios todavía. Podés dejar una nota para la
                          clase o los alumnos.
                        </p>
                      ) : (
                        (currentDia.comentarios || []).map((c: any) => (
                          <div
                            key={c.id}
                            className={cn(
                              "rounded-2xl p-3 text-xs",
                              c.autor_rol === "coach" ||
                                c.autor_rol === "gym_admin"
                                ? "ml-4 border border-primary/20 bg-primary/10"
                                : "mr-4 bg-muted/50"
                            )}
                          >
                            <div className="mb-1 flex justify-between text-[10px] font-bold uppercase opacity-70">
                              <span>{c.autor_nombre}</span>
                              <span>{c.fecha}</span>
                            </div>
                            <p className="text-foreground/90">{c.texto}</p>
                          </div>
                        ))
                      )}
                      <form
                        onSubmit={handleSendComment}
                        className="flex gap-2 pt-1"
                      >
                        <Input
                          placeholder="Dejar una nota o comentario como coach..."
                          value={coachCommentText}
                          onChange={(e) => setCoachCommentText(e.target.value)}
                          className="h-9 text-xs"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSendingComment}
                          className="h-9 px-3"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ─── TAB 2: CONSULTAR RMs DE ALUMNOS ───────────────────────────────── */}
        <TabsContent value="rms" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Consultar Marcas Personales (RM)</CardTitle>
                  <CardDescription>
                    Seleccioná un alumno para consultar sus récords y marcas
                    actuales.
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
              {isLoadingRms ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <StudentRMsView
                  alumno={socios.find(
                    (s) => String(s.id) === String(rmSocioId)
                  )}
                  rms={rmsAlumno}
                  readOnly
                  onRefresh={() => rmSocioId && loadRmsSocio(rmSocioId)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
