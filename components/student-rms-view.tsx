"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  TrendingUp,
  Calendar,
  Plus,
  Loader2,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  CATEGORIAS_RM,
  isCapacidad,
} from "@/components/workout-content-renderer";

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

interface StudentRMsViewProps {
  alumno?: { id?: string; nombre?: string } | null;
  rms: any[];
  readOnly?: boolean;
  onRefresh?: () => void;
}

export function StudentRMsView({
  alumno,
  rms = [],
  readOnly = false,
  onRefresh,
}: StudentRMsViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ejercicio, setEjercicio] = useState("");
  const [kg, setKg] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("reps");
  const [customNote, setCustomNote] = useState("");

  const isTimeBased =
    ejercicio === "5km" ||
    ejercicio === "1k" ||
    (ejercicio === "Otro" && customUnit === "tiempo");

  // Group RMs by exercise and get the latest for each
  const groupedRMs = rms.reduce((acc: Record<string, any>, rm: any) => {
    if (
      !acc[rm.ejercicio] ||
      new Date(rm.fecha) >= new Date(acc[rm.ejercicio].fecha)
    ) {
      acc[rm.ejercicio] = rm;
    }
    return acc;
  }, {});

  const latestRMs: any[] = Object.values(groupedRMs);

  const resetForm = () => {
    setEditingId(null);
    setEjercicio("");
    setKg("");
    setMinutes("");
    setSeconds("");
    setCustomName("");
    setCustomUnit("reps");
    setCustomNote("");
  };

  const handleOpenEdit = (rm: any) => {
    setEditingId(String(rm.id));

    const noteMatch = rm.ejercicio.match(/\[(.*?)\]/);
    const note = noteMatch ? noteMatch[1] : "";
    setCustomNote(note);

    const cleanedName = rm.ejercicio.replace(/\[.*?\]\s*/, "");
    const isCustom =
      cleanedName.endsWith(" (Tiempo)") || cleanedName.endsWith(" (Reps)");

    if (isCustom) {
      setEjercicio("Otro");
      const isTime = cleanedName.endsWith(" (Tiempo)");
      setCustomName(
        cleanedName.replace(" (Tiempo)", "").replace(" (Reps)", "")
      );
      setCustomUnit(isTime ? "tiempo" : "reps");

      if (isTime) {
        setMinutes(Math.floor(Number(rm.kg) / 60).toString());
        setSeconds(Math.floor(Number(rm.kg) % 60).toString());
        setKg("");
      } else {
        setKg(String(rm.kg));
        setMinutes("");
        setSeconds("");
      }
    } else {
      setEjercicio(rm.ejercicio);
      setCustomName("");
      setCustomUnit("reps");
      if (rm.ejercicio === "5km" || rm.ejercicio === "1k") {
        setMinutes(Math.floor(Number(rm.kg) / 60).toString());
        setSeconds(Math.floor(Number(rm.kg) % 60).toString());
        setKg("");
      } else {
        setKg(String(rm.kg));
        setMinutes("");
        setSeconds("");
      }
    }
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      await api.deleteRm(id);
      toast.success("Registro eliminado");
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar el registro");
    }
  };

  const handleSaveRM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ejercicio) return;

    let finalValue = 0;
    let finalEjercicio = ejercicio;

    if (ejercicio === "Otro") {
      if (!customName.trim()) return;
      const suffix = customUnit === "tiempo" ? " (Tiempo)" : " (Reps)";
      const noteStr = customNote.trim() ? ` [${customNote.trim()}]` : "";
      finalEjercicio = customName.trim() + noteStr + suffix;

      if (customUnit === "tiempo") {
        if (!minutes && !seconds) return;
        finalValue =
          parseInt(minutes || "0", 10) * 60 + parseInt(seconds || "0", 10);
      } else {
        if (!kg) return;
        finalValue = parseFloat(kg);
      }
    } else {
      if (isTimeBased) {
        if (!minutes && !seconds) return;
        finalValue =
          parseInt(minutes || "0", 10) * 60 + parseInt(seconds || "0", 10);
      } else {
        if (!kg) return;
        finalValue = parseFloat(kg);
      }
    }

    if (finalValue <= 0) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.updateRm(editingId, {
          ejercicio: finalEjercicio,
          kg: finalValue,
        });
        toast.success("Registro actualizado");
      } else {
        await api.createRm({
          alumno_id: alumno?.id,
          ejercicio: finalEjercicio,
          kg: finalValue,
        });
        toast.success("Récord guardado");
      }
      setIsOpen(false);
      resetForm();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {readOnly
              ? `Records Personales${alumno?.nombre ? ` — ${alumno.nombre}` : ""}`
              : "Mis Records Personales"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {readOnly
              ? "Mejores marcas registradas por el alumno en pesas, capacidades y tiempos"
              : "Tus mejores marcas en pesas y tiempos (se usan automáticamente para calcular tus % en la rutina)"}
          </p>
        </div>

        {!readOnly && (
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) resetForm();
              setIsOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Marca
              </Button>
            </DialogTrigger>
            <DialogContent
              className="border-border/50 bg-card"
              aria-describedby={undefined}
            >
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Marca" : "Registrar Nueva Marca"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveRM} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Ejercicio / Distancia</Label>
                  <Select value={ejercicio} onValueChange={setEjercicio}>
                    <SelectTrigger className="bg-secondary/30">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIAS_RM).map(
                        ([categoria, ejercicios]) => (
                          <SelectGroup key={categoria}>
                            <SelectLabel className="font-bold text-primary">
                              {categoria}
                            </SelectLabel>
                            {ejercicios.map((e) => (
                              <SelectItem key={e} value={e}>
                                {e}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {ejercicio === "Otro" && (
                  <div className="space-y-4 border-t border-border/30 pt-3">
                    <div className="space-y-2">
                      <Label>Nombre de la capacidad / WOD</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ej: Murf, Cindy, Fran, 50 Pull ups unbroken"
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Unidad / Medición</Label>
                      <Select value={customUnit} onValueChange={setCustomUnit}>
                        <SelectTrigger className="bg-secondary/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reps">
                            Repeticiones / Carga / Cantidad
                          </SelectItem>
                          <SelectItem value="tiempo">
                            Tiempo (minutos:segundos)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nota / Carga utilizada (Opcional)</Label>
                      <Input
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Ej: con 40kg, RX, Scaled"
                        className="bg-secondary/30"
                      />
                    </div>
                  </div>
                )}

                {isTimeBased ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minutos</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Segundos</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        value={seconds}
                        onChange={(e) => setSeconds(e.target.value)}
                        className="bg-secondary/30"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>
                      {isCapacidad(ejercicio) || ejercicio === "Otro"
                        ? "Valor / Repeticiones"
                        : "Peso (kg)"}
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 85"
                      value={kg}
                      onChange={(e) => setKg(e.target.value)}
                      className="bg-secondary/30"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !ejercicio}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar Registro"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Marcas Activas
              </p>
              <p className="text-2xl font-bold">{latestRMs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Registros
              </p>
              <p className="text-2xl font-bold">{rms.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Última actualización
              </p>
              <p className="text-2xl font-bold">
                {rms.length > 0 ? rms[0].fecha : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RMs Grid */}
      {latestRMs.length === 0 ? (
        <Card className="border-dashed border-border/50 bg-card/50 py-12">
          <CardContent className="text-center">
            <Dumbbell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">
              Sin registros todavía
            </h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              {readOnly
                ? "Este alumno todavía no ha registrado marcas personales."
                : "Empezá a registrar tus marcas para seguir tu progreso y calcular automáticamente tus pesos en los entrenamientos."}
            </p>
            {!readOnly && (
              <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="rounded-full"
              >
                Registrar mi primer RM
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(CATEGORIAS_RM).map(([categoria, ejercicios]) => {
            const categoryRMs = latestRMs.filter((rm: any) => {
              if (categoria === "Capacidades") {
                return (
                  ejercicios.includes(rm.ejercicio) ||
                  rm.ejercicio?.endsWith(" (Tiempo)") ||
                  rm.ejercicio?.endsWith(" (Reps)")
                );
              }
              return ejercicios.includes(rm.ejercicio);
            });
            if (categoryRMs.length === 0) return null;

            return (
              <div key={categoria} className="space-y-3">
                <h4 className="flex items-center gap-2 border-b border-border/50 pb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="h-4 w-1.5 rounded-full bg-primary"></div>
                  {categoria}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryRMs.map((rm: any, idx: number) => {
                    const isTime =
                      rm.ejercicio === "5km" ||
                      rm.ejercicio === "1k" ||
                      rm.ejercicio?.includes(" (Tiempo)") ||
                      rm.unidad === "segundos";
                    const allForExercise = rms.filter(
                      (r: any) => r.ejercicio === rm.ejercicio
                    );
                    const historicalBest = isTime
                      ? Math.min(...allForExercise.map((r: any) => Number(r.kg)))
                      : Math.max(
                          ...allForExercise.map((r: any) => Number(r.kg))
                        );

                    const noteMatch = rm.ejercicio?.match(/\[(.*?)\]/);
                    const note = noteMatch ? noteMatch[1] : "";
                    const cleanName = (rm.ejercicio || "")
                      .replace(/\[.*?\]\s*/, "")
                      .replace(" (Tiempo)", "")
                      .replace(" (Reps)", "");

                    return (
                      <div
                        key={rm.id || idx}
                        className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/30"
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-primary/20 opacity-50 transition-opacity group-hover:opacity-100" />

                        {/* Info */}
                        <div className="space-y-1 pl-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                              {cleanName}
                            </p>
                            {note && (
                              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                                {note}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-primary">
                              {isTime ? formatTime(Number(rm.kg)) : rm.kg}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {isTime
                                ? "min"
                                : isCapacidad(rm.ejercicio)
                                ? "reps"
                                : "kg"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Mejor:{" "}
                            <span className="font-semibold text-emerald-500">
                              {isTime
                                ? formatTime(historicalBest)
                                : historicalBest}
                            </span>
                          </p>
                        </div>

                        {/* Date & Actions */}
                        <div className="flex h-full flex-col items-end justify-between space-y-2">
                          <span className="rounded bg-secondary/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {rm.fecha}
                          </span>

                          {!readOnly && (
                            <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(rm)}
                                className="rounded-md bg-secondary/80 p-1.5 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                title="Editar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(String(rm.id))}
                                className="rounded-md bg-secondary/80 p-1.5 text-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
