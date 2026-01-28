"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Calendar,
  Ticket,
  DollarSign,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatLocalDate } from "@/lib/utils";
import type { Membresia } from "@/lib/types";
import { MembresiaDialog } from "@/components/membresia-dialog";
import { PagoDialog } from "@/components/pago-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MembresiasPage() {
  const searchParams = useSearchParams();
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState(
    searchParams.get("estado") || "todas",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);
  const [editingMembresia, setEditingMembresia] = useState<Membresia | null>(
    null,
  );
  const [selectedMembresiaForPago, setSelectedMembresiaForPago] = useState<{
    id_persona: string;
    id_membresia: string;
  } | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const estado = searchParams.get("estado");
    if (estado) {
      setEstadoFilter(estado);
    }
  }, [searchParams]);

  const loadMembresias = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.getMembresias({
        search: searchTerm,
        estado: estadoFilter,
        page: currentPage,
      });
      // response es el objeto paginado ahora
      const data = response.data || [];
      setPaginationData({
        current_page: response.current_page,
        last_page: response.last_page,
        total: response.total,
      });
      // Adaptar IDs para evitar errores de "key"
      const adaptedData = data.map((m: any) => ({
        ...m,
        id: m.id.toString(),
        socio: m.socio
          ? { ...m.socio, id: m.socio.idpersona.toString() }
          : null,
        plan: m.plan ? { ...m.plan, id: m.plan.idservicio.toString() } : null,
      }));
      setMembresias(adaptedData);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las membresías",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMembresias();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, estadoFilter, currentPage]);

  // Reset pagina al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter]);

  const handleSave = async (formData: any) => {
    try {
      if (editingMembresia) {
        await api.updateMembresia(editingMembresia.id, formData);
        toast({
          title: "Actualizado",
          description: "Membresía actualizada correctamente.",
        });
      } else {
        await api.createMembresia(formData);
        toast({
          title: "Asignado",
          description: formData.registrar_pago
            ? "Membresía asignada y pago registrado correctamente."
            : "El plan se ha asignado al socio.",
        });
      }
      loadMembresias();
      setIsDialogOpen(false);
      setEditingMembresia(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Ocurrió un error al procesar la solicitud",
      });
    }
  };

  const handleRegisterQuickPago = async (pagoData: any) => {
    try {
      await api.createPago(pagoData);
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente.",
      });
      loadMembresias();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el pago.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteMembresia(deleteId);
      toast({
        title: "Eliminado",
        description: "La membresía ha sido eliminada.",
      });
      loadMembresias();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar.",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (m: Membresia) => {
    // Usar estado calculado si existe, sino fallback a estado normal
    const estado = m.computed_status || m.estado;

    switch (estado) {
      case "activa":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            Activa
          </Badge>
        );
      case "vencida":
        return <Badge variant="destructive">Vencida</Badge>;
      case "por_vencer":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50"
          >
            Por Vencer
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Membresías</h1>
          <p className="text-sm text-muted-foreground">
            Control y seguimiento de planes asignados a socios
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Membresía
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por socio..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["todas", "activa", "vencida", "cancelada"].map((e) => (
            <Button
              key={e}
              variant={estadoFilter === e ? "default" : "outline"}
              size="sm"
              onClick={() => setEstadoFilter(e)}
              className="capitalize"
            >
              {e}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Plan / Servicio</TableHead>
                <TableHead>Vencimiento / Créditos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Cargando membresías...
                    </div>
                  </TableCell>
                </TableRow>
              ) : membresias.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay membresías que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                membresias.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.socio?.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.socio?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {m.tipo === "creditos" ? (
                          <Ticket className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Calendar className="h-4 w-4 text-orange-500" />
                        )}
                        <span>{m.plan?.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {m.fecha_fin && (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-1">
                              Vence:
                            </span>
                            {formatLocalDate(m.fecha_fin)}
                          </div>
                        )}
                        {m.tipo === "creditos" && (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-1">
                              Créditos:
                            </span>
                            {m.creditos_restantes} / {m.creditos_totales}
                          </div>
                        )}
                        {(m.saldo_pendiente ?? 0) > 0 && (
                          <div className="text-xs font-bold text-destructive flex items-center gap-1">
                            <Info className="h-3 w-3" /> Debe: $
                            {m.saldo_pendiente}
                          </div>
                        )}
                        {(m.saldo_pendiente ?? 0) === 0 &&
                          (m.monto_total ?? 0) > 0 && (
                            <div className="text-xs font-medium text-green-600">
                              Pagado
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(m)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-primary border-primary/20 hover:bg-primary/5"
                          title="Registrar Pago"
                          onClick={() => {
                            setSelectedMembresiaForPago({
                              id_persona: String(m.idpersona),
                              id_membresia: String(m.id),
                            });
                            setIsPagoDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingMembresia(m);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteId(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {paginationData && (
        <div className="flex items-center justify-between py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {paginationData.last_page} (
            {paginationData.total} registros)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((p) => Math.min(paginationData.last_page, p + 1))
            }
            disabled={currentPage === paginationData.last_page || isLoading}
          >
            Siguiente
          </Button>
        </div>
      )}

      <MembresiaDialog
        open={isDialogOpen}
        onOpenChange={(val) => {
          setIsDialogOpen(val);
          if (!val) setEditingMembresia(null);
        }}
        membresia={editingMembresia || undefined}
        onSave={handleSave}
      />

      <PagoDialog
        open={isPagoDialogOpen}
        onOpenChange={setIsPagoDialogOpen}
        onSave={handleRegisterQuickPago}
        initialSocioId={selectedMembresiaForPago?.id_persona}
        initialMembresiaId={selectedMembresiaForPago?.id_membresia}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar membresía?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el registro de membresía del socio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
