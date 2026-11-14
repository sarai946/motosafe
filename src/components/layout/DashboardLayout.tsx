'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Shield, User, Bike, QrCode, AlertTriangle,
  Map, Bell, Users, LogOut, Menu, X, ChevronRight, Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cerrarSesion } from '@/lib/auth'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', label: 'Mi perfil', icono: User, exact: true },
  { href: '/dashboard/moto', label: 'Mi motocicleta', icono: Bike },
  { href: '/dashboard/qr', label: 'Mi código QR', icono: QrCode },
  { href: '/dashboard/emergencias', label: 'Emergencias', icono: Zap },
  { href: '/dashboard/mapa', label: 'Mapa motero', icono: Map },
  { href: '/dashboard/alertas', label: 'Alertas viales', icono: AlertTriangle },
  { href: '/dashboard/comunidad', label: 'Comunidad', icono: Users },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, esAdmin } = useAuth()

  const handleCerrarSesion = async () => {
    await cerrarSesion()
    toast.success('Sesión cerrada')
    router.push('/')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-dark-900 border-r border-white/10 w-64">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow-blue">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white">MotoSafe</span>
        </Link>
      </div>

      {/* Usuario */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center font-bold text-white">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.displayName || 'Usuario'}</p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarAbierto(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive(item.href, item.exact)
                ? 'bg-primary-500/20 text-white border border-primary-500/30'
                : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            <item.icono className={cn('w-4 h-4', isActive(item.href, item.exact) ? 'text-primary-400' : '')} />
            {item.label}
            {isActive(item.href, item.exact) && (
              <ChevronRight className="w-3 h-3 ml-auto text-primary-400" />
            )}
          </Link>
        ))}

        {esAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-white/20 text-xs uppercase tracking-wider">Administración</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-primary-500/20 text-white border border-primary-500/30'
                  : 'text-primary-400/70 hover:text-primary-300 hover:bg-primary-500/10'
              )}
            >
              <Shield className="w-4 h-4" /> Panel Admin
            </Link>
          </>
        )}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleCerrarSesion}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-dark-800 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar móvil (overlay) */}
      {sidebarAbierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarAbierto(false)} />
          <div className="relative w-64 h-full animate-slide-in">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar móvil */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-dark-900 border-b border-white/10">
          <button
            onClick={() => setSidebarAbierto(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">MotoSafe</span>
        </div>

        {/* Área de scroll */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
