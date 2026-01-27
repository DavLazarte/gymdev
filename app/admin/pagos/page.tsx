"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Filter,
  DollarSign,
  TrendingUp,
  RefreshCcw,
  Loader2,
  Info,
} from "lucide-react";
import { PagoDialog } from "@/components/pago-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Pago } from "@/lib/types";

export default function PagosPage() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [deudaTotal, setDeudaTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
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
    loadPagos();
  }, [pagination.currentPage]);

  const loadPagos = async () => {
    setIsLoading(true);
    try {
      const response = await api.getPagos({
        search: searchTerm,
        page: pagination.currentPage,
        per_page: pagination.perPage,
      });
      setPagos(response.pagos || []);
      setDeudaTotal(response.deuda_total || 0);

      if (response.meta) {
        setPagination((prev) => ({
          ...prev,
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          total: response.meta.total,
        }));
      }
    } catch (error) {
      console.error("Error loading pagos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPagos();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleRegisterPago = async (pagoData: any) => {
    try {
      await api.createPago(pagoData);
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente.",
      });
      loadPagos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el pago.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const filteredPagos = pagos.filter((pago) => {
    const socioNombre = pago.persona?.nombre || "";
    const matchesSearch = socioNombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // For now, API doesn't have "estado" field in PagoGym, it's usually considered 'pagado' if exists
    // But we can filter if needed later
    return matchesSearch;
  });

  const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const ingresosEsteMes = pagos
    .filter((p) => {
      const d = new Date(p.fecha_pago);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de pagos y cobros vinculados a membresías
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadPagos}
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => setIsRegisterDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar Pago
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Ingresos Totales
            </CardTitle>
            <CardDescription>Pagos históricos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${totalIngresos.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pagos.length} pagos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Este Mes
            </CardTitle>
            <CardDescription>Ingresos mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${ingresosEsteMes.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos del mes actual
            </p>
          </CardContent>
        </Card>

        <Link href="/admin/membresias?estado=con_deuda" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                Deuda Pendiente
              </CardTitle>
              <CardDescription>Saldos sin cobrar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                $
                {deudaTotal.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Total por cobrar</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por socio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
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
                <TableHead>Socio</TableHead>
                <TableHead>Membresía</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-sm text-muted-foreground">
                      No se encontraron pagos
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {new Date(pago.fecha_pago).toLocaleDateString("es-ES")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {pago.persona?.nombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pago.membresia?.plan?.nombre || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        ${pago.monto}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize text-muted-foreground">
                        {pago.metodo_pago}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px] inline-block">
                        {pago.observaciones || "-"}
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
          Mostrando {pagos.length} de {pagination.total} pagos
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

      <PagoDialog
        open={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
        onSave={handleRegisterPago}
      />
    </div>
  );
}
