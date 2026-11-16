'use client'
import React, { useState, useEffect } from 'react'
import { Shield, MapPin, Clock, User, Heart, Phone, CheckCircle, XCircle, Bell, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SolicitudAmbulancia, EstadoConductorAmbulancia } from '@/types'

// ── Datos demo mientras no hay Firebase ──
const SOLICITUDES_DEMO: SolicitudAmbulancia[] = [
  {
    id: 'sol-001',
    accidentado: {
      userId: 'demo',
      nombres: 'Carlos',
      apellidos: 'Rodríguez Pérez',
      placa: 'ABC-123',
      grupoSanguineo: 'O+',
      eps: 'Sura EPS',
      alergias: 'Penicilina',
    },
    solicitante: { esAnonimo: true },
    ubicacion: {
      lat: 4.6097,
      lng: -74.0817,
      direccion: 'Cra 7 con Calle 32, Bogotá',
      mapsUrl: 'https://www.google.com/maps?q=4.6097,-74.0817',
    },
    estado: 'PENDIENTE',
    conductoresRechazados: [],
    descripcion: 'Accidente de moto. El motociclista está consciente.',
    timestamp: new Date(Date.now() - 2 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'sol-002',
    accidentado: {
      userId: 'demo2',
      nombres: 'Andrés',
      apellidos: 'Martínez',
      placa: 'XYZ-456',
      grupoSanguineo: 'A+',
      eps: 'Nueva EPS',
      alergias: 'Ninguna',
    },
    solicitante: { esAnonimo: false, nombre: 'María López', celular: '+573001234567' },
    ubicacion: {
      lat: 4.6482,
      lng: -74.1002,
      direccion: 'Av. Boyacá con Calle 80, Bogotá',
      mapsUrl: 'https://www.google.com/maps?q=4.6482,-74.1002',
    },
    estado: 'PENDIENTE',
    conductoresRechazados: [],
    descripcion: 'Caída de moto. Posible fractura en pierna derecha.',
    timestamp: new Date(Date.now() - 8 * 60000),
    updatedAt: new Date(),
  },
]

const CONDUCTOR_DEMO = {
  nombres: 'Pedro',
  apellidos: 'Gómez',
  celular: '+573001112233',
  placaAmbulancia: 'AMB-789',
  empresa: 'Cruz Roja Bogotá',
  tipoAmbulancia: 'Medicalizada',
  calificacion: 4.8,
  totalServicios: 142,
}

function tiempoTranscurrido(fecha: Date): string {
  const mins = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins === 1) return 'Hace 1 min'
  return `Hace ${mins} min`
}

export default function DashboardAmbulancia() {
  const [estado, setEstado] = useState<EstadoConductorAmbulancia>('DISPONIBLE')
  const [solicitudes, setSolicitudes] = useState<SolicitudAmbulancia[]>(SOLICITUDES_DEMO)
  const [solicitudActiva, setSolicitudActiva] = useState<SolicitudAmbulancia | null>(null)
  const [aceptando, setAceptando] = useState<string | null>(null)

  // Simular llegada de nueva solicitud cada 30 segundos (demo)
  useEffect(() => {
    if (estado !== 'DISPONIBLE') return
    const interval = setInterval(() => {
      toast('🚨 Nueva solicitud de emergencia cercana', { duration: 4000 })
    }, 30000)
    return () => clearInterval(interval)
  }, [estado])

  const aceptarSolicitud = (solicitud: SolicitudAmbulancia) => {
    setAceptando(solicitud.id)
    setTimeout(() => {
      const actualizada: SolicitudAmbulancia = {
        ...solicitud,
        estado: 'ACEPTADA',
        conductorAceptado: {
          conductorId: 'conductor-demo',
          ...CONDUCTOR_DEMO,
          fotoPerfil: undefined,
          fotoAmbulancia: undefined,
          etaMinutos: 8,
        },
        updatedAt: new Date(),
      }
      setSolicitudActiva(actualizada)
      setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id))
      setEstado('OCUPADO')
      setAceptando(null)
      toast.success('¡Solicitud aceptada! Ve hacia el accidente.')
    }, 1000)
  }

  const rechazarSolicitud = (id: string) => {
    setSolicitudes(prev => prev.filter(s => s.id !== id))
    toast('Solicitud rechazada', { icon: '↩️' })
  }

  const completarServicio = () => {
    setSolicitudActiva(null)
    setEstado('DISPONIBLE')
    toast.success('Servicio completado. ¡Gracias!')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className={`py-4 px-4 ${estado === 'DISPONIBLE' ? 'bg-gradient-to-r from-green-700 to-green-500' : 'bg-gradient-to-r from-red-700 to-red-500'}`}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white" />
              <div>
                <p className="text-white font-bold text-sm">MotoSafe Ambulancias</p>
                <p className="text-white/70 text-xs">{CONDUCTOR_DEMO.nombres} {CONDUCTOR_DEMO.apellidos}</p>
              </div>
            </div>
            {/* Toggle disponibilidad */}
            <button
              onClick={() => {
                if (estado === 'OCUPADO') return
                setEstado(prev => prev === 'DISPONIBLE' ? 'INACTIVO' : 'DISPONIBLE')
              }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 transition-colors"
            >
              {estado === 'DISPONIBLE'
                ? <><Bell className="w-4 h-4 text-white" /><span className="text-white text-xs font-semibold">Disponible</span></>
                : estado === 'OCUPADO'
                ? <><Clock className="w-4 h-4 text-white" /><span className="text-white text-xs font-semibold">En servicio</span></>
                : <><BellOff className="w-4 h-4 text-white" /><span className="text-white text-xs font-semibold">Inactivo</span></>
              }
            </button>
          </div>

          {/* Stats rápidas */}
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-white font-bold">{CONDUCTOR_DEMO.calificacion}⭐</p>
              <p className="text-white/60 text-xs">Calificación</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{CONDUCTOR_DEMO.totalServicios}</p>
              <p className="text-white/60 text-xs">Servicios</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{CONDUCTOR_DEMO.placaAmbulancia}</p>
              <p className="text-white/60 text-xs">Placa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Servicio activo ── */}
        {solicitudActiva && (
          <div className="card border border-green-500/40 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-green-300 font-bold text-sm uppercase tracking-wide">Servicio en curso</p>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold">
                  {solicitudActiva.accidentado.nombres} {solicitudActiva.accidentado.apellidos}
                </p>
                <p className="text-white/50 text-xs">🏍️ {solicitudActiva.accidentado.placa}</p>
              </div>
            </div>

            {/* Info médica */}
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-3">
              <p className="text-red-300 text-xs font-semibold mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Info médica
              </p>
              {solicitudActiva.accidentado.grupoSanguineo && (
                <p className="text-white text-sm">🩸 <strong>{solicitudActiva.accidentado.grupoSanguineo}</strong></p>
              )}
              {solicitudActiva.accidentado.eps && (
                <p className="text-white/70 text-xs">🏥 EPS: {solicitudActiva.accidentado.eps}</p>
              )}
              {solicitudActiva.accidentado.alergias && (
                <p className="text-white/70 text-xs">⚠️ Alergias: {solicitudActiva.accidentado.alergias}</p>
              )}
            </div>

            {/* Ubicación */}
            <a href={solicitudActiva.ubicacion.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-dark-700 rounded-xl mb-3">
              <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">{solicitudActiva.ubicacion.direccion}</p>
                <p className="text-primary-400 text-xs">Abrir en Google Maps →</p>
              </div>
            </a>

            <div className="flex gap-2">
              <a href={`tel:${solicitudActiva.solicitante.celular}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark-700 border border-white/10 rounded-xl text-white font-semibold text-sm">
                <Phone className="w-4 h-4" /> Llamar
              </a>
              <button onClick={completarServicio}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors">
                ✓ Completar servicio
              </button>
            </div>
          </div>
        )}

        {/* ── Solicitudes pendientes ── */}
        {estado === 'DISPONIBLE' && !solicitudActiva && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                🚨 Solicitudes cercanas
                {solicitudes.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {solicitudes.length}
                  </span>
                )}
              </h2>
              <p className="text-white/40 text-xs">Radio: 5 km</p>
            </div>

            {solicitudes.length === 0 ? (
              <div className="card border border-white/10 text-center py-10">
                <p className="text-4xl mb-3">🏁</p>
                <p className="text-white font-semibold">Sin solicitudes por ahora</p>
                <p className="text-white/40 text-sm mt-1">Te avisaremos cuando haya una emergencia cerca</p>
              </div>
            ) : (
              solicitudes.map(sol => (
                <div key={sol.id} className="card border border-red-500/20 bg-red-500/5">
                  {/* Tiempo */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      <span className="text-red-300 text-xs font-semibold uppercase">Nueva emergencia</span>
                    </div>
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {tiempoTranscurrido(sol.timestamp)}
                    </span>
                  </div>

                  {/* Accidentado */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {sol.accidentado.nombres} {sol.accidentado.apellidos}
                      </p>
                      {sol.accidentado.placa && (
                        <p className="text-accent-400 text-xs font-bold">🏍️ {sol.accidentado.placa}</p>
                      )}
                    </div>
                  </div>

                  {/* Info médica resumida */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sol.accidentado.grupoSanguineo && (
                      <span className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs px-2 py-1 rounded-lg">
                        🩸 {sol.accidentado.grupoSanguineo}
                      </span>
                    )}
                    {sol.accidentado.eps && (
                      <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-lg">
                        🏥 {sol.accidentado.eps}
                      </span>
                    )}
                    {sol.accidentado.alergias && sol.accidentado.alergias !== 'Ninguna' && (
                      <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs px-2 py-1 rounded-lg">
                        ⚠️ {sol.accidentado.alergias}
                      </span>
                    )}
                  </div>

                  {/* Ubicación */}
                  <a href={sol.ubicacion.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 bg-dark-700 rounded-xl mb-3">
                    <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
                    <p className="text-white/80 text-xs">{sol.ubicacion.direccion}</p>
                  </a>

                  {/* Descripción */}
                  {sol.descripcion && (
                    <p className="text-white/50 text-xs mb-3 italic">"{sol.descripcion}"</p>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button onClick={() => rechazarSolicitud(sol.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-dark-700 border border-white/10 hover:border-red-500/40 rounded-xl text-white/60 hover:text-red-400 font-semibold text-sm transition-all">
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                    <button onClick={() => aceptarSolicitud(sol)}
                      disabled={aceptando === sol.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-xl text-white font-bold text-sm transition-colors">
                      <CheckCircle className="w-4 h-4" />
                      {aceptando === sol.id ? 'Aceptando...' : 'Aceptar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Estado inactivo */}
        {estado === 'INACTIVO' && (
          <div className="card border border-white/10 text-center py-10">
            <BellOff className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white font-semibold">Estás inactivo</p>
            <p className="text-white/40 text-sm mt-1 mb-4">No recibirás solicitudes de emergencia</p>
            <button onClick={() => setEstado('DISPONIBLE')} className="btn-primary px-6 py-2.5">
              Activarme
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
