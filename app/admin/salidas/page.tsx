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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Search,
  DollarSign,
  TrendingDown,
  RefreshCcw,
  Loader2,
  Calendar,
} from "lucide-react";
import { SalidaDialog } from "@/components/salida-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Salida } from "@/lib/types";

export default function SalidasPage() {
  // State
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [stats, setStats] = useState({ total_historico: 0, total_mes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSalida, setEditingSalida] = useState<any>(null);

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSalidas();
  }, [tipoFilter, pagination.currentPage]);

  const loadSalidas = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSalidas({
        tipo: tipoFilter,
        search: searchTerm,
        page: pagination.currentPage,
        per_page: pagination.perPage,
      });
      setSalidas(response.salidas || []);
      setStats(response.stats || { total_historico: 0, total_mes: 0 });
      if (response.meta) {
        setPagination((prev) => ({
          ...prev,
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          total: response.meta.total,
        }));
      }
    } catch (error) {
      console.error("Error loading salidas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSalidas();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSaveSalida = async (data: any) => {
    try {
      if (editingSalida) {
        await api.updateSalida(editingSalida.id, data);
        toast({
          title: "Gasto actualizado",
          description: "El gasto se ha actualizado correctamente.",
        });
      } else {
        await api.createSalida(data);
        toast({
          title: "Gasto registrado",
          description: "El gasto se ha registrado correctamente.",
        });
      }
      loadSalidas();
      setEditingSalida(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el gasto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const openRegister = () => {
    setEditingSalida(null);
    setIsDialogOpen(true);
  };

  const openEdit = (salida: Salida) => {
    // Adapter for dialog format
    setEditingSalida(salida);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gastos (Salidas)
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de egresos, pagos a instructores y servicios
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadSalidas}
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={openRegister}>
            <Plus className="h-4 w-4" />
            Registrar Gasto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Gastos Totales
            </CardTitle>
            <CardDescription>Total histórico de egresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              $
              {stats.total_historico.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4" />
              Este Mes
            </CardTitle>
            <CardDescription>Gastos del mes en curso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              $
              {stats.total_mes.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, tipo o persona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo de Gasto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="servicio">Servicios</SelectItem>
            <SelectItem value="pago_instructor">Pago Instructor</SelectItem>
            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            <SelectItem value="insumos">Insumos</SelectItem>
            <SelectItem value="otros">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Beneficiario</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salidas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-sm text-muted-foreground">
                      No se encontraron gastos
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                salidas.map((salida) => (
                  <TableRow
                    key={salida.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openEdit(salida)}
                  >
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {new Date(salida.fecha).toLocaleDateString("es-ES", {
                          timeZone: "UTC",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {salida.descripcion}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {salida.tipo_salida?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {salida.persona ? `${salida.persona.nombre}` : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-destructive">
                        -$
                        {Number(salida.monto).toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {salidas.length} de {pagination.total} registros
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

      <SalidaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveSalida}
        initialData={editingSalida}
      />
    </div>
  );
}
