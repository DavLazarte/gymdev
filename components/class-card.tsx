"use client";

import { useState, useRef } from "react";
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
  Flame,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  classSession: ClassSlot;
  showBookButton?: boolean;
  onBooked?: () => void;
  currentUserType?: "cliente" | "instructor";
}

export function ClassCard({
  classSession,
  showBookButton = false,
  onBooked,
  currentUserType,
}: ClassCardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<any>(null);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAlumnos, setShowAlumnos] = useState(false);
  const isProcessingRef = useRef(false); // Guard para evitar doble tap real
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
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
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
      isProcessingRef.current = false;
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

  const handleMarkAttendance = async () => {
    if (!selectedAlumno || isMarkingAttendance) return;
    setIsMarkingAttendance(true);
    try {
      await api.marcarAsistencia({
        id_persona: selectedAlumno.id_persona,
        id_reserva: selectedAlumno.id,
      });
      toast({
        title: "Asistencia registrada",
        description: `${selectedAlumno.nombre} ha sido marcado como presente.`,
      });
      onBooked?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar la asistencia.",
      });
    } finally {
      setIsMarkingAttendance(false);
      setShowAttendanceDialog(false);
      setSelectedAlumno(null);
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
              ) : classSession.clase_pasada ? (
                <Badge variant="secondary" className="text-xs">
                  Clase pasada
                </Badge>
              ) : isFull ? (
                <Badge variant="destructive" className="text-xs">
                  Completa
                </Badge>
              ) : classSession.puede_reservar === false ? (
                <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-500 text-xs">
                  Fuera de tiempo
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
                    },
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
                      showAlumnos && "rotate-180",
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
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col items-center gap-1 relative",
                        currentUserType === "instructor" &&
                          alumno.estado_asistencia !== "asistio" &&
                          "cursor-pointer hover:scale-105 transition-transform",
                      )}
                      onClick={() => {
                        if (
                          currentUserType === "instructor" &&
                          alumno.estado_asistencia !== "asistio"
                        ) {
                          setSelectedAlumno(alumno);
                          setShowAttendanceDialog(true);
                        }
                      }}
                    >
                      <div className="relative">
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
                        {alumno.estado_asistencia === "asistio" && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-background">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                        {alumno.racha_actual && alumno.racha_actual > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-orange-100 dark:bg-orange-950 rounded-full px-1 border border-orange-200 dark:border-orange-800 flex items-center gap-0.5">
                            <Flame className="h-2 w-2 text-orange-500 fill-orange-500" />
                            <span className="text-[7px] font-bold text-orange-600 dark:text-orange-400">
                              {alumno.racha_actual}
                            </span>
                          </div>
                        )}
                      </div>
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
                    disabled={
                      isFull ||
                      classSession.puede_reservar === false ||
                      classSession.clase_pasada === true ||
                      (isBooked && !isDeleting) ||
                      isBooking
                    }
                    onClick={() => setShowDialog(true)}
                    className={cn(
                      "h-8",
                      isBooked &&
                        "bg-primary/20 text-primary hover:bg-primary/20 border-primary/20",
                    )}
                  >
                    {isBooking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isBooked ? (
                      <>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Reservada
                      </>
                    ) : classSession.clase_pasada ? (
                      "Clase pasada"
                    ) : isFull ? (
                      "No disponible"
                    ) : classSession.puede_reservar === false ? (
                      "Fuera de tiempo"
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
                },
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
      <AlertDialog
        open={showAttendanceDialog}
        onOpenChange={setShowAttendanceDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar Asistencia</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas marcar a <strong>{selectedAlumno?.nombre}</strong> como
              presente en la clase de <strong>{classSession.nombre}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingAttendance}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleMarkAttendance();
              }}
              disabled={isMarkingAttendance}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarkingAttendance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Asistencia"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
