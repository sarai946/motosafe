'use client'
import React, { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Navigation, Search, Phone, Star, CheckCircle, X,
  Clock, MessageSquare, AlertTriangle, Locate
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { calificarEstablecimiento } from '@/lib/firestore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const MapaLeaflet = dynamic(() => import('@/components/mapa/MapaLeaflet'), { ssr: false })

// ── Tags de OpenStreetMap por categoría ─────────────────────
const TIPOS = [
  { valor: 'TODOS',             label: 'Todos',        emoji: '📍', tags: null },
  { valor: 'GASOLINERA',        label: 'Gasolineras',  emoji: '⛽', tags: [{ k: 'amenity', v: 'fuel' }] },
  { valor: 'TALLER',            label: 'Talleres',     emoji: '🔧', tags: [{ k: 'shop', v: 'motorcycle_repair' }, { k: 'craft', v: 'motorcycle_repair' }, { k: 'shop', v: 'car_repair' }] },
  { valor: 'MONTALLANTAS',      label: 'Montallantas', emoji: '🔄', tags: [{ k: 'shop', v: 'tyres' }] },
  { valor: 'REPUESTOS',         label: 'Repuestos',    emoji: '⚙️', tags: [{ k: 'shop', v: 'motorcycle' }, { k: 'shop', v: 'car_parts' }] },
  { valor: 'GRUA',              label: 'Grúas',        emoji: '🚛', tags: [{ k: 'amenity', v: 'breakdown_service' }] },
  { valor: 'PARQUEADERO',       label: 'Parqueaderos', emoji: '🅿️', tags: [{ k: 'amenity', v: 'parking' }, { k: 'amenity', v: 'motorcycle_parking' }] },
  { valor: 'CENTRO_ASISTENCIA', label: 'Asistencia',   emoji: '🏥', tags: [{ k: 'amenity', v: 'hospital' }, { k: 'amenity', v: 'clinic' }] },
]

// ── Construir query Overpass correcta ────────────────────────
function buildOverpassQuery(
  tags: { k: string; v: string }[],
  lat: number, lng: number,
  radio = 5000
): string {
  const partes = tags.map(({ k, v }) =>
    `node["${k}"="${v}"](around:${radio},${lat},${lng});\n` +
    `way["${k}"="${v}"](around:${radio},${lat},${lng});\n`
  ).join('')
  return `[out:json][timeout:25];\n(\n${partes});\nout center;`
}

// ── Buscar via proxy Next.js (evita CORS) ────────────────────
async function buscarEnOverpass(
  lat: number, lng: number,
  tags: { k: string; v: string }[],
  radio = 5000
): Promise<any[]> {
  const query = buildOverpassQuery(tags, lat, lng, radio)

  const res = await fetch('/api/overpass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }

  const data = await res.json()

  return (data.elements || [])
    .map((el: any) => {
      const t = el.tags || {}
      const lat = el.lat ?? el.center?.lat
      const lng = el.lon ?? el.center?.lon
      if (!lat || !lng) return null
      return {
        id: `osm-${el.id}`,
        nombre: t.name || t['name:es'] || t.brand || 'Sin nombre',
        tipo: 'OSM',
        direccion: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') ||
                   t['addr:full'] || '',
        ciudad: t['addr:city'] || 'Colombia',
        telefono: t.phone || t['contact:phone'] || '',
        horarios: t.opening_hours || '',
        lat, lng,
        verificado: false,
        esOSM: true,
      }
    })
    .filter(Boolean)
}

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function tipoInfo(tipo: string) {
  return TIPOS.find(t => t.valor === tipo) || { valor: tipo, label: tipo, emoji: '📍', tags: null }
}
function FichaEstablecimiento({ est, ubicacion, onCerrar, userId }: {
  est: any; ubicacion: { lat: number; lng: number } | null
  onCerrar: () => void; userId?: string
}) {
  const info = tipoInfo(est.tipoOriginal || est.tipo)
  const distancia = ubicacion && est.lat && est.lng
    ? calcularDistancia(ubicacion.lat, ubicacion.lng, est.lat, est.lng)
    : null

  const abrirRuta = () => {
    const url = ubicacion
      ? `https://www.google.com/maps/dir/${ubicacion.lat},${ubicacion.lng}/${est.lat},${est.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${est.lat},${est.lng}`
    window.open(url, '_blank')
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
              <p className="text-white/40 text-xs">{info.label} · {est.ciudad}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {distancia !== null && <span className="text-xs bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-1 rounded-lg">📍 {distancia.toFixed(1)} km</span>}
            {est.esOSM && <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-lg">🗺️ OpenStreetMap</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {est.direccion && <div className="col-span-2 p-3 bg-dark-700 rounded-xl"><p className="text-white/40 text-[10px] uppercase mb-0.5">Dirección</p><p className="text-white text-sm">{est.direccion}</p></div>}
            {est.horarios && <div className="p-3 bg-dark-700 rounded-xl"><p className="text-white/40 text-[10px] uppercase mb-0.5">Horario</p><p className="text-white text-sm">{est.horarios}</p></div>}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {est.telefono && <a href={`tel:${est.telefono}`} className="flex items-center justify-center gap-2 py-3 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-xl text-white text-sm font-medium"><Phone className="w-4 h-4 text-accent-400" /> Llamar</a>}
            <button onClick={abrirRuta} className={cn('flex items-center justify-center gap-2 py-3 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-xl text-primary-300 text-sm font-medium', !est.telefono ? 'col-span-2' : '')}><Navigation className="w-4 h-4" /> Cómo llegar</button>
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
  const [resultados, setResultados]     = useState<any[]>([])
  const [cargando, setCargando]         = useState(false)
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [busqueda, setBusqueda]         = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('TODOS')

  // Obtener GPS al entrar
  useEffect(() => {
    if (!navigator.geolocation) { setGpsEstado('denegado'); setUbicacion({ lat: 4.711, lng: -74.0721 }); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsEstado('activo') },
      ()  => { setGpsEstado('denegado') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Buscar en Overpass cuando cambia el filtro o la ubicación
  const buscar = useCallback(async (tipo: string, loc: { lat: number; lng: number } | null) => {
    if (!loc) return
    setCargando(true)
    setResultados([])
    try {
      let tags: { k: string; v: string }[] = []

      if (tipo === 'TODOS') {
        tags = TIPOS.filter(t => t.tags).flatMap(t => t.tags!)
      } else {
        const tipoObj = TIPOS.find(t => t.valor === tipo)
        tags = tipoObj?.tags || []
      }

      if (tags.length === 0) { setCargando(false); return }

      const data = await buscarEnOverpass(loc.lat, loc.lng, tags)
      const conDistancia = data
        .map(e => ({ ...e, tipoOriginal: tipo, distancia: calcularDistancia(loc.lat, loc.lng, e.lat, e.lng) }))
        .sort((a, b) => a.distancia - b.distancia)
        .slice(0, 50)
      setResultados(conDistancia)
    } catch (e: any) {
      toast.error(e.message?.includes('503') || e.message?.includes('servicio')
        ? 'El servicio de mapas no está disponible. Intenta en unos minutos.'
        : 'Error al buscar establecimientos. Verifica tu conexión.')
    } finally {
      setCargando(false)
    }
  }, [])

  // Buscar automáticamente cuando hay ubicación
  useEffect(() => {
    if (ubicacion) buscar(filtroTipo, ubicacion)
  }, [ubicacion])

  // Buscar cuando cambia el filtro
  const cambiarFiltro = (tipo: string) => {
    setFiltroTipo(tipo)
    setSeleccionado(null)
    if (ubicacion) buscar(tipo, ubicacion)
  }

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
    else toast.error('Ciudad no encontrada')
  }

  const filtrados = resultados.filter(e =>
    !busqueda || e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || e.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-3">

        {/* Header */}
        <div className="flex-shrink-0 space-y-3">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Mapa motero</h1>
            <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1.5">
              {gpsEstado === 'activo' && <><span className="w-2 h-2 bg-green-400 rounded-full" /> GPS activo · {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</>}
              {gpsEstado === 'solicitando' && '📍 Obteniendo ubicación...'}
              {gpsEstado === 'denegado' && <><AlertTriangle className="w-3 h-3 text-yellow-400" /> GPS no disponible</>}
              {cargando && ' · Buscando...'}
            </p>
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
              className="input-field pl-10 py-2 text-sm" placeholder="Buscar en los resultados..." />
          </div>

          {/* Categorías */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TIPOS.map(t => (
              <button key={t.valor} onClick={() => cambiarFiltro(t.valor)}
                className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  filtroTipo === t.valor ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white')}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa + lista */}
        <div className="flex flex-col md:flex-row flex-1 gap-3 min-h-0">

          {/* Mapa Leaflet */}
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
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white/40 text-sm">Buscando en OpenStreetMap...</p>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="text-center py-8 card border border-white/10">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-white/40 text-sm">
                  {!ubicacion ? 'Activa el GPS para buscar' : 'Sin resultados cercanos'}
                </p>
                <p className="text-white/20 text-xs mt-1">
                  {ubicacion ? 'Prueba otra categoría o amplía el radio' : ''}
                </p>
              </div>
            ) : (
              filtrados.map(est => {
                const info = tipoInfo(est.tipoOriginal || filtroTipo)
                return (
                  <button key={est.id}
                    onClick={() => setSeleccionado(seleccionado?.id === est.id ? null : est)}
                    className={cn('w-full text-left p-3 rounded-2xl border transition-all',
                      seleccionado?.id === est.id
                        ? 'border-primary-500/60 bg-primary-500/10'
                        : 'border-white/10 bg-dark-800 hover:border-white/30')}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{info.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{est.nombre}</p>
                        {est.direccion && <p className="text-white/40 text-xs truncate">{est.direccion}</p>}
                        <div className="flex items-center gap-2 mt-0.5">
                          {est.distancia !== null && <span className="text-primary-400 text-xs font-semibold">{est.distancia.toFixed(1)} km</span>}
                          {est.horarios && <span className="text-white/30 text-xs truncate">{est.horarios}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
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
