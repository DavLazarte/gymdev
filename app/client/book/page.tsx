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

export default function BookClassPage() {
  const { user, loading: roleLoading } = useRequireRole("gym_socio");
  const [classes, setClasses] = useState<ClassSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const [classesData, profileData] = await Promise.all([
        api.getAvailableClasses(),
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
              Horarios Disponibles
            </p>
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-6">
          {/* Past Classes Accordion */}
          {pastClasses.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
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
