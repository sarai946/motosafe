'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { QrCode, Bike, Phone, Shield, AlertTriangle, Map, Users, ChevronRight, Edit } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerPerfil, obtenerMotocicleta, obtenerContactosEmergencia } from '@/lib/firestore'
import type { MotocyclistProfile, Motocicleta, ContactoEmergencia } from '@/types'
import SOSButton from '@/components/ui/SOSButton'
import PerfilSetupModal from '@/components/ui/PerfilSetupModal'

export default function DashboardPage() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<MotocyclistProfile | null>(null)
  const [moto, setMoto] = useState<Motocicleta | null>(null)
  const [contactos, setContactos] = useState<ContactoEmergencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarSetup, setMostrarSetup] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const setupCompleto = localStorage.getItem('motosafe_setup_completo')
      if (!setupCompleto) setMostrarSetup(true)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const cargarDatos = async () => {
      const [p, m, c] = await Promise.all([
        obtenerPerfil(user.uid),
        obtenerMotocicleta(user.uid),
        obtenerContactosEmergencia(user.uid),
      ])
      setPerfil(p)
      setMoto(m)
      setContactos(c)
      setCargando(false)
    }
    cargarDatos()
  }, [user])

  const accesos = [
    { href: '/dashboard/qr', icono: QrCode, titulo: 'Mi código QR', desc: 'Ver y descargar tu QR', color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { href: '/dashboard/moto', icono: Bike, titulo: 'Mi motocicleta', desc: 'Datos y documentos', color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { href: '/dashboard/emergencias', icono: Shield, titulo: 'Emergencias', desc: 'Centro de ayuda', color: 'text-red-400', bg: 'bg-red-500/10' },
    { href: '/dashboard/mapa', icono: Map, titulo: 'Mapa motero', desc: 'Servicios cercanos', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { href: '/dashboard/alertas', icono: AlertTriangle, titulo: 'Alertas viales', desc: 'Novedades en la vía', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { href: '/dashboard/comunidad', icono: Users, titulo: 'Comunidad', desc: 'Clubs y eventos', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {mostrarSetup && <PerfilSetupModal onComplete={() => setMostrarSetup(false)} />}
      <SOSButton userId={user?.uid} />
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Tarjeta de bienvenida */}
        <div className="bg-hero-gradient rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Bienvenido de regreso</p>
              <h1 className="text-white font-display font-bold text-2xl">
                {perfil ? `${perfil.nombres} ${perfil.apellidos}` : user?.displayName}
              </h1>
              {moto && (
                <p className="text-primary-200 text-sm mt-1">
                  🏍️ {moto.marca} {moto.modelo} · <span className="font-bold text-accent-300">{moto.placa}</span>
                </p>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${perfil?.qrActivo ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
              {perfil?.qrActivo ? '✓ QR Activo' : '✗ QR Inactivo'}
            </div>
          </div>
        </div>

        {/* Estado del perfil */}
        {(!moto || contactos.length === 0) && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <p className="text-yellow-300 font-semibold text-sm mb-2">⚠️ Completa tu perfil de emergencia</p>
            <ul className="space-y-1">
              {!moto && (
                <li className="text-yellow-200/70 text-sm flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  <Link href="/dashboard/moto" className="underline">Registra tu motocicleta</Link>
                </li>
              )}
              {contactos.length === 0 && (
                <li className="text-yellow-200/70 text-sm flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  <Link href="/dashboard/perfil" className="underline">Agrega contactos de emergencia</Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Grid de accesos */}
        <div>
          <h2 className="text-white font-semibold mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {accesos.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="card-hover p-4 group"
              >
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icono className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className="text-white font-medium text-sm">{item.titulo}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Info perfil */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Mi información</h2>
            <Link href="/dashboard/perfil" className="flex items-center gap-1 text-primary-400 text-sm hover:text-primary-300">
              <Edit className="w-3 h-3" /> Editar
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs mb-0.5">Nombre</p>
              <p className="text-white">{perfil?.nombres} {perfil?.apellidos}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Ciudad</p>
              <p className="text-white">{perfil?.ciudad || '—'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Celular</p>
              <p className="text-white">{perfil?.celular || '—'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-0.5">Contactos de emergencia</p>
              <p className="text-white">{contactos.length} registrado{contactos.length !== 1 ? 's' : ''}</p>
            </div>
            {moto && (
              <>
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Placa</p>
                  <p className="text-accent-400 font-bold">{moto.placa}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Motocicleta</p>
                  <p className="text-white">{moto.marca} {moto.modelo} {moto.anio}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
