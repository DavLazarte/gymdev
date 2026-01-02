"use client";

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
import { LogOut, Settings } from "lucide-react";
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
  gymName = "Vertice Center",
}: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback redirect even if API fails (token might be invalid anyway)
      router.push("/login");
    }
  };
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabels = {
    client: "Cliente",
    reception: "Recepción",
    admin: "Administrador",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <img src="/logo.jpeg" className="h-10 w-10 rounded-lg " />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">{gymName}</span>
            <span className="text-xs text-muted-foreground">
              {roleLabels[userRole as keyof typeof roleLabels]}
            </span>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage
                  src={userImage}
                  alt={userName}
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
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {roleLabels[userRole as keyof typeof roleLabels]}
                </p>
              </div>
            </DropdownMenuLabel>
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
