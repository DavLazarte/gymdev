"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Users, Clock, Lock, Unlock, UserPlus } from "lucide-react";
import { ClaseDialog } from "@/components/clase-dialog";
import { ClaseDetailDialog } from "@/components/clase-detail-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Clase } from "@/lib/types";
import { api } from "@/lib/api";

export default function ClasesPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClase, setEditingClase] = useState<Clase | null>(null);
  const [viewingClase, setViewingClase] = useState<Clase | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const { toast } = useToast();

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
    loadClases();
  }, []);

  const loadClases = async () => {
    setIsLoading(true);
    try {
      const response = await api.getClases();
      setClases(response.clases);
    } catch (error) {
      console.error("Error cargando clases:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las clases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClases = clases.filter(
    (clase) =>
      clase.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clase.coach?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    loadClases();
  };

  const handleClaseChanged = (updatedClase: Clase) => {
    setViewingClase(updatedClase);
    setClases((prev) =>
      prev.map((c) => (String(c.id) === String(updatedClase.id) ? updatedClase : c))
    );
  };

  const getCupoColor = (inscritos: number, cupoMaximo: number) => {
    const percentage = (inscritos / cupoMaximo) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-yellow-600 dark:text-yellow-500";
    return "text-primary";
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isCoach ? "Mis Clases" : "Clases y Turnos"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCoach
                ? "Visualiza tus clases asignadas y los alumnos inscriptos"
                : "Gestiona las clases abiertas por reserva y los turnos fijos del gimnasio"}
            </p>
          </div>
          {!isCoach && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva Clase
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClases.map((clase) => {
            const esTurnoFijo = clase.modalidad === "fijo";
            const ocupados = esTurnoFijo
              ? clase.inscritos_fijos ?? clase.inscritos_hoy ?? 0
              : clase.inscritos_hoy ?? 0;

            return (
              <Card
                key={clase.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setViewingClase(clase)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle>{clase.nombre}</CardTitle>
                      <CardDescription className="mt-1">
                        {clase.coach?.nombre}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        variant={
                          clase.estado === "activa" ? "default" : "secondary"
                        }
                      >
                        {clase.estado === "activa" ? "Activa" : "Cancelada"}
                      </Badge>
                      <Badge
                        variant={esTurnoFijo ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {esTurnoFijo ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Turno Fijo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> Abierta
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {clase.hora_inicio} - {clase.duracion_minutos} min
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {clase.dias_semana.split(",").map((dia) => (
                      <Badge key={dia} variant="outline" className="text-xs">
                        {dia}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={`text-sm font-medium ${getCupoColor(
                          ocupados,
                          clase.cupo_maximo
                        )}`}
                      >
                        {ocupados}/{clase.cupo_maximo}{" "}
                        {esTurnoFijo ? "fijos" : "cupos"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingClase(clase);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Alumnos ({clase.inscritos_fijos ?? 0})
                      </Button>
                      {!isCoach && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingClase(clase);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (ocupados / clase.cupo_maximo) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredClases.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-muted-foreground">
                {searchTerm
                  ? "No se encontraron clases"
                  : "No hay clases registradas"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ClaseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleSave}
      />

      <ClaseDialog
        open={!!editingClase}
        onOpenChange={(open) => !open && setEditingClase(null)}
        clase={editingClase || undefined}
        onSave={handleSave}
      />

      <ClaseDetailDialog
        open={!!viewingClase}
        onOpenChange={(open) => !open && setViewingClase(null)}
        clase={viewingClase}
        onChanged={handleClaseChanged}
        isCoach={isCoach}
        onEdit={
          isCoach
            ? undefined
            : (clase) => {
                setViewingClase(null);
                setEditingClase(clase);
              }
        }
      />
    </>
  );
}
