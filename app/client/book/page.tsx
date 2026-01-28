"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { ClassCard } from "@/components/class-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ClassSlot } from "@/lib/types";
import { useRequireRole } from "@/hooks/useRequireRole";
import { ChevronLeft, Filter, Loader2, History } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight } from "lucide-react";

export default function BookClassPage() {
  const { user, loading: roleLoading } = useRequireRole("gym_socio");
  const [classes, setClasses] = useState<ClassSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async (date: Date = selectedDate) => {
    try {
      setIsLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");
      const [classesData, profileData] = await Promise.all([
        api.getAvailableClasses(dateStr, dateStr),
        api.getProfile(),
      ]);
      setClasses(classesData);
      setProfile(profileData.socio);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (newDate: Date) => {
    // Restricción para socios: no más allá de mañana
    if (profile?.tipo_persona === "cliente") {
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(23, 59, 59, 999);
      if (newDate > tomorrow) return;
    }

    setSelectedDate(newDate);
    loadClasses(newDate);
  };

  const isNextDisabled = () => {
    if (profile?.tipo_persona === "cliente") {
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
      return format(selectedDate, "yyyy-MM-dd") === tomorrow;
    }
    return false;
  };

  if (roleLoading || (user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const upcomingClasses = classes.filter((c) => !c.clase_pasada);
  const pastClasses = classes.filter((c) => c.clase_pasada);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4 text-foreground">
      <AppHeader
        userName={user.name}
        userRole="client"
        userImage={(user as any).foto}
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
              Reservar Clase
            </h1>
            <p className="text-sm text-primary font-medium">
              Programación de Clases
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDateChange(subDays(selectedDate, 1))}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex flex-col items-center">
              <span className="text-sm font-bold capitalize">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {format(selectedDate, "yyyy")}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDateChange(addDays(selectedDate, 1))}
              className="h-9 w-9"
              disabled={isNextDisabled()}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {format(selectedDate, "yyyy-MM-dd") !==
            format(new Date(), "yyyy-MM-dd") && (
            <div className="flex justify-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => handleDateChange(new Date())}
                className="text-xs h-6 text-primary"
              >
                Volver a Hoy
              </Button>
            </div>
          )}
        </div>

        {/* Classes List */}
        <div className="space-y-6">
          {/* Past Classes Accordion */}
          {pastClasses.length > 0 && (
            <Accordion
              type="single"
              collapsible
              defaultValue={upcomingClasses.length === 0 ? "past-classes" : ""}
              className="w-full"
            >
              <AccordionItem value="past-classes" className="border-none">
                <AccordionTrigger className="flex items-center gap-2 px-4 py-2 hover:no-underline bg-muted/40 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Ver clases anteriores ({pastClasses.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-3">
                  {pastClasses.map((classSession) => (
                    <ClassCard
                      key={classSession.id}
                      classSession={classSession}
                      showBookButton
                      onBooked={loadClasses}
                      currentUserType={profile?.tipo_persona}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Upcoming Classes */}
          <div className="space-y-3">
            {upcomingClasses.length > 0
              ? upcomingClasses.map((classSession) => (
                  <ClassCard
                    key={classSession.id}
                    classSession={classSession}
                    showBookButton
                    onBooked={loadClasses}
                    currentUserType={profile?.tipo_persona}
                  />
                ))
              : !isLoading && (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center bg-muted/20">
                    <h3 className="text-lg font-semibold text-foreground">
                      No hay clases próximas
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Prueba más tarde para nuevas sesiones
                    </p>
                  </div>
                )}
          </div>
        </div>

        {classes.length === 0 && !isLoading && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              No hay clases hoy
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vuelve pronto para ver la programación
            </p>
          </div>
        )}
      </main>

      <MobileNav role="client" />
    </div>
  );
}
