"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AppHeaderProps {
  userName: string;
  userRole: string;
  userImage?: string;
  gymName?: string;
}

export function AppHeader({
  userName,
  userRole,
  userImage,
  gymName,
}: AppHeaderProps) {
  const router = useRouter();
  const [brandName, setBrandName] = useState<string>(gymName || "Gimnasio");
  const [brandLogo, setBrandLogo] = useState<string>("/logo.jpeg");
  const [displayUserName, setDisplayUserName] = useState<string>(userName);
  const [displayUserImage, setDisplayUserImage] = useState<string | undefined>(
    userImage
  );
  const [actualRole, setActualRole] = useState<string>(userRole);

  useEffect(() => {
    setDisplayUserName(userName);
    if (userImage) setDisplayUserImage(userImage);
  }, [userName, userImage]);

  useEffect(() => {
    const applyCached = () => {
      try {
        const cached = localStorage.getItem("tenant_branding");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.nombre) setBrandName(parsed.nombre);
          if (parsed.logo_url) setBrandLogo(parsed.logo_url);
        }
      } catch {}
    };

    const applyUserProfile = () => {
      try {
        const rawUser = localStorage.getItem("auth_user");
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          if (parsedUser.name || parsedUser.nombre) {
            setDisplayUserName(parsedUser.name || parsedUser.nombre);
          }
          const avatar =
            parsedUser.foto || parsedUser.avatar_url || parsedUser.image;
          if (avatar) {
            setDisplayUserImage(avatar);
          }
          if (
            parsedUser.role_name === "gym_staff" ||
            parsedUser.role === "coach" ||
            parsedUser.rol === "coach"
          ) {
            setActualRole("coach");
          }
        }
      } catch {}
    };

    applyCached();
    applyUserProfile();

    api
      .getTenantConfig()
      .then((res: any) => {
        const tenant = res?.data || res?.tenant || res;
        const nombre = tenant?.nombre;
        const logo =
          tenant?.configuracion?.logo_url || tenant?.logo_url || "/logo.jpeg";
        if (nombre) setBrandName(nombre);
        if (logo) setBrandLogo(logo);
        try {
          localStorage.setItem(
            "tenant_branding",
            JSON.stringify({
              nombre: nombre || "Gimnasio",
              logo_url: logo || "/logo.jpeg",
            })
          );
        } catch {}
      })
      .catch(() => {});

    window.addEventListener("tenant-config-updated", applyCached);
    window.addEventListener("user-profile-updated", applyUserProfile);
    return () => {
      window.removeEventListener("tenant-config-updated", applyCached);
      window.removeEventListener("user-profile-updated", applyUserProfile);
    };
  }, [gymName]);

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  };
  const initials = (displayUserName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabels = {
    client: "Cliente",
    Socio: "Socio",
    reception: "Recepción",
    coach: "Coach",
    admin: "Administrador",
  };

  const isSocio = userRole === "client" || userRole === "Socio";
  const profileHref = isSocio ? "/client/profile" : "/admin/profile";
  const homeHref = isSocio
    ? "/client"
    : actualRole === "coach"
    ? "/admin/reservas"
    : "/admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href={homeHref} className="flex items-center gap-2 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary overflow-hidden">
            <img
              src={brandLogo || "/logo.jpeg"}
              alt={brandName}
              className="h-10 w-10 rounded-lg object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-foreground truncate">
              {brandName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {roleLabels[actualRole as keyof typeof roleLabels] || actualRole}
            </span>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage
                  src={displayUserImage}
                  alt={displayUserName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {displayUserName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {roleLabels[actualRole as keyof typeof roleLabels] ||
                    actualRole}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push(profileHref)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
