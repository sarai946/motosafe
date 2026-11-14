'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, Bike, QrCode, AlertTriangle, Map,
  Shield, BarChart3, Settings, Bell, FileText, ChevronRight
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLECCIONES } from '@/lib/firestore'

export default function AdminPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    usuarios: 0, motos: 0, reportes: 0, alertas: 0, establecimientos: 0, clubes: 0
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  useEffect(() => {
    if (!esAdmin) return
    const cargar = async () => {
      try {
        const [u, m, r, a, e, c] = await Promise.all([
          getDocs(collection(db, COLECCIONES.USUARIOS)),
          getDocs(collection(db, COLECCIONES.MOTOCICLETAS)),
          getDocs(query(collection(db, COLECCIONES.REPORTES), orderBy('timestamp', 'desc'), limit(100))),
          getDocs(query(collection(db, COLECCIONES.ALERTAS), where('activa', '==', true))),
          getDocs(collection(db, COLECCIONES.ESTABLECIMIENTOS)),
          getDocs(collection(db, COLECCIONES.CLUBES)),
        ])
        setStats({
          usuarios: u.size, motos: m.size, reportes: r.size,
          alertas: a.size, establecimientos: e.size, clubes: c.size,
        })
      } catch (e) {
        console.error('Error cargando estadísticas:', e)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [esAdmin])

  if (authCargando) return null
  if (!esAdmin) return null

  const statCards = [
    { label: 'Usuarios registrados', value: stats.usuarios, icono: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Motocicletas', value: stats.motos, icono: Bike, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Reportes emergencia', value: stats.reportes, icono: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Alertas viales activas', value: stats.alertas, icono: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Establecimientos', value: stats.establecimientos, icono: Map, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Clubs moteros', value: stats.clubes, icono: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Panel de administración</h1>
            <p className="text-white/40 text-sm">MotoSafe — Solo acceso autorizado</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide mb-3">Estadísticas generales</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map(card => (
              <div key={card.label} className="card border border-white/10">
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icono className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-white font-display font-bold text-2xl">
                  {cargando ? '—' : card.value.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-white/60 text-sm font-medium uppercase tracking-wide mb-3">Acciones</h2>
          <div className="space-y-2">
            {acciones.map(accion => (
              <Link
                key={accion.href}
                href={accion.href}
                className="card border border-white/10 hover:border-primary-500/40 transition-colors flex items-center gap-4 p-4 group"
              >
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                  <accion.icono className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{accion.titulo}</p>
                  <p className="text-white/40 text-xs">{accion.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Aviso de roles */}
        <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl">
          <p className="text-primary-300 text-sm font-medium mb-1">🔐 Control de acceso</p>
          <p className="text-white/40 text-xs leading-relaxed">
            Para asignar rol de administrador a un usuario, ve a Firebase Console → Firestore →
            colección <code className="bg-white/10 px-1 rounded">usuarios</code> → encuentra el documento del usuario
            y cambia el campo <code className="bg-white/10 px-1 rounded">role</code> a <code className="bg-white/10 px-1 rounded">admin</code>.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
