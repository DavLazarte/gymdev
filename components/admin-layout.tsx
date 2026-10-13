"use client"

import type React from "react"

import { AppHeader } from "@/components/app-header"
import { MobileNav } from "@/components/mobile-nav"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface AdminLayoutProps {
  children: React.ReactNode
  userName?: string
  isCoach?: boolean
}

export function AdminLayout({ children, userName = "Admin", isCoach = false }: AdminLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={userName} userRole="admin" />

      {!isMobile && <AdminSidebar isCoach={isCoach} />}

      <main className="pt-16 md:pl-64">
        <div className="container mx-auto max-w-7xl p-4 pb-20 md:pb-8">{children}</div>
      </main>

      <MobileNav role="admin" isCoach={isCoach} />
    </div>
  )
}
