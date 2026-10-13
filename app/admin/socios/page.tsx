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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Eye,
  UserPlus,
  IdCard,
  UserCheck,
  UserCog,
  Dumbbell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SocioDialog } from "@/components/socio-dialog";
import { SocioDetailDialog } from "@/components/socio-detail-dialog";
import { MembresiaDialog } from "@/components/membresia-dialog";
import { UserSetupDialog } from "@/components/user-setup-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { StudentRMsView } from "@/components/student-rms-view";
import { useToast } from "@/hooks/use-toast";
import type { Socio } from "@/lib/types";
import { api } from "@/lib/api";
import { formatLocalDate } from "@/lib/utils";

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [viewingSocio, setViewingSocio] = useState<Socio | null>(null);
  const [deletingSocio, setDeletingSocio] = useState<Socio | null>(null);
  const [isMembresiaDialogOpen, setIsMembresiaDialogOpen] = useState(false);
  const [selectedSocioId, setSelectedSocioId] = useState<string | null>(null);
  const [setupUserSocio, setSetupUserSocio] = useState<Socio | null>(null);
  const [viewingRmsSocio, setViewingRmsSocio] = useState<Socio | null>(null);
  const [viewingRmsList, setViewingRmsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Cargar socios desde la API
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadSocios();
  }, [debouncedSearch, filterEstado, pagination.currentPage]);

  const loadSocios = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSocios({
        search: debouncedSearch,
        estado: filterEstado,
        page: pagination.currentPage,
        per_page: pagination.perPage,
      });

      const mappedSocios = (response?.socios || []).map((s: any) => ({
        ...s,
        id: String(s.id || s.idpersona || Math.random()),
      }));

      setSocios(mappedSocios);

      if (response?.meta) {
        setPagination((prev) => ({
          ...prev,
          currentPage: response.meta.current_page,
          lastPage: response.meta.last_page,
          total: response.meta.total,
        }));
      }
    } catch (error: any) {
      console.error("Error al cargar socios:", error);
      toast({
        title: "Error al cargar socios",
        description: error.message || "No se pudieron cargar los socios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // El filtrado ahora ocurre en el servidor
  const filteredSocios = socios;

  const handleCreateSocio = async (socio: Omit<Socio, "id">) => {
    try {
      console.log("Creando socio con datos:", socio);

      const response = await api.createSocio({
        nombre: socio.nombre,
        email: socio.email,
        telefono: socio.telefono,
        direccion: socio.direccion || "",
        fechaNacimiento: socio.fechaNacimiento || "",
        dni: socio.dni || "",
        foto: socio.foto || "",
        crearUsuario: (socio as any).crearUsuario || false,
        password: (socio as any).password || "",
      });

      console.log("Socio creado exitosamente:", response);

      // Recargar la lista
      await loadSocios();

      // Cerrar el diálogo
      setIsCreateDialogOpen(false);

      // Mostrar toast de éxito
      toast({
        title: "✅ Socio creado",
        description: `${socio.nombre} ha sido agregado exitosamente.`,
      });

      console.log("Toast mostrado");
    } catch (error: any) {
      console.error("Error al crear socio:", error);
      toast({
        title: "❌ Error al crear socio",
        description: error.message || "No se pudo crear el socio",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSocio = async (updatedSocio: Socio | Omit<Socio, "id">) => {
    if (!("id" in updatedSocio)) return;

    try {
      await api.updateSocio(updatedSocio.id, {
        nombre: updatedSocio.nombre,
        email: updatedSocio.email,
        telefono: updatedSocio.telefono,
        direccion: updatedSocio.direccion,
        fechaNacimiento: updatedSocio.fechaNacimiento,
        dni: updatedSocio.dni,
        foto: updatedSocio.foto,
        estado: updatedSocio.estado,
        password: updatedSocio.password,
      });

      await loadSocios(); // Recargar la lista
      setEditingSocio(null);

      toast({
        title: "Socio actualizado",
        description: `Los datos de ${updatedSocio.nombre} se actualizaron correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar socio",
        description: error.message || "No se pudo actualizar el socio",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSocio = async () => {
    if (deletingSocio) {
      try {
        await api.deleteSocio(deletingSocio.id);
        await loadSocios(); // Recargar la lista

        toast({
          title: "Socio eliminado",
          description: `${deletingSocio.nombre} ha sido eliminado del sistema.`,
          variant: "destructive",
        });
        setDeletingSocio(null);
      } catch (error: any) {
        toast({
          title: "Error al eliminar socio",
          description: error.message || "No se pudo eliminar el socio",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateMembresia = async (formData: any) => {
    try {
      await api.createMembresia(formData);
      toast({
        title: "Membresía asignada",
        description: "El plan se ha asignado correctamente.",
      });
      setIsMembresiaDialogOpen(false);
      loadSocios();
    } catch (error: any) {
      toast({
        title: "Error al asignar membresía",
        description: error.message || "Ocurrió un error",
        variant: "destructive",
      });
    }
  };

  const getEstadoBadge = (estado: Socio["estado"]) => {
    const variants = {
      activo: "default",
      inactivo: "secondary",
      vencido: "destructive",
      prospecto: "outline",
    };
    const labels = {
      activo: "Activo",
      inactivo: "Inactivo",
      vencido: "Vencido",
      prospecto: "Prospecto / Lead",
    };
    return (
      <Badge
        variant={variants[estado] as any}
        className={estado === "prospecto" ? "border-primary text-primary bg-primary/10 font-medium" : undefined}
      >
        {labels[estado] || estado}
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Socios</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los miembros del gimnasio
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Socio
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="prospecto">Prospectos / Leads (Landing)</SelectItem>
              <SelectItem value="inactivo">Inactivos</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-center">Usuario</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSocios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlus className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm || filterEstado !== "todos"
                          ? "No se encontraron socios"
                          : "No hay socios registrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSocios.map((socio) => (
                  <TableRow key={socio.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={socio.foto || "/placeholder.svg"} />
                          <AvatarFallback>
                            {socio.nombre
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {socio.nombre}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-foreground">{socio.email}</p>
                        <p className="text-muted-foreground">
                          {socio.telefono}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {socio.planNombre}
                      </span>
                    </TableCell>
                    <TableCell>{getEstadoBadge(socio.estado)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {socio.fechaVencimiento
                          ? formatLocalDate(socio.fechaVencimiento)
                          : "Sin membresía"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {socio.tieneUsuario ? (
                        <div
                          className="flex justify-center"
                          title="Tiene usuario asignado"
                        >
                          <UserCheck className="h-4 w-4 text-green-500" />
                        </div>
                      ) : (
                        <div
                          className="flex justify-center opacity-30"
                          title="Sin usuario"
                        >
                          <UserPlus className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            setViewingRmsSocio(socio);
                            try {
                              const res = await api.getRms(socio.id);
                              setViewingRmsList(res.rms || []);
                            } catch {
                              setViewingRmsList([]);
                            }
                          }}
                          title="Ver RMs del Alumno"
                        >
                          <Dumbbell className="h-4 w-4 text-orange-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedSocioId(socio.id);
                            setIsMembresiaDialogOpen(true);
                          }}
                          title="Asignar Membresía"
                        >
                          <IdCard className="h-4 w-4 text-primary" />
                        </Button>
                        {!socio.tieneUsuario && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSetupUserSocio(socio)}
                            title="Habilitar Acceso"
                          >
                            <UserPlus className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setViewingSocio(socio)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingSocio(socio)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeletingSocio(socio)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredSocios.length} de {pagination.total} socios
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

      <SocioDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateSocio}
      />

      <SocioDialog
        open={!!editingSocio}
        onOpenChange={(open) => !open && setEditingSocio(null)}
        socio={editingSocio || undefined}
        onSave={handleUpdateSocio}
      />

      <SocioDetailDialog
        open={!!viewingSocio}
        onOpenChange={(open) => !open && setViewingSocio(null)}
        socio={viewingSocio}
        onEdit={(socio) => {
          setViewingSocio(null);
          setEditingSocio(socio);
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingSocio}
        onOpenChange={(open) => !open && setDeletingSocio(null)}
        title="Eliminar socio"
        description={`¿Estás seguro de que deseas eliminar a ${deletingSocio?.nombre}? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteSocio}
      />

      <MembresiaDialog
        open={isMembresiaDialogOpen}
        onOpenChange={setIsMembresiaDialogOpen}
        initialSocioId={selectedSocioId || undefined}
        onSave={handleCreateMembresia}
      />

      <UserSetupDialog
        open={!!setupUserSocio}
        onOpenChange={(open) => !open && setSetupUserSocio(null)}
        socioId={setupUserSocio?.id || ""}
        socioNombre={setupUserSocio?.nombre || ""}
        socioEmail={setupUserSocio?.email || ""}
        onSuccess={loadSocios}
        onSave={async (id, email, password) => {
          await api.createUserForSocio(id, email, password);
          toast({
            title: "Acceso habilitado",
            description: `Se ha creado el usuario para ${setupUserSocio?.nombre}.`,
          });
        }}
      />

      <Dialog
        open={!!viewingRmsSocio}
        onOpenChange={(open) => !open && setViewingRmsSocio(null)}
      >
        <DialogContent
          className="max-h-[90vh] w-full max-w-[95vw] overflow-y-auto p-4 sm:max-w-5xl sm:p-6"
          aria-describedby={undefined}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>RMs de {viewingRmsSocio?.nombre}</DialogTitle>
          </DialogHeader>
          {viewingRmsSocio && (
            <StudentRMsView
              alumno={viewingRmsSocio}
              rms={viewingRmsList}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
