'use client'
import React, { useEffect, useState, useRef } from 'react'
import { Map, Navigation, Search, Phone, Clock, Star, ExternalLink, Layers } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { obtenerEstablecimientos } from '@/lib/firestore'
import type { Establecimiento, TipoEstablecimiento } from '@/types'
import { cn } from '@/lib/utils'

const TIPOS: { valor: TipoEstablecimiento | 'TODOS'; label: string; emoji: string }[] = [
  { valor: 'TODOS',            label: 'Todos',       emoji: '📍' },
  { valor: 'GASOLINERA',       label: 'Gasolineras', emoji: '⛽' },
  { valor: 'TALLER',           label: 'Talleres',    emoji: '🔧' },
  { valor: 'MONTALLANTAS',     label: 'Montallantas',emoji: '🔄' },
  { valor: 'REPUESTOS',        label: 'Repuestos',   emoji: '⚙️' },
  { valor: 'GRUA',             label: 'Grúas',       emoji: '🚛' },
  { valor: 'PARQUEADERO',      label: 'Parqueaderos',emoji: '🅿️' },
  { valor: 'CENTRO_ASISTENCIA',label: 'Asistencia',  emoji: '🏥' },
]

export default function MapaPage() {
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([])
  const [filtro,    setFiltro]    = useState<TipoEstablecimiento | 'TODOS'>('TODOS')
  const [busqueda,  setBusqueda]  = useState('')
  const [cargando,  setCargando]  = useState(true)
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)
  const [seleccionado, setSeleccionado] = useState<Establecimiento | null>(null)
  const [vistaActiva,  setVistaActiva]  = useState<'mapa' | 'lista'>('lista')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    obtenerEstablecimientos().then(e => { setEstablecimientos(e); setCargando(false) })
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUbicacion({ lat: 4.711, lng: -74.0721 }) // Bogotá por defecto
      )
    } else {
      setUbicacion({ lat: 4.711, lng: -74.0721 })
    }
  }, [])

  const filtrados = establecimientos.filter(e => {
    const matchTipo  = filtro === 'TODOS' || e.tipo === filtro
    const matchBusq  = busqueda === '' ||
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.ciudad.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusq
  })

  const abrirEnMaps = (e: Establecimiento) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${e.ubicacion.lat},${e.ubicacion.lng}`, '_blank')
  }

  const abrirRuta = (e: Establecimiento) => {
    const origen = ubicacion ? `${ubicacion.lat},${ubicacion.lng}` : ''
    const url = origen
      ? `https://www.google.com/maps/dir/${origen}/${e.ubicacion.lat},${e.ubicacion.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${e.ubicacion.lat},${e.ubicacion.lng}`
    window.open(url, '_blank')
  }

  // Genera URL de OpenStreetMap con marcadores de establecimientos
  const getMapUrl = (): string => {
    if (seleccionado) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${seleccionado.ubicacion.lng - 0.01},${seleccionado.ubicacion.lat - 0.01},${seleccionado.ubicacion.lng + 0.01},${seleccionado.ubicacion.lat + 0.01}&layer=mapnik&marker=${seleccionado.ubicacion.lat},${seleccionado.ubicacion.lng}`
    }
    if (ubicacion) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${ubicacion.lng - 0.05},${ubicacion.lat - 0.05},${ubicacion.lng + 0.05},${ubicacion.lat + 0.05}&layer=mapnik&marker=${ubicacion.lat},${ubicacion.lng}`
    }
    // Colombia por defecto
    return `https://www.openstreetmap.org/export/embed.html?bbox=-81.7,-4.2,-66.8,13.5&layer=mapnik`
  }

  const tipoInfo = (tipo: TipoEstablecimiento) => TIPOS.find(t => t.valor === tipo) || TIPOS[0]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Mapa motero</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {ubicacion ? '📍 Ubicación activa' : '📍 Obteniendo ubicación...'}
              {establecimientos.length > 0 && ` · ${establecimientos.length} establecimiento${establecimientos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {/* Toggle mapa / lista */}
          <div className="flex gap-1 bg-dark-700 p-1 rounded-xl">
            <button onClick={() => setVistaActiva('lista')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                vistaActiva === 'lista' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
              <Map className="w-3 h-3" /> Lista
            </button>
            <button onClick={() => setVistaActiva('mapa')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                vistaActiva === 'mapa' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
              <Layers className="w-3 h-3" /> Mapa
            </button>
          </div>
        </div>

        {/* Mapa OpenStreetMap */}
        {vistaActiva === 'mapa' && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-white/10 relative" style={{ height: '380px' }}>
              {ubicacion ? (
                <iframe
                  ref={iframeRef}
                  src={getMapUrl()}
                  title="Mapa de establecimientos"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-dark-700">
                  <div className="text-center">
                    <Map className="w-10 h-10 text-primary-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-white/60 text-sm">Obteniendo ubicación...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Establecimientos sobre el mapa */}
            {filtrados.length > 0 && (
              <div className="space-y-2">
                <p className="text-white/40 text-xs">Haz clic en un establecimiento para centrarlo en el mapa:</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {filtrados.slice(0, 10).map(est => (
                    <button key={est.id}
                      onClick={() => setSeleccionado(seleccionado?.id === est.id ? null : est)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs whitespace-nowrap transition-colors shrink-0',
                        seleccionado?.id === est.id
                          ? 'bg-primary-500 text-white border-primary-400'
                          : 'bg-dark-700 text-white/60 border-white/10 hover:border-primary-500/40'
                      )}>
                      <span>{tipoInfo(est.tipo).emoji}</span>
                      {est.nombre}
                    </button>
                  ))}
                </div>
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
                  <button onClick={() => setSeleccionado(null)}
                    className="text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/10">✕</button>
                </div>
                <div className="flex gap-2 pt-1">
                  {seleccionado.telefono && (
                    <a href={`tel:${seleccionado.telefono}`}
                      className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors">
                      <Phone className="w-3 h-3" /> Llamar
                    </a>
                  )}
                  <button onClick={() => abrirRuta(seleccionado)}
                    className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-xs ml-auto transition-colors">
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
        {vistaActiva === 'lista' && (
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="input-field pl-10" placeholder="Buscar taller, gasolinera, ciudad..." />
            </div>

            {/* Filtros tipo */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TIPOS.map(tipo => (
                <button key={tipo.valor} onClick={() => setFiltro(tipo.valor as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
                    filtro === tipo.valor ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white'
                  )}>
                  {tipo.emoji} {tipo.label}
                </button>
              ))}
            </div>

            {/* Lista */}
            {cargando ? (
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
                      onClick={() => { setSeleccionado(est); setVistaActiva('mapa') }}>
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
                          <div className="flex flex-wrap gap-3 mt-1">
                            {est.horarios && (
                              <span className="text-white/30 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {est.horarios}
                              </span>
                            )}
                            {est.calificacion && (
                              <span className="text-yellow-400 text-xs flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400" /> {est.calificacion}/5
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                        {est.telefono && (
                          <a href={`tel:${est.telefono}`}
                            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors">
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
                        <button onClick={() => { setSeleccionado(est); setVistaActiva('mapa') }}
                          className="flex items-center gap-1.5 text-white/30 hover:text-white text-xs transition-colors">
                          <Map className="w-3 h-3" /> Ver en mapa
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
