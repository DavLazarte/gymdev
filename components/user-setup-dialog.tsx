"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface UserSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socioId: string;
  socioNombre: string;
  socioEmail: string;
  onSuccess: () => void;
  onSave: (id: string, email: string, password: string) => Promise<void>;
}

export function UserSetupDialog({
  open,
  onOpenChange,
  socioId,
  socioNombre,
  socioEmail,
  onSuccess,
  onSave,
}: UserSetupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sync email and reset password when dialog opens or socio changes
  useEffect(() => {
    if (open) {
      setEmail(socioEmail || "");
      setPassword("");
    }
  }, [open, socioEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(socioId, email, password);
      onSuccess();
      onOpenChange(false);
      setPassword("");
    } catch (error) {
      console.error("Error setting up user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Habilitar Acceso</DialogTitle>
          <DialogDescription>
            Crea una cuenta de usuario para <strong>{socioNombre}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="setup-email">Email de acceso</Label>
            <Input
              id="setup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-password">Contraseña temporal</Label>
            <Input
              id="setup-password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-[0.7rem] text-muted-foreground">
              El socio deberá usar esta contraseña para su primer inicio de
              sesión.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Habilitando...
                </>
              ) : (
                "Habilitar Acceso"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
