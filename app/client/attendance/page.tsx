"use client";

import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, Calendar, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
  // Estado local para los datos reales
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargamos perfil y asistencias en paralelo
      const [profileData, attendanceData] = await Promise.all([
        api.getProfile(),
        api.getAsistencias(),
      ]);

      setUser(profileData.socio);
      setAttendances(attendanceData);
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el historial de asistencia",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <AppHeader
        userName={user.nombre}
        userRole="Socio"
        userImage={user.foto}
      />

      <main className="container mx-auto max-w-2xl space-y-6 p-4">
        <div className="flex items-center gap-3">
          <Link href="/client">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mi Asistencia
            </h1>
            <p className="text-sm text-muted-foreground">
              Historial de visitas al gimnasio
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Asistencia</CardTitle>
            <CardDescription>
              Registro de tus visitas al gimnasio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-foreground">
                      {attendance.clase
                        ? attendance.clase.nombre
                        : "Entrada General"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {/* Modality fallback */}
                      {attendance.clase
                        ? `Clase de ${attendance.clase.nombre}`
                        : "Acceso Libre"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(
                          attendance.fecha_asistencia
                        ).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(
                          attendance.fecha_asistencia
                        ).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {attendances.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Sin asistencias registradas
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tus visitas al gimnasio aparecerán aquí una vez que asistas a una
              clase.
            </p>
          </div>
        )}
      </main>

      <MobileNav role="client" />
    </div>
  );
}
