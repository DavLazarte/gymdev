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

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });

  const { toast } = useToast();

  useEffect(() => {
    loadAsistencias();
  }, [pagination.currentPage]);

  const loadAsistencias = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.getAsistencias({
        page: pagination.currentPage,
        per_page: pagination.perPage,
      });

      // Handle both old and new response formats if necessary, though now it should be standardized
      if (response.asistencias) {
        setAsistencias(response.asistencias);
        if (response.meta) {
          setPagination((prev) => ({
            ...prev,
            currentPage: response.meta.current_page,
            lastPage: response.meta.last_page,
            total: response.meta.total,
          }));
        }
      } else {
        // Fallback if API returns array directly (should not happen with new backend)
        setAsistencias(Array.isArray(response) ? response : []);
      }
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
        fecha: data.fecha,
        hora_entrada: data.hora_entrada,
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

  const todayLocal = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  const asistenciasHoy = asistencias.filter((a) => {
    const raw = String(a.fecha_asistencia || a.fecha || "");
    const datePart = raw.includes("T") ? raw.split("T")[0] : raw.slice(0, 10);
    return datePart === todayLocal;
  });
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {asistencias.length} de {pagination.total} asistencias
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: Math.max(1, prev.currentPage - 1),
                }))
              }
              disabled={pagination.currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1 mx-2 text-sm font-medium">
              <span>Página</span>
              <span className="text-foreground">{pagination.currentPage}</span>
              <span>de</span>
              <span>{pagination.lastPage}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: Math.min(prev.lastPage, prev.currentPage + 1),
                }))
              }
              disabled={
                pagination.currentPage === pagination.lastPage || isLoading
              }
            >
              Siguiente
            </Button>
          </div>
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
