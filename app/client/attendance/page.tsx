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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Flame,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);

  // Data for Calendar & Streak (fetch more to calculate)
  const [allAssistances, setAllAssistances] = useState<any[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  // Data for List (Paginated)
  const [listAssistances, setListAssistances] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 5,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Reload list when page changes, but don't reload full calendar data
    if (pagination.currentPage > 1 || !isLoading) {
      loadList(pagination.currentPage);
    }
  }, [pagination.currentPage]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Profile
      const profileData = await api.getProfile();
      setUser(profileData.socio);

      // 2. Get "All" (or enough history) for Calendar & Streak
      // We fetch 60 items to cover current/prev month and calc simple streak
      const historyData: any = await api.getAsistencias({ per_page: 60 });
      const historyList = Array.isArray(historyData)
        ? historyData
        : historyData.asistencias || [];

      setAllAssistances(historyList);
      calculateStreak(historyList);

      // 3. Get First Page for List (limit 5)
      const listData: any = await api.getAsistencias({ page: 1, per_page: 5 });
      const listItems = Array.isArray(listData)
        ? listData
        : listData.asistencias || [];

      setListAssistances(listItems);
      if (!Array.isArray(listData) && listData.meta) {
        setPagination((prev) => ({
          ...prev,
          currentPage: listData.meta.current_page,
          lastPage: listData.meta.last_page,
          total: listData.meta.total,
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadList = async (page: number) => {
    setIsListLoading(true);
    try {
      const data: any = await api.getAsistencias({ page, per_page: 5 });
      const list = Array.isArray(data) ? data : data.asistencias || [];
      setListAssistances(list);
      if (!Array.isArray(data) && data.meta) {
        setPagination((prev) => ({
          ...prev,
          currentPage: data.meta.current_page,
          lastPage: data.meta.last_page,
          total: data.meta.total,
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsListLoading(false);
    }
  };

  // Simple Streak Calculation: Consecutive days present (descending order list)
  const calculateStreak = (list: any[]) => {
    if (!list.length) return;

    // Extract unique dates (YYYY-MM-DD)
    const dates = Array.from(
      new Set(list.map((a) => a.fecha_asistencia.split("T")[0]))
    )
      .sort()
      .reverse();

    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // Check if attended today or yesterday to start the streak
    if (dates.includes(today)) {
      currentStreak++;
      // Count backwards from today
      let checkDate = new Date(today);
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dateString = checkDate.toISOString().split("T")[0];
        if (dates.includes(dateString)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (dates.includes(yesterday)) {
      currentStreak++;
      let checkDate = new Date(yesterday);
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dateString = checkDate.toISOString().split("T")[0];
        if (dates.includes(dateString)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStreakCount(currentStreak);
  };

  const getDaysWithAttendance = () => {
    return allAssistances.map((a) => new Date(a.fecha_asistencia));
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
        {/* Header & Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/client">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Mi Actividad
              </h1>
              <p className="text-xs text-muted-foreground">
                Tus logros del mes
              </p>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex flex-col items-center justify-center bg-orange-100 dark:bg-orange-950/30 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-900">
            <div className="flex items-center gap-1">
              <Flame
                className={cn(
                  "h-6 w-6 text-orange-500",
                  streakCount > 0 && "fill-orange-500 animate-pulse"
                )}
              />
              <span className="text-2xl font-black text-orange-600 dark:text-orange-500">
                {streakCount}
              </span>
            </div>
            <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400 uppercase tracking-wider">
              Racha Días
            </span>
          </div>
        </div>

        {/* Calendar Card */}
        <Card className="border-none shadow-md bg-gradient-to-br from-background to-accent/20">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="multiple"
              selected={getDaysWithAttendance()}
              className="rounded-md border bg-card shadow-sm"
              // En react-day-picker v9, personalizamos la celda con el componente Day
              components={{
                Day: ({ day, modifiers, ...props }) => {
                  const isSelected = !!modifiers.selected;
                  return (
                    <td {...props}>
                      <div className="relative flex h-full w-full items-center justify-center p-1">
                        <span
                          className={cn(
                            "text-sm",
                            isSelected &&
                              "font-bold text-orange-600 dark:text-orange-500"
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                        {isSelected && (
                          <Flame className="absolute -bottom-0.5 h-3 w-3 text-orange-500 fill-orange-500" />
                        )}
                      </div>
                    </td>
                  );
                },
              }}
            />
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial Reciente
          </h2>

          <div className="space-y-3">
            {isListLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : listAssistances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay registros aún.
              </div>
            ) : (
              listAssistances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center gap-4 rounded-xl border border-border p-3 bg-card shadow-sm transition-all hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {new Date(attendance.fecha_asistencia).getDate()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {attendance.clase
                        ? attendance.clase.nombre
                        : "Entrada General"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {new Date(attendance.fecha_asistencia).toLocaleDateString(
                        "es-ES",
                        { weekday: "long", month: "long" }
                      )}
                    </p>
                  </div>

                  <div className="text-xs font-medium bg-secondary px-2 py-1 rounded-md text-secondary-foreground">
                    {new Date(attendance.fecha_asistencia).toLocaleTimeString(
                      "es-ES",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    currentPage: Math.max(1, p.currentPage - 1),
                  }))
                }
                disabled={pagination.currentPage === 1 || isListLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {pagination.currentPage} / {pagination.lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    currentPage: Math.min(p.lastPage, p.currentPage + 1),
                  }))
                }
                disabled={
                  pagination.currentPage === pagination.lastPage ||
                  isListLoading
                }
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <MobileNav role="client" />
    </div>
  );
}
