'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
}

export function useRequireRole(allowedRole: string | string[]) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.getUser();

      const userRole = response.user.role_name;
      const allowedList = Array.isArray(allowedRole)
        ? allowedRole
        : allowedRole === 'gym_staff'
        ? ['gym_owner', 'gym_staff', 'gym_admin', 'coach', 'admin', 'recepcion']
        : allowedRole === 'gym_owner' || allowedRole === 'gym_admin'
        ? ['gym_owner', 'gym_admin', 'gym_staff', 'coach', 'admin']
        : [allowedRole];

      if (!allowedList.includes(userRole)) {
        router.push("/login");
        return;
      }

      setUser(response.user);
    } catch (error) {
      console.error("No autenticado:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return { user, loading };
}