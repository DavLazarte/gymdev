"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Calendar, CreditCard, DollarSign, FileText } from "lucide-react"
import type { Membresia } from "@/lib/types"
import { formatLocalDate } from "@/lib/utils"

interface MembresiaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  membresia: Membresia | null
}

export function MembresiaDetailDialog({ open, onOpenChange, membresia }: MembresiaDetailDialogProps) {
  if (!membresia) return null

  const getEstadoBadge = (estado: Membresia["estado"]) => {
    const variants: Record<string, any> = {
      activa: "default",
      vencida: "destructive",
      por_vencer: "secondary",
      cancelada: "outline",
    }
    const labels: Record<string, string> = {
      activa: "Activa",
      vencida: "Vencida",
      por_vencer: "Por vencer",
      cancelada: "Cancelada",
    }
    return <Badge variant={variants[estado] || "secondary"}>{labels[estado] || estado}</Badge>
  }

  const planNombre = membresia.plan?.nombre || membresia.planNombre || "Membresía"
  const socioNombre = membresia.socio?.nombre || membresia.socioNombre || "Socio"
  const fechaInicio = membresia.fecha_inicio || membresia.fechaInicio
  const fechaVencimiento = membresia.fecha_fin || membresia.fechaVencimiento
  const monto = membresia.monto_total ?? membresia.monto ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalle de Membresía</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{planNombre}</h3>
              <p className="text-sm text-muted-foreground">ID: {membresia.id}</p>
            </div>
            {getEstadoBadge(membresia.estado)}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Socio</p>
                <p className="text-sm text-muted-foreground">{socioNombre}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Plan</p>
                <p className="text-sm text-muted-foreground">{planNombre}</p>
              </div>
            </div>

            {fechaInicio && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Fecha de inicio</p>
                  <p className="text-sm text-muted-foreground">
                    {formatLocalDate(fechaInicio, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {fechaVencimiento && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Fecha de vencimiento</p>
                  <p className="text-sm text-muted-foreground">
                    {formatLocalDate(fechaVencimiento, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Monto</p>
                <p className="text-lg font-bold text-primary">${monto}</p>
                {membresia.metodoPago && (
                  <p className="text-xs text-muted-foreground">Método: {membresia.metodoPago}</p>
                )}
              </div>
            </div>

            {membresia.notas && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Notas</p>
                  <p className="text-sm text-muted-foreground">{membresia.notas}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
