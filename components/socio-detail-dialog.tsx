"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Activity,
  Pencil,
} from "lucide-react";
import { formatLocalDate } from "@/lib/utils";
import type { Socio } from "@/lib/types";

interface SocioDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socio: Socio | null;
  onEdit: (socio: Socio) => void;
}

export function SocioDetailDialog({
  open,
  onOpenChange,
  socio,
  onEdit,
}: SocioDetailDialogProps) {
  if (!socio) return null;

  const getEstadoBadge = (estado: Socio["estado"]) => {
    const variants = {
      activo: "default",
      inactivo: "secondary",
      vencido: "destructive",
    };
    const labels = {
      activo: "Activo",
      inactivo: "Inactivo",
      vencido: "Vencido",
    };
    return <Badge variant={variants[estado] as any}>{labels[estado]}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalle del Socio</DialogTitle>
            <Button variant="outline" size="sm" onClick={() => onEdit(socio)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={socio.foto || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {socio.nombre
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground">
                {socio.nombre}
              </h3>
              <div className="mt-2">{getEstadoBadge(socio.estado)}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">
              Información de Contacto
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{socio.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{socio.telefono}</span>
              </div>
              {socio.direccion && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{socio.direccion}</span>
                </div>
              )}
              {socio.fechaNacimiento && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    Nacimiento: {formatLocalDate(socio.fechaNacimiento)}
                  </span>
                </div>
              )}
              {socio.dni && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">DNI:</span>
                  <span className="text-foreground">{socio.dni}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {socio.planNombre && socio.planNombre !== "Sin plan" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Membresía Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium text-foreground">
                    {socio.planNombre}
                  </span>
                </div>
                {socio.fechaInicio && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Fecha de inicio:
                    </span>
                    <span className="text-foreground">
                      {formatLocalDate(socio.fechaInicio)}
                    </span>
                  </div>
                )}
                {socio.fechaVencimiento && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vencimiento:</span>
                    <span className="font-medium text-foreground">
                      {formatLocalDate(socio.fechaVencimiento)}
                    </span>
                  </div>
                )}
                {socio.tipo_membresia && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="text-foreground">
                      {socio.tipo_membresia}
                    </span>
                  </div>
                )}
                {socio.creditos_restantes !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Créditos restantes:
                    </span>
                    <span className="text-foreground">
                      {socio.creditos_restantes}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Membresía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sin membresía activa
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Asistencias
                </CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-xs text-muted-foreground">
                  visitas al gimnasio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Clases Reservadas
                </CardTitle>
                <CardDescription>Próxima semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-xs text-muted-foreground">
                  clases programadas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
