"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dumbbell,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Send,
  Trophy,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useRequireRole } from "@/hooks/useRequireRole";
import { useToast } from "@/hooks/use-toast";
import { WorkoutContentRenderer } from "@/components/workout-content-renderer";
import { StudentRMsView } from "@/components/student-rms-view";

export default function ClientEntrenamientoPage() {
  const { user, loading: roleLoading } = useRequireRole("gym_socio");
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [alumnoInfo, setAlumnoInfo] = useState<any>(null);
  const [planes, setPlanes] = useState<any[]>([]);
  const [semanas, setSemanas] = useState<any[]>([]);
  const [rms, setRms] = useState<any[]>([]);
  const [progresoDias, setProgresoDias] = useState<string[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  const [commentText, setCommentText] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isTogglingDia, setIsTogglingDia] = useState(false);

  useEffect(() => {
    const dow = new Date().getDay(); // 0=Dom, 1=Lun .. 6=Sab
    const idx = dow === 0 ? 0 : Math.min(5, dow - 1);
    setSelectedDayIdx(idx);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const miPlanRes = await api.getMiPlanEntrenamiento();

      const planesLoaded = miPlanRes.planes || [];
      const semanasLoaded = miPlanRes.semanas || [];
      setAlumnoInfo(miPlanRes.alumno || null);
      setPlanes(planesLoaded);
      setSemanas(semanasLoaded);
      setRms(miPlanRes.rms || []);
      setProgresoDias(miPlanRes.progreso_dias || []);

      if (planesLoaded.length > 0 && !selectedPlanId) {
        setSelectedPlanId(String(planesLoaded[0].id));
      }
    } catch (error) {
      console.error("Error cargando mi plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
  };

  // El alumno SOLO ve la semana que está "en-curso" del plan seleccionado
  const planSemanas = semanas.filter(
    (s) => String(s.plan_id) === String(selectedPlanId)
  );
  const selectedSemana =
    planSemanas.find((s) => s.estado === "en-curso") || planSemanas[0] || null;
  const selectedDia = selectedSemana?.dias?.[selectedDayIdx] || null;
  const isCompleted = selectedDia
    ? progresoDias.includes(String(selectedDia.id))
    : false;

  const handleToggleComplete = async () => {
    if (!selectedDia) return;
    setIsTogglingDia(true);
    try {
      const res = await api.toggleProgresoDia(String(selectedDia.id));
      if (res.completado) {
        setProgresoDias((prev) => [...prev, String(selectedDia.id)]);
      } else {
        setProgresoDias((prev) =>
          prev.filter((id) => id !== String(selectedDia.id))
        );
      }
      toast({
        title: res.completado
          ? "¡Entrenamiento completado!"
          : "Entrenamiento desmarcado",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTogglingDia(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDia || !commentText.trim() || !selectedSemana) return;
    setIsSendingComment(true);
    try {
      const res = await api.addComentarioDia(String(selectedDia.id), {
        texto: commentText,
      });
      setSemanas((prev) =>
        prev.map((s) => {
          if (String(s.id) !== String(selectedSemana.id)) return s;
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
      setCommentText("");
      toast({ title: "Comentario enviado al coach" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingComment(false);
    }
  };

  if (roleLoading || (user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground md:pb-6">
      <AppHeader userName={user.name} userRole="client" />

      <main className="container mx-auto max-w-4xl space-y-5 p-4">
        <div className="flex items-center gap-3">
          <Link href="/client">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mi Entrenamiento
            </h1>
            <p className="text-xs text-muted-foreground">
              Tu programación semanal en curso y tus records personales (RM)
            </p>
          </div>
        </div>

        <Tabs defaultValue="rutina" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rutina" className="gap-1.5">
              <Dumbbell className="h-4 w-4" />
              Rutina de la Semana
            </TabsTrigger>
            <TabsTrigger value="rms" className="gap-1.5">
              <Trophy className="h-4 w-4" />
              Mis Records (RM)
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB RUTINA SEMANAL (SOLO SEMANA EN CURSO) ───────────────── */}
          <TabsContent value="rutina" className="space-y-4">
            {planes.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {planes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlanChange(String(p.id))}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                      String(selectedPlanId) === String(p.id)
                        ? "text-white shadow"
                        : "bg-muted text-muted-foreground"
                    )}
                    style={
                      String(selectedPlanId) === String(p.id)
                        ? { backgroundColor: p.color }
                        : {}
                    }
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            )}

            {!selectedSemana ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No hay semanas en curso cargadas para este plan actualmente.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[10px] uppercase">
                            En Curso
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Semana {selectedSemana.numero} •{" "}
                            {selectedSemana.fecha_inicio}
                          </span>
                        </div>
                        <h2 className="text-xl font-black uppercase italic tracking-tight">
                          {selectedSemana.titulo}
                        </h2>
                      </div>
                    </div>

                    {/* Botones de Días L M M J V S */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {(selectedSemana.dias || []).map(
                        (dia: any, idx: number) => {
                          const done = progresoDias.includes(String(dia.id));
                          const active = selectedDayIdx === idx;
                          return (
                            <button
                              key={dia.id}
                              onClick={() => setSelectedDayIdx(idx)}
                              className={cn(
                                "relative flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all",
                                active
                                  ? "border-primary bg-primary text-primary-foreground shadow"
                                  : "border-border bg-card text-muted-foreground hover:bg-muted",
                                done &&
                                  !active &&
                                  "border-primary/40 text-primary"
                              )}
                            >
                              <span>{dia.nombre.slice(0, 3)}</span>
                              {done && (
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-current" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>

                {selectedDia && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                      <div>
                        <CardTitle className="text-lg">
                          {selectedDia.nombre}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {selectedDia.descanso
                            ? "Día de Recuperación"
                            : "Sesión de Entrenamiento"}
                        </p>
                      </div>
                      {!selectedDia.descanso && (
                        <Button
                          size="sm"
                          variant={isCompleted ? "default" : "outline"}
                          onClick={handleToggleComplete}
                          disabled={isTogglingDia}
                          className="rounded-full"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          {isCompleted ? "Completado" : "Marcar Completado"}
                        </Button>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-6 p-5">
                      {selectedDia.descanso ? (
                        <div className="space-y-3 py-10 text-center">
                          <div className="text-5xl">🏖️</div>
                          <h3 className="text-xl font-bold uppercase italic">
                            Descanso Activo
                          </h3>
                          <p className="mx-auto max-w-md text-sm text-muted-foreground">
                            {selectedDia.contenido ||
                              "Aprovechá para recuperar. Movilidad, estiramientos y buena alimentación."}
                          </p>
                        </div>
                      ) : !selectedDia.contenido ||
                        selectedDia.contenido.trim() === "" ? (
                        <div className="space-y-2 py-10 text-center">
                          <div className="text-4xl">🏋️</div>
                          <h3 className="text-base font-bold uppercase italic text-muted-foreground">
                            Rutina en Preparación
                          </h3>
                          <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                            El coach todavía no ha cargado el entrenamiento para
                            este día.
                          </p>
                        </div>
                      ) : (
                        <WorkoutContentRenderer
                          contenido={selectedDia.contenido}
                          rms={rms}
                        />
                      )}

                      {/* Links / Videos embebidos igual que cross-fit-coach-app */}
                      {selectedDia.links && selectedDia.links.length > 0 && (
                        <div className="space-y-3 border-t pt-4">
                          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Links y Videos
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedDia.links.map((l: any) => {
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

                      {/* Comentarios del Día */}
                      <div className="space-y-2.5 border-t pt-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          Feedback del Día
                        </p>
                        {(selectedDia.comentarios || []).length === 0 ? (
                          <p className="py-4 text-center text-xs italic text-muted-foreground">
                            Sin comentarios todavía. ¿Cómo te fue hoy?
                          </p>
                        ) : (
                          (selectedDia.comentarios || []).map((c: any) => (
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
                            placeholder="Escribí un comentario..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="h-9"
                            disabled={isSendingComment || !commentText.trim()}
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

          {/* ─── TAB MIS RECORDS PERSONALES (RM) ─────────────────────────── */}
          <TabsContent value="rms" className="space-y-4">
            <StudentRMsView
              alumno={alumnoInfo}
              rms={rms}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav role="client" />
    </div>
  );
}
