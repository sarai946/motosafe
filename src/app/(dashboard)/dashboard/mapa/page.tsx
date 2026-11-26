'use client'
import React, { useEffect, useState, useRef } from 'react'
import { Map, Navigation, Search, Phone, Star, ExternalLink, Layers } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerEstablecimientos, obtenerPerfil } from '@/lib/firestore'
import { cn } from '@/lib/utils'

type TipoEstablecimiento = 'TODOS' | 'GASOLINERA' | 'TALLER' | 'MONTALLANTAS' | 'REPUESTOS' | 'GRUA' | 'PARQUEADERO' | 'CENTRO_ASISTENCIA'

const TIPOS = [
  { valor: 'TODOS',            label: 'Todos',        emoji: '📍' },
  { valor: 'GASOLINERA',       label: 'Gasolineras',  emoji: '⛽' },
  { valor: 'TALLER',           label: 'Talleres',     emoji: '🔧' },
  { valor: 'MONTALLANTAS',     label: 'Montallantas', emoji: '🔄' },
  { valor: 'REPUESTOS',        label: 'Repuestos',    emoji: '⚙️' },
  { valor: 'GRUA',             label: 'Grúas',        emoji: '🚛' },
  { valor: 'PARQUEADERO',      label: 'Parqueaderos', emoji: '🅿️' },
  { valor: 'CENTRO_ASISTENCIA',label: 'Asistencia',   emoji: '🏥' },
]

// Calcula distancia en km entre dos puntos GPS
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function MapaPage() {
  const { user } = useAuth()
  const [establecimientos, setEstablecimientos] = useState<any[]>([])
  const [filtro, setFiltro]       = useState<TipoEstablecimiento>('TODOS')
  const [busqueda, setBusqueda]   = useState('')
  const [cargando, setCargando]   = useState(true)
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
  const [ciudadPerfil, setCiudadPerfil] = useState<string>('')
  const [seleccionado, setSeleccionado] = useState<any>(null)
  const [vista, setVista]         = useState<'lista' | 'mapa'>('lista')

  useEffect(() => {
    // Cargar establecimientos
    obtenerEstablecimientos().then(e => { setEstablecimientos(e); setCargando(false) })

    // Obtener ubicación GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUbicacion({ lat: 4.711, lng: -74.0721 }) // Bogotá por defecto
      )
    } else {
      setUbicacion({ lat: 4.711, lng: -74.0721 })
    }

    // Obtener ciudad del perfil
    if (user) {
      obtenerPerfil(user.uid).then(p => {
        if (p?.ciudad) setCiudadPerfil(p.ciudad)
      })
    }
  }, [user])

  // Filtrar y ordenar por distancia
  const filtrados = establecimientos
    .filter(e => {
      const matchTipo = filtro === 'TODOS' || e.tipo === filtro
      const matchBusq = busqueda === '' ||
        e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
      return matchTipo && matchBusq
    })
    .map(e => ({
      ...e,
      distancia: ubicacion && e.lat && e.lng
        ? calcularDistancia(ubicacion.lat, ubicacion.lng, e.lat, e.lng)
        : null,
    }))
    .sort((a, b) => {
      if (a.distancia === null) return 1
      if (b.distancia === null) return -1
      return a.distancia - b.distancia
    })

  const getMapUrl = () => {
    if (seleccionado?.lat && seleccionado?.lng) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${seleccionado.lng - 0.01},${seleccionado.lat - 0.01},${seleccionado.lng + 0.01},${seleccionado.lat + 0.01}&layer=mapnik&marker=${seleccionado.lat},${seleccionado.lng}`
    }
    if (ubicacion) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${ubicacion.lng - 0.03},${ubicacion.lat - 0.03},${ubicacion.lng + 0.03},${ubicacion.lat + 0.03}&layer=mapnik&marker=${ubicacion.lat},${ubicacion.lng}`
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=-74.12,-4.75,-74.02,4.73&layer=mapnik`
  }

  const abrirRuta = (e: any) => {
    const origen = ubicacion ? `${ubicacion.lat},${ubicacion.lng}` : ''
    const url = origen
      ? `https://www.google.com/maps/dir/${origen}/${e.lat},${e.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}`
    window.open(url, '_blank')
  }

  const tipoInfo = (tipo: string) => TIPOS.find(t => t.valor === tipo) || TIPOS[0]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Mapa motero</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {ubicacion ? '📍 Ubicación activa' : '📍 Obteniendo ubicación...'}
              {ciudadPerfil && ` · ${ciudadPerfil}`}
            </p>
          </div>
          <div className="flex gap-1 bg-dark-700 p-1 rounded-xl">
            <button onClick={() => setVista('lista')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                vista === 'lista' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
              <Map className="w-3 h-3" /> Lista
            </button>
            <button onClick={() => setVista('mapa')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                vista === 'mapa' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
              <Layers className="w-3 h-3" /> Mapa
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-10" placeholder="Buscar taller, gasolinera, ciudad..." />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TIPOS.map(tipo => (
            <button key={tipo.valor} onClick={() => setFiltro(tipo.valor as TipoEstablecimiento)}
              className={cn('px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
                filtro === tipo.valor ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white')}>
              {tipo.emoji} {tipo.label}
            </button>
          ))}
        </div>

        {/* Vista mapa */}
        {vista === 'mapa' && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: '380px' }}>
              {ubicacion ? (
                <iframe src={getMapUrl()} title="Mapa" width="100%" height="100%"
                  style={{ border: 0 }} loading="lazy" allowFullScreen />
              ) : (
                <div className="h-full flex items-center justify-center bg-dark-700">
                  <Map className="w-10 h-10 text-primary-400 mx-auto animate-pulse" />
                </div>
              )}
            </div>
            {filtrados.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {filtrados.slice(0, 10).map(est => (
                  <button key={est.id}
                    onClick={() => setSeleccionado(seleccionado?.id === est.id ? null : est)}
                    className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs whitespace-nowrap transition-colors shrink-0',
                      seleccionado?.id === est.id
                        ? 'bg-primary-500 text-white border-primary-400'
                        : 'bg-dark-700 text-white/60 border-white/10 hover:border-primary-500/40')}>
                    <span>{tipoInfo(est.tipo).emoji}</span> {est.nombre}
                    {est.distancia && <span className="text-white/40">{est.distancia.toFixed(1)}km</span>}
                  </button>
                ))}
              </div>
            )}
            {seleccionado && (
              <div className="card border border-primary-500/30 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{seleccionado.nombre}</p>
                    <p className="text-white/40 text-xs">{tipoInfo(seleccionado.tipo).label} · {seleccionado.ciudad}</p>
                    <p className="text-white/30 text-xs">{seleccionado.direccion}</p>
                  </div>
                  <button onClick={() => setSeleccionado(null)} className="text-white/30 hover:text-white p-1">✕</button>
                </div>
                <div className="flex gap-3 pt-1">
                  {seleccionado.telefono && (
                    <a href={`tel:${seleccionado.telefono}`} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs">
                      <Phone className="w-3 h-3" /> Llamar
                    </a>
                  )}
                  <button onClick={() => abrirRuta(seleccionado)}
                    className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-xs ml-auto">
                    <Navigation className="w-3 h-3" /> Cómo llegar
                  </button>
                </div>
              </div>
            )}
            <a href={ubicacion
              ? `https://www.openstreetmap.org/?mlat=${ubicacion.lat}&mlon=${ubicacion.lng}#map=15/${ubicacion.lat}/${ubicacion.lng}`
              : 'https://www.openstreetmap.org'}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-white/30 hover:text-white/60 text-xs transition-colors">
              <ExternalLink className="w-3 h-3" /> Abrir en OpenStreetMap
            </a>
          </div>
        )}

        {/* Vista lista */}
        {vista === 'lista' && (
          cargando ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12">
              <Map className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 font-medium">No se encontraron establecimientos</p>
              <p className="text-white/20 text-sm mt-1">
                {establecimientos.length === 0
                  ? 'El administrador puede agregar establecimientos desde el panel admin'
                  : 'Intenta con otro filtro o búsqueda'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrados.map(est => {
                const info = tipoInfo(est.tipo)
                return (
                  <div key={est.id}
                    className="card border border-white/10 hover:border-primary-500/30 transition-colors cursor-pointer"
                    onClick={() => { setSeleccionado(est); setVista('mapa') }}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0 w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center">
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold text-sm truncate">{est.nombre}</h3>
                          {est.verificado && (
                            <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20 shrink-0">✓</span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">{info.label} · {est.ciudad}</p>
                        <p className="text-white/50 text-xs mt-0.5">{est.direccion}</p>
                        {est.distancia !== null && (
                          <p className="text-primary-400 text-xs mt-1 font-semibold">
                            📍 {est.distancia.toFixed(1)} km de distancia
                          </p>
                        )}
                        {est.calificacion && (
                          <span className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400" /> {est.calificacion}/5
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                      {est.telefono && (
                        <a href={`tel:${est.telefono}`} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors">
                          <Phone className="w-3 h-3" /> Llamar
                        </a>
                      )}
                      {est.whatsapp && (
                        <a href={`https://wa.me/57${est.whatsapp.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-green-400/70 hover:text-green-400 text-xs transition-colors">
                          💬 WhatsApp
                        </a>
                      )}
                      <button onClick={() => abrirRuta(est)}
                        className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-xs ml-auto transition-colors">
                        <Navigation className="w-3 h-3" /> Cómo llegar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
