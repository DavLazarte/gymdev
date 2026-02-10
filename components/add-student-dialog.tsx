"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | number;
  classDate: string;
  className: string;
  onStudentAdded: () => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  classId,
  classDate,
  className,
  onStudentAdded,
}: AddStudentDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [socios, setSocios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSocios();
    }
  }, [open]);

  const loadSocios = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSocios({ all: true });
      setSocios(data.socios || []);
    } catch (error) {
      console.error("Error loading socios:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los socios.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (socioId: string) => {
    setIsAdding(true);
    try {
      await api.createReserva({
        id_clase_gym: String(classId),
        fecha_reserva: String(classDate),
        id_persona: String(socioId),
      });

      toast({
        title: "¡Alumno agregado!",
        description: "El alumno fue inscrito exitosamente a la clase.",
      });

      onStudentAdded();
      onOpenChange(false);
      setSearchTerm("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al agregar alumno",
        description: error.message || "No se pudo inscribir al alumno.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const filteredSocios = socios.filter(
    (s) =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dni?.includes(searchTerm),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agregar Alumno</DialogTitle>
          <DialogDescription>
            Inscribir un alumno a {className}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar socio</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nombre, email o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto border rounded-md">
              {filteredSocios.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron socios.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSocios.map((socio) => (
                    <div
                      key={socio.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={socio.foto} />
                          <AvatarFallback>
                            {socio.nombre
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {socio.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {socio.email}
                          </p>
                          {socio.planNombre &&
                            socio.planNombre !== "Sin plan" && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {socio.planNombre}
                              </Badge>
                            )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddStudent(socio.id)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Agregar
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
