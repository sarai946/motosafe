'use client'
import React, { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  Navigation, Search, Phone, Star, CheckCircle, X,
  Clock, MessageSquare, AlertTriangle, MapPin, Locate
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerEstablecimientos, calificarEstablecimiento } from '@/lib/firestore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Leaflet solo corre en cliente
const MapaLeaflet = dynamic(() => import('@/components/mapa/MapaLeaflet'), { ssr: false })

// ── Categorías ───────────────────────────────────────────────
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

// ── Ficha modal ───────────────────────────────────────────────
function FichaEstablecimiento({ est, ubicacion, onCerrar, userId }: {
  est: any; ubicacion: { lat: number; lng: number } | null
  onCerrar: () => void; userId?: string
}) {
  const info = tipoInfo(est.tipo)
  const distancia = ubicacion && est.lat && est.lng
    ? calcularDistancia(ubicacion.lat, ubicacion.lng, est.lat, est.lng)
    : null

  const abrirRuta = () => {
    const url = ubicacion
      ? `https://www.google.com/maps/dir/${ubicacion.lat},${ubicacion.lng}/${est.lat},${est.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${est.lat},${est.lng}`
    window.open(url, '_blank')
  }

  const calificar = async (valor: number) => {
    if (!userId) { toast.error('Inicia sesión para calificar'); return }
    try {
      await calificarEstablecimiento(est.id, userId, valor)
      toast.success('Calificación guardada')
    } catch { toast.error('Error al calificar') }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCerrar}>
      <div className="w-full max-w-lg bg-dark-800 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
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
          <div className="flex flex-wrap gap-2">
            {est.verificado && <span className="flex items-center gap-1 text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30 px-2 py-1 rounded-lg"><CheckCircle className="w-3 h-3" /> Verificado</span>}
            {est.es_24_horas && <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-lg">🕐 24h</span>}
            {est.servicio_domicilio && <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg">🏠 Domicilio</span>}
            {distancia !== null && <span className="text-xs bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-1 rounded-lg">📍 {distancia.toFixed(1)} km</span>}
          </div>
          {est.descripcion && <p className="text-white/60 text-sm">{est.descripcion}</p>}
          <div className="grid grid-cols-2 gap-2">
            {est.direccion && <div className="col-span-2 p-3 bg-dark-700 rounded-xl"><p className="text-white/40 text-[10px] uppercase mb-0.5">Dirección</p><p className="text-white text-sm">{est.direccion}</p></div>}
            {est.horarios && <div className="p-3 bg-dark-700 rounded-xl"><p className="text-white/40 text-[10px] uppercase mb-0.5">Horario</p><p className="text-white text-sm">{est.horarios}</p></div>}
            {est.calificacion && <div className="p-3 bg-dark-700 rounded-xl"><p className="text-white/40 text-[10px] uppercase mb-0.5">Calificación</p><p className="text-yellow-400 text-sm font-semibold flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400" /> {est.calificacion}/5</p></div>}
            {est.tarifas && <div className="col-span-2 p-3 bg-dark-700 rounded-xl"><p className="text-white/40 text-[10px] uppercase mb-0.5">Tarifas</p><p className="text-white text-sm">{est.tarifas}</p></div>}
          </div>
          {est.servicios?.length > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase mb-2">Servicios</p>
              <div className="flex flex-wrap gap-1.5">
                {est.servicios.map((s: string) => <span key={s} className="text-xs bg-dark-700 text-white/60 px-2 py-1 rounded-lg border border-white/5">{s}</span>)}
              </div>
            </div>
          )}
          {userId && (
            <div>
              <p className="text-white/40 text-xs mb-2">Calificar</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => calificar(n)}
                    className="w-10 h-10 rounded-xl bg-dark-700 hover:bg-yellow-500/20 text-lg transition-colors">⭐</button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {est.telefono && <a href={`tel:${est.telefono}`} className="flex items-center justify-center gap-2 py-3 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-xl text-white text-sm font-medium"><Phone className="w-4 h-4 text-accent-400" /> Llamar</a>}
            {est.whatsapp && <a href={`https://wa.me/57${est.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-300 text-sm font-medium"><MessageSquare className="w-4 h-4" /> WhatsApp</a>}
            <button onClick={abrirRuta} className={cn('flex items-center justify-center gap-2 py-3 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-xl text-primary-300 text-sm font-medium', !est.telefono && !est.whatsapp ? 'col-span-2' : '')}><Navigation className="w-4 h-4" /> Cómo llegar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function MapaPage() {
  const { user } = useAuth()
  const [ubicacion, setUbicacion]       = useState<{ lat: number; lng: number } | null>(null)
  const [gpsEstado, setGpsEstado]       = useState<'solicitando'|'activo'|'denegado'>('solicitando')
  const [ciudadManual, setCiudadManual] = useState('')
  const [todos, setTodos]               = useState<any[]>([])
  const [cargando, setCargando]         = useState(true)
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [busqueda, setBusqueda]         = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('TODOS')

  useEffect(() => {
    if (!navigator.geolocation) { setGpsEstado('denegado'); setUbicacion({ lat: 4.711, lng: -74.0721 }); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsEstado('activo') },
      ()  => { setGpsEstado('denegado') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    obtenerEstablecimientos().then(d => { setTodos(d); setCargando(false) }).catch(() => setCargando(false))
  }, [])

  const usarCiudad = () => {
    const coords: Record<string, {lat:number;lng:number}> = {
      'bogota':{lat:4.711,lng:-74.0721},'bogotá':{lat:4.711,lng:-74.0721},
      'medellin':{lat:6.2442,lng:-75.5812},'medellín':{lat:6.2442,lng:-75.5812},
      'cali':{lat:3.4516,lng:-76.5319},'barranquilla':{lat:10.9685,lng:-74.7813},
      'cartagena':{lat:10.3910,lng:-75.4794},'bucaramanga':{lat:7.1193,lng:-73.1227},
      'villavicencio':{lat:4.1420,lng:-73.6266},'soacha':{lat:4.5793,lng:-74.2177},
    }
    const c = coords[ciudadManual.toLowerCase().trim()]
    if (c) { setUbicacion(c); setGpsEstado('activo') }
    else toast.error('Ciudad no encontrada. Prueba: Bogotá, Medellín, Cali...')
  }

  const filtrados = todos
    .filter(e => e.lat != null && e.lng != null)
    .filter(e => filtroTipo === 'TODOS' || e.tipo === filtroTipo)
    .filter(e => !busqueda || e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || e.ciudad?.toLowerCase().includes(busqueda.toLowerCase()))
    .map(e => ({ ...e, distancia: ubicacion ? calcularDistancia(ubicacion.lat, ubicacion.lng, e.lat, e.lng) : null }))
    .sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999))

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-3">

        {/* Header */}
        <div className="flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-display font-bold text-2xl">Mapa motero</h1>
              <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1.5">
                {gpsEstado === 'activo' && <><span className="w-2 h-2 bg-green-400 rounded-full" /> GPS activo · {filtrados.length} lugar{filtrados.length !== 1 ? 'es' : ''}</>}
                {gpsEstado === 'solicitando' && '📍 Obteniendo ubicación...'}
                {gpsEstado === 'denegado' && <><AlertTriangle className="w-3 h-3 text-yellow-400" /> GPS no disponible</>}
              </p>
            </div>
          </div>

          {gpsEstado === 'denegado' && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-300 text-xs mb-2">⚠️ Activa el GPS o escribe tu ciudad</p>
              <div className="flex gap-2">
                <input value={ciudadManual} onChange={e => setCiudadManual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && usarCiudad()}
                  className="input-field text-sm py-2 flex-1" placeholder="Bogotá, Medellín, Cali..." />
                <button onClick={usarCiudad} className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
                  <Locate className="w-3 h-3" /> Buscar
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10 py-2 text-sm" placeholder="Buscar taller, gasolinera..." />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TIPOS.map(t => (
              <button key={t.valor} onClick={() => setFiltroTipo(t.valor)}
                className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  filtroTipo === t.valor ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white')}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa Leaflet + lista */}
        <div className="flex flex-col md:flex-row flex-1 gap-3 min-h-0">

          {/* Mapa */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 min-h-[300px] md:min-h-0">
            {ubicacion ? (
              <MapaLeaflet
                ubicacion={ubicacion}
                establecimientos={filtrados}
                seleccionado={seleccionado}
                onSeleccionar={setSeleccionado}
              />
            ) : (
              <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Obteniendo ubicación...</p>
                </div>
              </div>
            )}
          </div>

          {/* Lista lateral */}
          <div className="w-full md:w-72 flex-shrink-0 overflow-y-auto space-y-2 max-h-64 md:max-h-none">
            {cargando ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)
            ) : filtrados.length === 0 ? (
              <div className="text-center py-8 card border border-white/10">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-white/40 text-sm">
                  {todos.filter(e => e.lat && e.lng).length === 0
                    ? 'Sin establecimientos con ubicación'
                    : 'Sin resultados'}
                </p>
                <p className="text-white/20 text-xs mt-1">
                  {todos.filter(e => e.lat && e.lng).length === 0
                    ? 'El admin debe verificar los establecimientos'
                    : 'Prueba otra categoría'}
                </p>
              </div>
            ) : (
              filtrados.map(est => (
                <button key={est.id}
                  onClick={() => setSeleccionado(seleccionado?.id === est.id ? null : est)}
                  className={cn('w-full text-left p-3 rounded-2xl border transition-all',
                    seleccionado?.id === est.id
                      ? 'border-primary-500/60 bg-primary-500/10'
                      : 'border-white/10 bg-dark-800 hover:border-white/30')}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl shrink-0">{tipoInfo(est.tipo).emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-semibold text-sm truncate">{est.nombre}</p>
                        {est.verificado && <CheckCircle className="w-3 h-3 text-accent-400 shrink-0" />}
                      </div>
                      <p className="text-white/40 text-xs truncate">{est.ciudad}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {est.distancia !== null && <span className="text-primary-400 text-xs font-semibold">{est.distancia.toFixed(1)} km</span>}
                        {est.es_24_horas && <span className="text-green-400 text-xs">24h</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

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
