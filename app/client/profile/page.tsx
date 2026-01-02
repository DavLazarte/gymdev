"use client";

import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { ProfileForm } from "@/components/profile-form";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ClientProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setUser(data.socio);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información del perfil",
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
            <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
            <p className="text-sm text-muted-foreground">
              Actualiza tu información personal
            </p>
          </div>
        </div>

        <ProfileForm user={user} />
      </main>

      <MobileNav role="client" />
    </div>
  );
}
