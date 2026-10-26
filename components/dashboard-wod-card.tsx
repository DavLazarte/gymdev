"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dumbbell,
  Calendar,
  ExternalLink,
  ArrowRight,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { WorkoutContentRenderer } from "@/components/workout-content-renderer";

export function DashboardWodCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [planes, setPlanes] = useState<any[]>([]);
  const [semanas, setSemanas] = useState<any[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedSemanaId, setSelectedSemanaId] = useState<string>("");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Inicializar día de hoy
  const todayDow = new Date().getDay();
  const todayIdx = todayDow === 0 ? 0 : Math.min(5, todayDow - 1);

  useEffect(() => {
    setSelectedDayIdx(todayIdx);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getTableroEntrenamiento();
      // Incluir todos los planes disponibles en el box
      const loadedPlanes = res.planes || [];
      const loadedSemanas = res.semanas || [];
      setPlanes(loadedPlanes);
      setSemanas(loadedSemanas);

      if (loadedPlanes.length > 0) {
        setSelectedPlanId(String(loadedPlanes[0].id));
      }
    } catch (error) {
      console.error("Error cargando WOD en dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const activePlan =
    planes.find((p) => String(p.id) === String(selectedPlanId)) || planes[0];

  const planSemanas = semanas.filter(
    (s) => String(s.plan_id) === String(activePlan?.id)
  );

  const semanaEnCurso =
    planSemanas.find((s) => s.estado === "en-curso") ||
    planSemanas.find((s) => s.estado === "planificacion") ||
    planSemanas[0] ||
    null;

  const currentSemana =
    planSemanas.find((s) => String(s.id) === String(selectedSemanaId)) ||
    semanaEnCurso;

  const currentDia = currentSemana?.dias?.[selectedDayIdx] || null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-44 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Si no hay planes creados aún
  if (planes.length === 0) {
    return (
      <Card className="border-dashed p-6 text-center">
        <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <h3 className="font-semibold text-sm">Sin entrenamientos cargados</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Creá tu primera planificación semanal para ver el WOD de las clases aquí.
        </p>
        <Link href="/admin/entrenamientos">
          <Button size="sm" variant="outline" className="text-xs gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Ir a Planificación
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4 space-y-3">
        {/* Fila superior: Título y accesos */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold">
                  WOD de la Clase
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary text-[10px] font-bold uppercase"
                >
                  Vista Alumno
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {currentSemana
                  ? `Semana ${currentSemana.numero}: ${currentSemana.titulo}`
                  : "Rutina del día planificada para las clases"}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/admin/entrenamientos">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <span>Planificación completa</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Fila de Selectores: Planificación y Semana */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 pt-1 border-t border-border/40">
          {/* Selector de Plan / Programa */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Planificación:
            </span>
            <Select
              value={String(activePlan?.id || "")}
              onValueChange={(val) => {
                setSelectedPlanId(val);
                setSelectedSemanaId("");
              }}
            >
              <SelectTrigger className="h-8 text-xs min-w-[180px] sm:w-auto bg-background">
                <SelectValue placeholder="Seleccionar planificación" />
              </SelectTrigger>
              <SelectContent>
                {planes.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: p.color || "#f97316" }}
                      />
                      <span className="font-semibold">{p.nombre}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {p.tipo === "clase"
                          ? p.grupo_nombre
                            ? `(Clase: ${p.grupo_nombre})`
                            : "(Clases)"
                          : p.tipo === "general"
                          ? "(General)"
                          : "(Personalizado)"}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Semana */}
          {planSemanas.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Semana:
              </span>
              <Select
                value={String(currentSemana?.id || "")}
                onValueChange={(val) => {
                  setSelectedSemanaId(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs min-w-[170px] sm:w-auto bg-background">
                  <SelectValue placeholder="Elegir semana" />
                </SelectTrigger>
                <SelectContent>
                  {planSemanas.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      Semana {s.numero}: {s.titulo}{" "}
                      {s.estado === "en-curso" ? "(En curso)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pastillas rápidas de programa si hay más de 1 */}
          {planes.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto pt-1 sm:pt-0">
              {planes.map((p) => {
                const isSelected = String(p.id) === String(activePlan?.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(String(p.id));
                      setSelectedSemanaId("");
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all border",
                      isSelected
                        ? "text-white shadow-sm ring-1 ring-primary/40"
                        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: p.color || "#f97316",
                            borderColor: p.color || "#f97316",
                          }
                        : {}
                    }
                  >
                    {p.nombre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selector de Días L M M J V S */}
        {currentSemana && (
          <div className="grid grid-cols-6 gap-1.5 pt-2">
            {(currentSemana.dias || []).map((dia: any, idx: number) => {
              const active = selectedDayIdx === idx;
              const isToday = idx === todayIdx;
              const tieneContenido =
                dia.contenido && dia.contenido.trim().length > 0;
              return (
                <button
                  key={dia.id}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border py-2 text-xs font-bold transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-muted",
                    tieneContenido && !active && "border-primary/40 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span>{dia.nombre.slice(0, 3)}</span>
                    {isToday && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          active ? "bg-white" : "bg-primary"
                        )}
                        title="Hoy"
                      />
                    )}
                  </div>
                  <span className="text-[9px] font-normal opacity-70">
                    {dia.descanso ? "Desc" : isToday ? "Hoy" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {!currentSemana ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No hay semanas cargadas para esta planificación.
          </div>
        ) : !currentDia ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Seleccioná un día para ver la rutina.
          </div>
        ) : currentDia.descanso ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-4xl">🏖️</div>
            <h4 className="font-bold text-sm uppercase italic">
              Día de Descanso Activo
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {currentDia.contenido ||
                "Día de recuperación para los alumnos. Movilidad y estiramientos."}
            </p>
          </div>
        ) : !currentDia.contenido || currentDia.contenido.trim() === "" ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-3xl">🏋️</div>
            <h4 className="font-bold text-sm uppercase italic text-muted-foreground">
              Rutina en Preparación
            </h4>
            <p className="text-xs text-muted-foreground">
              Todavía no se cargó la rutina para el {currentDia.nombre}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                {currentDia.nombre} — {activePlan?.nombre}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {selectedDayIdx === todayIdx ? "Entrenamiento de hoy" : "Rutina programada"}
              </span>
            </div>

            <div className="rounded-lg bg-card/60 p-3 sm:p-4 border border-border/50">
              <WorkoutContentRenderer
                contenido={currentDia.contenido}
                previewMode
              />
            </div>

            {/* Links / Videos de referencia si existen */}
            {currentDia.links && currentDia.links.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t">
                {currentDia.links.map((l: any) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-xs font-medium text-primary hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{l.titulo}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
