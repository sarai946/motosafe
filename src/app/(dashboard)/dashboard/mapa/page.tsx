'use client'
import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Navigation, Search, Phone, Star, CheckCircle, X,
  Clock, MessageSquare, MapPin, Locate, AlertTriangle, Plus
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerEstablecimientos, calificarEstablecimiento } from '@/lib/firestore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Categorías (sin AMBULANCIA en el mapa de servicios) ──────
const TIPOS = [
  { valor: 'TODOS',             label: 'Todos',        emoji: '📍' },
  { valor: 'GASOLINERA',        label: 'Gasolineras',  emoji: '⛽' },
  { valor: 'TALLER',            label: 'Talleres',     emoji: '🔧' },
  { valor: 'MONTALLANTAS',      label: 'Montallantas', emoji: '🔄' },
  { valor: 'REPUESTOS',         label: 'Repuestos',    emoji: '⚙️' },
  { valor: 'GRUA',              label: 'Grúas',        emoji: '🚛' },
  { valor: 'PARQUEADERO',       label: 'Parqueaderos', emoji: '🅿️' },
  { valor: 'CENTRO_ASISTENCIA', label: 'Asistencia',   emoji: '🏥' },
]

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function tipoInfo(tipo: string) {
  return TIPOS.find(t => t.valor === tipo) || { valor: tipo, label: tipo, emoji: '📍' }
}

// ── Genera URL del mapa con marcadores de OsmAnd/OSM ─────────
// Muestra el mapa centrado en la ubicación del usuario
// Los establecimientos se pueden seleccionar individualmente para verlos en el mapa
function getMapUrl(
  centro: { lat: number; lng: number },
  marcador?: { lat: number; lng: number } | null,
  zoom = 15
): string {
  const lat = marcador?.lat ?? centro.lat
  const lng = marcador?.lng ?? centro.lng
  const delta = zoom === 15 ? 0.015 : 0.03
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-delta},${lat-delta},${lng+delta},${lat+delta}&layer=mapnik&marker=${lat},${lng}`
}

// ── Ficha completa ────────────────────────────────────────────
function FichaEstablecimiento({
  est, ubicacion, onCerrar, userId
}: {
  est: any
  ubicacion: { lat: number; lng: number } | null
  onCerrar: () => void
  userId?: string
}) {
  const [calificando, setCalificando] = useState(false)
  const info = tipoInfo(est.tipo)

  const abrirRuta = () => {
    const url = ubicacion
      ? `https://www.google.com/maps/dir/${ubicacion.lat},${ubicacion.lng}/${est.lat},${est.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${est.lat},${est.lng}`
    window.open(url, '_blank')
  }

  const enviarCalificacion = async (valor: number) => {
    if (!userId) { toast.error('Debes iniciar sesión para calificar'); return }
    try {
      await calificarEstablecimiento(est.id, userId, valor)
      toast.success('Calificación guardada')
      setCalificando(false)
    } catch { toast.error('Error al calificar') }
  }

  const distancia = ubicacion && est.lat && est.lng
    ? calcularDistancia(ubicacion.lat, ubicacion.lng, est.lat, est.lng)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onCerrar}>
      <div className="w-full max-w-lg bg-dark-800 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-dark-700 rounded-2xl flex items-center justify-center text-2xl">{info.emoji}</div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{est.nombre}</h2>
              <p className="text-white/40 text-xs">{info.label} · {est.ciudad}{est.localidad ? ` · ${est.localidad}` : ''}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Mini mapa */}
          {est.lat && est.lng && (
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 180 }}>
              <iframe
                src={getMapUrl({ lat: est.lat, lng: est.lng }, { lat: est.lat, lng: est.lng }, 16)}
                width="100%" height="100%" style={{ border: 0 }} loading="lazy" />
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {est.verificado && (
              <span className="flex items-center gap-1 text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30 px-2 py-1 rounded-lg">
                <CheckCircle className="w-3 h-3" /> Verificado
              </span>
            )}
            {est.es_24_horas && (
              <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-lg">🕐 24 horas</span>
            )}
            {est.servicio_domicilio && (
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg">🏠 A domicilio</span>
            )}
            {distancia !== null && (
              <span className="text-xs bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-1 rounded-lg">
                📍 {distancia.toFixed(1)} km
              </span>
            )}
          </div>

          {est.descripcion && <p className="text-white/60 text-sm">{est.descripcion}</p>}

          {/* Info */}
          <div className="grid grid-cols-2 gap-2">
            {est.direccion && (
              <div className="col-span-2 p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase mb-0.5">Dirección</p>
                <p className="text-white text-sm">{est.direccion}</p>
              </div>
            )}
            {est.horarios && (
              <div className="p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase mb-0.5">Horario</p>
                <p className="text-white text-sm">{est.horarios}</p>
              </div>
            )}
            {est.calificacion && (
              <div className="p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase mb-0.5">Calificación</p>
                <p className="text-yellow-400 text-sm font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400" /> {est.calificacion}/5
                </p>
              </div>
            )}
            {est.tarifas && (
              <div className="col-span-2 p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-[10px] uppercase mb-0.5">Tarifas</p>
                <p className="text-white text-sm">{est.tarifas}</p>
              </div>
            )}
          </div>

          {/* Servicios */}
          {est.servicios?.length > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase mb-2">Servicios</p>
              <div className="flex flex-wrap gap-1.5">
                {est.servicios.map((s: string) => (
                  <span key={s} className="text-xs bg-dark-700 text-white/60 px-2 py-1 rounded-lg border border-white/5">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Calificar */}
          {userId && (
            <div>
              <button onClick={() => setCalificando(!calificando)}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Star className="w-3 h-3" /> {calificando ? 'Cancelar' : 'Calificar este lugar'}
              </button>
              {calificando && (
                <div className="flex gap-2 mt-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => enviarCalificacion(n)}
                      className="w-10 h-10 rounded-xl text-lg bg-dark-700 hover:bg-yellow-500/20 transition-colors">⭐</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {est.telefono && (
              <a href={`tel:${est.telefono}`}
                className="flex items-center justify-center gap-2 py-3 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors">
                <Phone className="w-4 h-4 text-accent-400" /> Llamar
              </a>
            )}
            {est.whatsapp && (
              <a href={`https://wa.me/57${est.whatsapp.replace(/\D/g,'')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-300 text-sm font-medium transition-colors">
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
            )}
            <button onClick={abrirRuta}
              className={cn(
                'flex items-center justify-center gap-2 py-3 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-xl text-primary-300 text-sm font-medium transition-colors',
                !est.telefono && !est.whatsapp ? 'col-span-2' : ''
              )}>
              <Navigation className="w-4 h-4" /> Cómo llegar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function MapaPage() {
  const { user } = useAuth()

  // Ubicación
  const [ubicacion, setUbicacion]           = useState<{ lat: number; lng: number } | null>(null)
  const [gpsEstado, setGpsEstado]           = useState<'solicitando' | 'activo' | 'denegado' | 'manual'>('solicitando')
  const [ciudadManual, setCiudadManual]     = useState('')

  // Establecimientos
  const [todos, setTodos]                   = useState<any[]>([])
  const [cargando, setCargando]             = useState(true)
  const [seleccionado, setSeleccionado]     = useState<any>(null)

  // Filtros
  const [busqueda, setBusqueda]             = useState('')
  const [filtroTipo, setFiltroTipo]         = useState('TODOS')

  // ── 1. Solicitar GPS al entrar ─────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsEstado('denegado')
      setUbicacion({ lat: 4.711, lng: -74.0721 }) // Bogotá por defecto
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsEstado('activo')
      },
      () => {
        setGpsEstado('denegado')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // ── 2. Cargar establecimientos desde Supabase ──────────────
  useEffect(() => {
    obtenerEstablecimientos()
      .then(data => { setTodos(data); setCargando(false) })
      .catch(() => setCargando(false))
  }, [])

  // ── 3. Usar ciudad manual como centro si no hay GPS ────────
  const usarCiudadManual = () => {
    // Coordenadas de ciudades principales de Colombia
    const coords: Record<string, { lat: number; lng: number }> = {
      'bogota': { lat: 4.711, lng: -74.0721 },
      'bogotá': { lat: 4.711, lng: -74.0721 },
      'medellin': { lat: 6.2442, lng: -75.5812 },
      'medellín': { lat: 6.2442, lng: -75.5812 },
      'cali': { lat: 3.4516, lng: -76.5319 },
      'barranquilla': { lat: 10.9685, lng: -74.7813 },
      'cartagena': { lat: 10.3910, lng: -75.4794 },
      'bucaramanga': { lat: 7.1193, lng: -73.1227 },
      'villavicencio': { lat: 4.1420, lng: -73.6266 },
      'soacha': { lat: 4.5793, lng: -74.2177 },
    }
    const key = ciudadManual.toLowerCase().trim()
    const coord = coords[key]
    if (coord) {
      setUbicacion(coord)
      setGpsEstado('manual')
    } else {
      toast.error('Ciudad no encontrada. Intenta con: Bogotá, Medellín, Cali, Barranquilla...')
    }
  }

  // ── 4. Filtrar establecimientos con coordenadas válidas ────
  const filtrados = todos
    .filter(e => e.lat != null && e.lng != null) // solo con coordenadas
    .filter(e => filtroTipo === 'TODOS' || e.tipo === filtroTipo)
    .filter(e => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return e.nombre?.toLowerCase().includes(q) ||
             e.ciudad?.toLowerCase().includes(q) ||
             e.direccion?.toLowerCase().includes(q)
    })
    .map(e => ({
      ...e,
      distancia: ubicacion
        ? calcularDistancia(ubicacion.lat, ubicacion.lng, e.lat, e.lng)
        : null,
    }))
    .sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999))

  // ── URL del mapa principal ─────────────────────────────────
  const mapUrl = ubicacion
    ? getMapUrl(ubicacion, seleccionado?.lat ? seleccionado : null)
    : null

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-0px)] max-h-screen overflow-hidden">

        {/* ── Header ── */}
        <div className="p-4 pb-2 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-white font-display font-bold text-xl">Mapa motero</h1>
              <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                {gpsEstado === 'activo' && <><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> GPS activo</>}
                {gpsEstado === 'solicitando' && '📍 Obteniendo ubicación...'}
                {gpsEstado === 'denegado' && <><AlertTriangle className="w-3 h-3 text-yellow-400" /> GPS no disponible</>}
                {gpsEstado === 'manual' && <><MapPin className="w-3 h-3 text-blue-400" /> Ubicación manual</>}
                {filtrados.length > 0 && ` · ${filtrados.length} lugar${filtrados.length !== 1 ? 'es' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link href="/dashboard/mapa/registrar"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0">
              <Plus className="w-3 h-3" /> Registrar negocio
            </Link>
          </div>

          {/* Input ciudad manual si no hay GPS */}
          {gpsEstado === 'denegado' && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-300 text-xs mb-2">
                ⚠️ No se pudo obtener tu ubicación GPS. Escribe tu ciudad para buscar servicios cercanos.
              </p>
              <div className="flex gap-2">
                <input value={ciudadManual} onChange={e => setCiudadManual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && usarCiudadManual()}
                  className="input-field text-sm py-2 flex-1" placeholder="Bogotá, Medellín, Cali..." />
                <button onClick={usarCiudadManual}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                  <Locate className="w-3 h-3" /> Buscar
                </button>
              </div>
            </div>
          )}

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10 py-2 text-sm" placeholder="Buscar taller, gasolinera..." />
          </div>

          {/* Categorías */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TIPOS.map(t => (
              <button key={t.valor} onClick={() => setFiltroTipo(t.valor)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  filtroTipo === t.valor ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white'
                )}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Layout mapa + lista ── */}
        <div className="flex flex-1 overflow-hidden gap-0 md:gap-3 md:px-4 md:pb-4">

          {/* Mapa */}
          <div className="hidden md:flex flex-1 rounded-2xl overflow-hidden border border-white/10 bg-dark-700 relative">
            {mapUrl ? (
              <iframe key={mapUrl} src={mapUrl} width="100%" height="100%"
                style={{ border: 0 }} loading="lazy" title="Mapa motero" />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Obteniendo ubicación...</p>
                </div>
              </div>
            )}
          </div>

          {/* Lista lateral */}
          <div className="w-full md:w-80 flex-shrink-0 overflow-y-auto px-4 md:px-0 pb-4 md:pb-0 space-y-2">
            {/* Mapa móvil */}
            {mapUrl && (
              <div className="md:hidden rounded-2xl overflow-hidden border border-white/10" style={{ height: 220 }}>
                <iframe key={mapUrl} src={mapUrl} width="100%" height="100%"
                  style={{ border: 0 }} loading="lazy" title="Mapa" />
              </div>
            )}

            {cargando ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)
            ) : filtrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-white/40 font-medium text-sm">
                  {todos.filter(e => e.lat && e.lng).length === 0
                    ? 'Sin establecimientos con coordenadas aún'
                    : 'Sin resultados para este filtro'}
                </p>
                <p className="text-white/20 text-xs mt-1">
                  {todos.filter(e => e.lat && e.lng).length === 0
                    ? 'El administrador debe verificar y activar los establecimientos'
                    : 'Prueba con otra categoría'}
                </p>
              </div>
            ) : (
              filtrados.map(est => (
                <button key={est.id}
                  onClick={() => setSeleccionado(seleccionado?.id === est.id ? null : est)}
                  className={cn(
                    'w-full text-left p-3 rounded-2xl border transition-all',
                    seleccionado?.id === est.id
                      ? 'border-primary-500/60 bg-primary-500/10'
                      : 'border-white/10 bg-dark-800 hover:border-white/30'
                  )}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl shrink-0">{tipoInfo(est.tipo).emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-semibold text-sm truncate">{est.nombre}</p>
                        {est.verificado && <CheckCircle className="w-3 h-3 text-accent-400 shrink-0" />}
                      </div>
                      <p className="text-white/40 text-xs truncate">{est.ciudad}{est.localidad ? ` · ${est.localidad}` : ''}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {est.distancia !== null && (
                          <span className="text-primary-400 text-xs font-semibold">
                            {est.distancia.toFixed(1)} km
                          </span>
                        )}
                        {est.horarios && (
                          <span className="text-white/30 text-xs flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {est.horarios}
                          </span>
                        )}
                        {est.es_24_horas && <span className="text-green-400 text-xs">24h</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}

            {/* CTA */}
            {!cargando && (
              <div className="p-3 bg-dark-700 border border-white/5 rounded-2xl text-center mt-2">
                <p className="text-white/30 text-xs mb-1.5">¿Tienes un negocio para motociclistas?</p>
                <Link href="/dashboard/mapa/registrar"
                  className="text-primary-400 hover:text-primary-300 text-xs font-medium">
                  Registrar mi establecimiento →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ficha modal */}
      {seleccionado && (
        <FichaEstablecimiento
          est={seleccionado}
          ubicacion={ubicacion}
          onCerrar={() => setSeleccionado(null)}
          userId={user?.uid}
        />
      )}
    </DashboardLayout>
  )
}
