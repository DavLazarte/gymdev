"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string | number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Carga optimista desde localStorage
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user", e);
      }
    }

    // 2. Verificar validez real con API
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Si no hay token, ni intentamos
      if (!localStorage.getItem("auth_token")) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await api.getUser();
      setUser(data.user);
      // Actualizar backup local
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    } catch (error: any) {
      console.error("Auth check error:", error);

      // Solo desloguear si es explícitamente No Autorizado (Token inválido/expirado)
      if (error.status === 401) {
        setUser(null);
        localStorage.removeItem("auth_user"); // Limpiar usuario invalido
        localStorage.removeItem("auth_token"); // Limpiar token invalido
      }
      // Si es otro error (ej. red), MANTENEMOS al usuario local (modo offline)
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      // Ignorar error de logout
    }
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
