"use client";

import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  Calendar,
  CreditCard,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function MembershipPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membership, setMembership] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getProfile();
      setUser(data.socio);
      setMembership(data.socio.membresia);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de la membresía",
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
            <h1 className="text-2xl font-bold text-foreground">Mi Membresía</h1>
            <p className="text-sm text-muted-foreground">Detalles de tu plan</p>
          </div>
        </div>

        {membership ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{membership.plan}</CardTitle>
                <StatusBadge status={membership.estado} />
              </div>
              <CardDescription>
                Información de tu membresía actual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Modalidad
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {/* TODO: Modality not explicitly in getProfile response, usually implied by plan name or type */}
                      Plan Activo
                    </p>
                  </div>
                </div>

                {/* Fecha Inicio (No siempre viene en el profile simplificado, pero vencimiento sí) */}
                {/* 
                <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Fecha de inicio</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(membership.startDate).toLocaleDateString("es-ES", { ... })}
                    </p>
                  </div>
                </div>
                */}

                {membership.vencimiento && (
                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Fecha de vencimiento
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(membership.vencimiento).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {membership.creditos !== null &&
                  membership.creditos !== undefined && (
                    <div className="rounded-lg bg-primary/5 p-4">
                      <p className="text-sm text-muted-foreground">
                        Créditos restantes
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {membership.creditos}
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CreditCard className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">
                No tienes membresía activa
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Acércate a recepción para activar un plan.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav role="client" />
    </div>
  );
}
