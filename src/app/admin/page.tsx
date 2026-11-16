'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, Bike, AlertTriangle, Map,
  Shield, Settings, Bell, FileText, ChevronRight
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'

export default function AdminPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  if (authCargando) return null
  if (!esAdmin) return null

  const statCards = [
    { label: 'Usuarios registrados', value: 0, icono: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Motocicletas', value: 0, icono: Bike, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Reportes emergencia', value: 0, icono: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Alertas viales activas', value: 0, icono: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Establecimientos', value: 0, icono: Map, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Clubs moteros', value: 0, icono: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  const acciones = [
    { href: '/admin/usuarios', icono: Users, titulo: 'Gestionar usuarios', desc: 'Ver, activar y desactivar cuentas' },
    { href: '/admin/reportes', icono: FileText, titulo: 'Reportes de emergencia', desc: 'Consultar reportes activos e historial' },
    { href: '/admin/establecimientos', icono: Map, titulo: 'Establecimientos', desc: 'Administrar el mapa motero' },
    { href: '/admin/alertas', icono: AlertTriangle, titulo: 'Alertas viales', desc: 'Moderar y verificar alertas' },
    { href: '/admin/configuracion', icono: Settings, titulo: 'Configuración', desc: 'Números de emergencia por región' },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Panel de administración</h1>
            <p className="text-white/40 text-sm">MotoSafe — Solo acceso autorizado</p>
          </div>
        </div>

        <div>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide mb-3">Estadísticas generales</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map(card => (
              <div key={card.label} className="card border border-white/10">
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icono className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-white font-display font-bold text-2xl">—</p>
                <p className="text-white/40 text-xs mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide mb-3">Acciones</h2>
          <div className="space-y-2">
            {acciones.map(accion => (
              <Link key={accion.href} href={accion.href}
                className="card border border-white/10 hover:border-primary-500/40 transition-colors flex items-center gap-4 p-4 group">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <accion.icono className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{accion.titulo}</p>
                  <p className="text-white/40 text-xs">{accion.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-300 text-sm font-medium mb-1">⚠️ Modo demo</p>
          <p className="text-white/40 text-xs">Las estadísticas estarán disponibles cuando se conecte Firebase.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
