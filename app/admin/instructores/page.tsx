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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  UserPlus,
  Loader2,
  Trash2,
  UserCheck,
} from "lucide-react";
import { InstructorDialog } from "@/components/instructor-dialog";
import { InstructorDetailDialog } from "@/components/instructor-detail-dialog";
import { UserSetupDialog } from "@/components/user-setup-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Instructor } from "@/lib/types";
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

export default function InstructoresPage() {
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null
  );
  const [viewingInstructor, setViewingInstructor] = useState<Instructor | null>(
    null
  );
  const [deletingInstructor, setDeletingInstructor] =
    useState<Instructor | null>(null);
  const [setupUserInstructor, setSetupUserInstructor] =
    useState<Instructor | null>(null);
  const { toast } = useToast();

  const loadInstructores = async () => {
    try {
      setIsLoading(true);
      const data = await api.getInstructores(searchTerm);

      // Adaptar respuesta del backend a tipo Instructor si es necesario
      // Backend devuelve estructura Socio (Persona), adaptamos aquí
      const adaptedInstructores = data.map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        email: item.email,
        telefono: item.telefono,
        foto: item.foto,
        direccion: item.direccion,
        especialidades: [],
        biografia: "",
        estado:
          item.estado && item.estado.toLowerCase() === "activo"
            ? ("activo" as const)
            : ("inactivo" as const),
        clasesAsignadas: 0,
        tieneUsuario: item.tieneUsuario || !!item.userId,
        userId: item.userId,
      }));

      setInstructores(adaptedInstructores);
    } catch (error) {
      console.error("Error al cargar instructores:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar",
        description: "No se pudieron obtener los instructores.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstructores();
  }, [searchTerm]); // Recargar cuando cambia búsqueda

  const handleCreateInstructor = async (instructorData: any) => {
    try {
      await api.createInstructor(instructorData);
      await loadInstructores();
      setIsCreateDialogOpen(false);
      toast({
        title: "Instructor creado",
        description: `${instructorData.nombre} ha sido agregado exitosamente.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al crear",
        description: error.message || "No se pudo crear el instructor.",
      });
    }
  };

  const handleUpdateInstructor = async (updatedInstructor: Instructor) => {
    try {
      await api.updateInstructor(updatedInstructor.id, updatedInstructor);
      await loadInstructores();
      setEditingInstructor(null);
      toast({
        title: "Instructor actualizado",
        description: `Los datos de ${updatedInstructor.nombre} se actualizaron correctamente.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el instructor.",
      });
    }
  };

  const handleDeleteInstructor = async () => {
    if (!deletingInstructor) return;
    try {
      await api.deleteInstructor(deletingInstructor.id);
      await loadInstructores();
      setDeletingInstructor(null);
      toast({
        title: "Instructor eliminado",
        description: "El instructor ha sido eliminado correctamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el instructor.",
      });
    }
  };

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructores</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona el equipo de instructores
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Instructor
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Usuario</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : instructores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlus className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {searchTerm
                          ? "No se encontraron instructores"
                          : "No hay instructores registrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                instructores.map((instructor) => (
                  <TableRow key={instructor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={instructor.foto || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {instructor.nombre
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {instructor.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-foreground">{instructor.email}</p>
                        <p className="text-muted-foreground">
                          {instructor.telefono}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          instructor.estado === "activo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {instructor.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {instructor.tieneUsuario ? (
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
                        {!instructor.tieneUsuario && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSetupUserInstructor(instructor)}
                            title="Habilitar Acceso"
                          >
                            <UserPlus className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingInstructor(instructor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingInstructor(instructor)}
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
        </div>
      </div>

      <InstructorDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateInstructor}
      />

      <InstructorDialog
        open={!!editingInstructor}
        onOpenChange={(open) => !open && setEditingInstructor(null)}
        instructor={editingInstructor || undefined}
        onSave={handleUpdateInstructor}
      />

      {/* Viewing Dialog removed/commented as simple edit is preferred for now, or adapt later */}

      <AlertDialog
        open={!!deletingInstructor}
        onOpenChange={(open) => !open && setDeletingInstructor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al instructor{" "}
              <span className="font-medium text-foreground">
                {deletingInstructor?.nombre}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteInstructor}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserSetupDialog
        open={!!setupUserInstructor}
        onOpenChange={(open) => !open && setSetupUserInstructor(null)}
        socioId={setupUserInstructor?.id || ""}
        socioNombre={setupUserInstructor?.nombre || ""}
        socioEmail={setupUserInstructor?.email || ""}
        onSuccess={() => {
          loadInstructores();
          setSetupUserInstructor(null);
        }}
        onSave={async (id, email, password) => {
          await api.createUserForSocio(id, email, password);
          toast({
            title: "Acceso habilitado",
            description: `Se ha creado el usuario para ${setupUserInstructor?.nombre}.`,
          });
        }}
      />
    </>
  );
}
