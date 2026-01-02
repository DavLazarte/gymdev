"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { ClassSlot } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Users,
  User,
  CheckCircle2,
  Loader2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  classSession: ClassSlot;
  showBookButton?: boolean;
  onBooked?: () => void;
}

export function ClassCard({
  classSession,
  showBookButton = false,
  onBooked,
}: ClassCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAlumnos, setShowAlumnos] = useState(false);
  const { toast } = useToast();

  const parseDateToLocal = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const isFull = classSession.disponibles === 0;
  const isLowAvailability =
    classSession.disponibles > 0 && classSession.disponibles <= 3;
  const isBooked = classSession.reservada;

  const handleBook = async () => {
    setIsBooking(true);
    try {
      await api.createReserva({
        id_clase_gym: classSession.clase_id,
        fecha_reserva: classSession.fecha,
      });
      toast({
        title: "¡Reserva confirmada!",
        description: `Te has anotado en ${classSession.nombre}.`,
      });
      onBooked?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al reservar",
        description: error.message || "No se pudo procesar tu reserva.",
      });
    } finally {
      setIsBooking(false);
      setShowDialog(false);
    }
  };

  const handleCancel = async () => {
    if (!classSession.reserva_id) return;
    setIsDeleting(true);
    try {
      await api.cancelReserva(classSession.reserva_id);
      toast({
        title: "Reserva cancelada",
        description: `Ya no estás anotado en ${classSession.nombre}.`,
      });
      onBooked?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar la reserva.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={cn("transition-all", isFull && !isBooked && "opacity-60")}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {classSession.nombre}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {classSession.estado_clase}
                </Badge>
              </div>
              {isBooked ? (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Inscripto
                </Badge>
              ) : isFull ? (
                <Badge variant="destructive" className="text-xs">
                  Completa
                </Badge>
              ) : isLowAvailability ? (
                <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-500 text-xs">
                  {classSession.disponibles} lugares
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Disponible
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{classSession.instructor}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{classSession.duracion} min</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {parseDateToLocal(classSession.fecha).toLocaleDateString(
                    "es-ES",
                    {
                      day: "numeric",
                      month: "short",
                    }
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <button
                  onClick={() => setShowAlumnos(!showAlumnos)}
                  className="flex items-center gap-1 hover:text-primary transition-colors text-xs"
                >
                  {classSession.inscritos}/{classSession.capacidad} inscritos
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      showAlumnos && "rotate-180"
                    )}
                  />
                </button>
              </div>
            </div>

            {showAlumnos && classSession.alumnos.length > 0 && (
              <div className="bg-muted/50 rounded-md p-2 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase px-1">
                  En clase:
                </p>
                <div className="flex flex-wrap gap-2">
                  {classSession.alumnos.map((alumno, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-border">
                        <AvatarImage
                          src={alumno.foto}
                          alt={alumno.nombre}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {alumno.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground max-w-[60px] truncate text-center leading-tight">
                        {alumno.nombre.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Hora: </span>
                <span className="font-semibold text-foreground">
                  {classSession.hora}
                </span>
              </div>
              {showBookButton && (
                <div className="flex gap-2">
                  {isBooked && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8 px-2"
                      onClick={handleCancel}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={isFull || (isBooked && !isDeleting) || isBooking}
                    onClick={() => setShowDialog(true)}
                    className={cn(
                      "h-8",
                      isBooked &&
                        "bg-primary/20 text-primary hover:bg-primary/20 border-primary/20"
                    )}
                  >
                    {isBooking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isBooked ? (
                      <>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Reservada
                      </>
                    ) : isFull ? (
                      "No disponible"
                    ) : (
                      "Reservar"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas reservar la clase de{" "}
              <strong>{classSession.nombre}</strong> el{" "}
              {parseDateToLocal(classSession.fecha).toLocaleDateString(
                "es-ES",
                {
                  day: "numeric",
                  month: "long",
                }
              )}{" "}
              a las {classSession.hora}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBooking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBook();
              }}
              disabled={isBooking}
            >
              Confirmar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
