"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Calendar, Loader2 } from "lucide-react";
import { AsistenciaDialog } from "@/components/asistencia-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Asistencia } from "@/lib/types";
import { api } from "@/lib/api";

export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAsistencias();
  }, []);

  const loadAsistencias = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAsistencias();
      setAsistencias(data);
    } catch (error) {
      console.error("Error cargando asistencias:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAsistencia = async (data: any) => {
    try {
      await api.marcarAsistencia({
        id_persona: data.id_persona,
        id_clase_gym: data.id_clase_gym,
      });
      toast({
        title: "Asistencia registrada",
        description: "La asistencia se ha guardado correctamente.",
      });
      loadAsistencias();
      setIsRegisterDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar la asistencia.",
      });
    }
  };

  const filteredAsistencias = asistencias.filter((asistencia) =>
    asistencia.persona?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const asistenciasHoy = asistencias.filter(
    (a) =>
      new Date(a.fecha_asistencia).toISOString().split("T")[0] ===
      new Date().toISOString().split("T")[0]
  );
  const asistenciasSemana = asistencias.length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Asistencias</h1>
            <p className="text-sm text-muted-foreground">
              Registro y seguimiento de asistencia
            </p>
          </div>
          <Button onClick={() => setIsRegisterDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar Asistencia
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hoy</CardTitle>
              <CardDescription>Asistencias registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {asistenciasHoy.length}
              </div>
              <p className="text-xs text-muted-foreground">
                visitas al gimnasio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Esta Semana</CardTitle>
              <CardDescription>Total de asistencias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {asistenciasSemana}
              </div>
              <p className="text-xs text-muted-foreground">
                asistencias registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promedio Diario</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {Math.round(asistenciasSemana / 7)}
              </div>
              <p className="text-xs text-muted-foreground">
                asistencias por día
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por socio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Clase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredAsistencias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-sm text-muted-foreground">
                      No se encontraron asistencias
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsistencias.map((asistencia) => (
                  <TableRow key={asistencia.id}>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {asistencia.persona?.nombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(
                          asistencia.fecha_asistencia
                        ).toLocaleDateString("es-ES")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-primary">
                        {new Date(
                          asistencia.fecha_asistencia
                        ).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          asistencia.id_clase_gym ? "default" : "secondary"
                        }
                      >
                        {asistencia.id_clase_gym ? "Clase" : "Libre"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {asistencia.clase?.nombre || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {filteredAsistencias.length} de {asistencias.length}{" "}
            asistencias
          </span>
        </div>
      </div>

      <AsistenciaDialog
        open={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
        onSave={handleRegisterAsistencia}
      />
    </>
  );
}
