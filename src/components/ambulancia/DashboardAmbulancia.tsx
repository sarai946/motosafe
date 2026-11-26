'use client'
import React, { useState, useEffect } from 'react'
import {
  Shield, MapPin, Clock, User, Heart, Phone,
  CheckCircle, XCircle, Bell, BellOff, RefreshCw,
  Activity, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { SolicitudAmbulancia } from '@/types'

// ── Tiempo transcurrido ───────────────────────────────────────
function tiempoTranscurrido(fecha: Date | string): string {
  const ms = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins === 1) return 'Hace 1 min'
  return `Hace ${mins} min`
}

// ── Datos demo de la central ──────────────────────────────────
const CENTRAL_DEMO = {
  nombre: 'Central de Ambulancias MotoSafe',
  ciudad: 'Bogotá',
  total_ambulancias: 5,
  ambulancias_activas: 3,
  calificacion: 4.9,
  total_servicios: 287,
}

// ── Solicitudes demo ──────────────────────────────────────────
const SOLICITUDES_DEMO: SolicitudAmbulancia[] = [
  {
    id: 'sol-001',
    accidentado: {
      userId: 'demo1',
      nombres: 'Carlos', apellidos: 'Rodríguez Pérez',
      placa: 'ABC-123', grupoSanguineo: 'O+',
      eps: 'Sura EPS', alergias: 'Penicilina',
    },
    solicitante: { esAnonimo: true },
    ubicacion: {
      lat: 4.6097, lng: -74.0817,
      direccion: 'Cra 7 con Calle 32, Bogotá',
      mapsUrl: 'https://www.google.com/maps?q=4.6097,-74.0817',
    },
    estado: 'PENDIENTE', conductoresRechazados: [],
    descripcion: 'Accidente de moto. Motociclista consciente.',
    timestamp: new Date(Date.now() - 2 * 60000), updatedAt: new Date(),
  },
  {
    id: 'sol-002',
    accidentado: {
      userId: 'demo2',
      nombres: 'Andrés', apellidos: 'Martínez',
      placa: 'XYZ-456', grupoSanguineo: 'A+',
      eps: 'Nueva EPS', alergias: 'Ninguna',
    },
    solicitante: { esAnonimo: false, nombre: 'María López', celular: '+573001234567' },
    ubicacion: {
      lat: 4.6482, lng: -74.1002,
      direccion: 'Av. Boyacá con Calle 80, Bogotá',
      mapsUrl: 'https://www.google.com/maps?q=4.6482,-74.1002',
    },
    estado: 'PENDIENTE', conductoresRechazados: [],
    descripcion: 'Caída de moto. Posible fractura en pierna derecha.',
    timestamp: new Date(Date.now() - 8 * 60000), updatedAt: new Date(),
  },
]

export default function DashboardAmbulancia() {
  const [estado, setEstado] = useState<'ACTIVO' | 'OCUPADO' | 'INACTIVO'>('ACTIVO')
  const [solicitudes, setSolicitudes] = useState<SolicitudAmbulancia[]>(SOLICITUDES_DEMO)
  const [solicitudActiva, setSolicitudActiva] = useState<SolicitudAmbulancia | null>(null)
  const [aceptando, setAceptando] = useState<string | null>(null)
  const [tab, setTab] = useState<'solicitudes' | 'perfil'>('solicitudes')

  // Simula llegada de nueva solicitud cada 45 seg (demo)
  useEffect(() => {
    if (estado !== 'ACTIVO') return
    const t = setInterval(() => toast('🚨 Nueva solicitud de emergencia', { duration: 4000 }), 45000)
    return () => clearInterval(t)
  }, [estado])

  const aceptar = (sol: SolicitudAmbulancia) => {
    setAceptando(sol.id)
    setTimeout(() => {
      const actualizada: SolicitudAmbulancia = {
        ...sol, estado: 'ACEPTADA',
        conductorAceptado: {
          conductorId: 'central-demo',
          nombres: 'Central', apellidos: CENTRAL_DEMO.nombre,
          celular: '+573001234567',
          placaAmbulancia: 'AMB-BOG-01',
          empresa: CENTRAL_DEMO.nombre,
          tipoAmbulancia: 'Medicalizada',
          etaMinutos: 7,
        },
        updatedAt: new Date(),
      }
      setSolicitudActiva(actualizada)
      setSolicitudes(prev => prev.filter(s => s.id !== sol.id))
      setEstado('OCUPADO')
      setAceptando(null)
      toast.success('Solicitud aceptada. Ambulancia despachada.')
    }, 1200)
  }

  const rechazar = (id: string) => {
    setSolicitudes(prev => prev.filter(s => s.id !== id))
    toast('Solicitud rechazada', { icon: '↩️' })
  }

  const completar = () => {
    setSolicitudActiva(null)
    setEstado('ACTIVO')
    toast.success('Servicio completado.')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className={`py-4 px-4 ${estado === 'ACTIVO' ? 'bg-gradient-to-r from-green-700 to-green-500' : estado === 'OCUPADO' ? 'bg-gradient-to-r from-red-700 to-red-500' : 'bg-gradient-to-r from-dark-700 to-dark-600'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <div>
              <p className="text-white font-bold text-sm">{CENTRAL_DEMO.nombre}</p>
              <p className="text-white/70 text-xs">{CENTRAL_DEMO.ciudad}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (estado === 'OCUPADO') return
              setEstado(e => e === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')
            }}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 transition-colors"
          >
            {estado === 'ACTIVO'
              ? <><Bell className="w-4 h-4 text-white" /><span className="text-white text-xs font-semibold">En línea</span></>
              : estado === 'OCUPADO'
              ? <><Activity className="w-4 h-4 text-white animate-pulse" /><span className="text-white text-xs font-semibold">En servicio</span></>
              : <><BellOff className="w-4 h-4 text-white" /><span className="text-white text-xs font-semibold">Inactivo</span></>
            }
          </button>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto flex gap-6 mt-3">
          {[
            { label: 'Ambulancias', value: `${CENTRAL_DEMO.ambulancias_activas}/${CENTRAL_DEMO.total_ambulancias}` },
            { label: 'Servicios', value: CENTRAL_DEMO.total_servicios },
            { label: 'Calificación', value: `${CENTRAL_DEMO.calificacion}⭐` },
            { label: 'Pendientes', value: solicitudes.length },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-white/60 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-dark-700 p-1 rounded-xl mb-4">
          <button onClick={() => setTab('solicitudes')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'solicitudes' ? 'bg-red-500 text-white' : 'text-white/50 hover:text-white'}`}>
            🚨 Solicitudes
            {solicitudes.length > 0 && (
              <span className="ml-1.5 bg-white text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{solicitudes.length}</span>
            )}
          </button>
          <button onClick={() => setTab('perfil')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'perfil' ? 'bg-red-500 text-white' : 'text-white/50 hover:text-white'}`}>
            🏥 Perfil de la central
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">

        {tab === 'perfil' && (
          <div className="space-y-4">
            <div className="card border border-white/10">
              <p className="text-white/40 text-xs uppercase mb-3">Información de la central</p>
              <div className="space-y-3">
                {[
                  { label: 'Nombre', value: CENTRAL_DEMO.nombre },
                  { label: 'Ciudad', value: CENTRAL_DEMO.ciudad },
                  { label: 'Ambulancias', value: `${CENTRAL_DEMO.total_ambulancias} en flota` },
                  { label: 'Servicios realizados', value: CENTRAL_DEMO.total_servicios },
                  { label: 'Calificación', value: `${CENTRAL_DEMO.calificacion} / 5 ⭐` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-sm">{item.label}</span>
                    <span className="text-white text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card border border-green-500/20 bg-green-500/5">
              <p className="text-green-300 text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Central verificada por MotoSafe
              </p>
              <p className="text-white/40 text-xs mt-1">Tu habilitación legal fue validada. Puedes recibir solicitudes.</p>
            </div>
          </div>
        )}

        {tab === 'solicitudes' && (
          <>
            {/* Servicio activo */}
            {solicitudActiva && (
              <div className="card border border-green-500/40 bg-green-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-green-300 font-bold text-sm uppercase">Servicio en curso</p>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <User className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{solicitudActiva.accidentado.nombres} {solicitudActiva.accidentado.apellidos}</p>
                    <p className="text-white/50 text-xs">🏍️ {solicitudActiva.accidentado.placa}</p>
                  </div>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-3">
                  <p className="text-red-300 text-xs font-semibold mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Info médica</p>
                  {solicitudActiva.accidentado.grupoSanguineo && <p className="text-white text-sm">🩸 <strong>{solicitudActiva.accidentado.grupoSanguineo}</strong></p>}
                  {solicitudActiva.accidentado.eps && <p className="text-white/70 text-xs">🏥 {solicitudActiva.accidentado.eps}</p>}
                  {solicitudActiva.accidentado.alergias && <p className="text-white/70 text-xs">⚠️ {solicitudActiva.accidentado.alergias}</p>}
                </div>
                <a href={solicitudActiva.ubicacion.mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-dark-700 rounded-xl mb-3">
                  <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{solicitudActiva.ubicacion.direccion}</p>
                    <p className="text-primary-400 text-xs">Ver en Google Maps →</p>
                  </div>
                </a>
                <div className="flex gap-2">
                  {solicitudActiva.solicitante?.celular && (
                    <a href={`tel:${solicitudActiva.solicitante.celular}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark-700 border border-white/10 rounded-xl text-white font-semibold text-sm">
                      <Phone className="w-4 h-4" /> Llamar
                    </a>
                  )}
                  <button onClick={completar}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors">
                    ✓ Completar servicio
                  </button>
                </div>
              </div>
            )}

            {/* Solicitudes pendientes */}
            {estado === 'ACTIVO' && !solicitudActiva && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    🚨 Solicitudes entrantes
                    {solicitudes.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{solicitudes.length}</span>
                    )}
                  </h2>
                  <button onClick={() => toast('Actualizando...')} className="p-1.5 text-white/30 hover:text-white rounded-lg">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {solicitudes.length === 0 ? (
                  <div className="card border border-white/10 text-center py-10">
                    <p className="text-4xl mb-3">🏁</p>
                    <p className="text-white font-semibold">Sin solicitudes por ahora</p>
                    <p className="text-white/40 text-sm mt-1">Te avisaremos cuando llegue una emergencia</p>
                  </div>
                ) : solicitudes.map(sol => (
                  <div key={sol.id} className="card border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        <span className="text-red-300 text-xs font-semibold uppercase">Nueva emergencia</span>
                      </div>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {tiempoTranscurrido(sol.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{sol.accidentado.nombres} {sol.accidentado.apellidos}</p>
                        {sol.accidentado.placa && <p className="text-accent-400 text-xs font-bold">🏍️ {sol.accidentado.placa}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sol.accidentado.grupoSanguineo && (
                        <span className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs px-2 py-1 rounded-lg">🩸 {sol.accidentado.grupoSanguineo}</span>
                      )}
                      {sol.accidentado.eps && (
                        <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-lg">🏥 {sol.accidentado.eps}</span>
                      )}
                      {sol.accidentado.alergias && sol.accidentado.alergias !== 'Ninguna' && (
                        <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs px-2 py-1 rounded-lg">⚠️ {sol.accidentado.alergias}</span>
                      )}
                    </div>
                    <a href={sol.ubicacion.mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-dark-700 rounded-xl mb-3">
                      <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
                      <p className="text-white/80 text-xs">{sol.ubicacion.direccion}</p>
                    </a>
                    {sol.descripcion && <p className="text-white/50 text-xs mb-3 italic">"{sol.descripcion}"</p>}
                    <div className="flex gap-2">
                      <button onClick={() => rechazar(sol.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-dark-700 border border-white/10 hover:border-red-500/40 rounded-xl text-white/60 hover:text-red-400 font-semibold text-sm transition-all">
                        <XCircle className="w-4 h-4" /> Rechazar
                      </button>
                      <button onClick={() => aceptar(sol)} disabled={aceptando === sol.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-xl text-white font-bold text-sm transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        {aceptando === sol.id ? 'Despachando...' : 'Despachar'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {estado === 'INACTIVO' && (
              <div className="card border border-white/10 text-center py-10">
                <BellOff className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white font-semibold">Central inactiva</p>
                <p className="text-white/40 text-sm mt-1 mb-4">No estás recibiendo solicitudes</p>
                <button onClick={() => setEstado('ACTIVO')} className="btn-primary px-6 py-2.5">Activar central</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
