'use client'
import React, { useEffect, useState } from 'react'
import { AlertTriangle, Plus, MapPin, Clock, ThumbsUp, ThumbsDown, Layers, Map } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerAlertasActivas, crearAlertaVial, actualizarVotoAlerta, obtenerPerfil } from '@/lib/firestore'
import type { TipoAlerta } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIPOS_ALERTA = [
  { valor: 'ACCIDENTE',        label: 'Accidente',       emoji: '🚨', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { valor: 'VIA_CERRADA',      label: 'Vía cerrada',     emoji: '🚧', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { valor: 'OBRAS',            label: 'Obras',           emoji: '🏗️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { valor: 'CONGESTION',       label: 'Congestión',      emoji: '🚗', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { valor: 'CLIMA_PELIGROSO',  label: 'Clima peligroso', emoji: '⛈️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { valor: 'OBSTACULO',        label: 'Obstáculo',       emoji: '⚠️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { valor: 'CONTROL_POLICIAL', label: 'Control policial',emoji: '👮', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { valor: 'OTRO',             label: 'Otro',            emoji: '📍', color: 'text-white/60 bg-white/5 border-white/10' },
]

const STORAGE_KEY = 'motosafe_votos_alertas'

function cargarVotosLocales(): Record<string, 'util' | 'noUtil'> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

function guardarVotoLocal(alertaId: string, tipo: 'util' | 'noUtil') {
  const votos = cargarVotosLocales()
  votos[alertaId] = tipo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votos))
}

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function AlertasPage() {
  const { user } = useAuth()
  const [alertas, setAlertas]           = useState<any[]>([])
  const [cargando, setCargando]         = useState(true)
  const [filtro, setFiltro]             = useState<string>('TODAS')
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [votosLocales, setVotosLocales] = useState<Record<string, 'util' | 'noUtil'>>({})
  const [vista, setVista]               = useState<'lista' | 'mapa'>('lista')
  const [ubicacion, setUbicacion]       = useState<{ lat: number; lng: number } | null>(null)
  const [enviando, setEnviando]         = useState(false)

  const [nuevaAlerta, setNuevaAlerta] = useState({
    tipo: 'ACCIDENTE' as TipoAlerta,
    titulo: '', descripcion: '', ciudad: '', referencia: '',
  })

  useEffect(() => {
    obtenerAlertasActivas().then(a => { setAlertas(a); setCargando(false) })
    setVotosLocales(cargarVotosLocales())

    // Obtener ubicación GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      )
    }

    // Prellenar ciudad con la del perfil
    if (user) {
      obtenerPerfil(user.uid).then(p => {
        if (p?.ciudad) setNuevaAlerta(prev => ({ ...prev, ciudad: p.ciudad }))
      })
    }
  }, [user])

  // Alertas cercanas a menos de 2km
  const alertasCercanas = alertas.filter(a => {
    if (!ubicacion || !a.lat || !a.lng) return false
    return calcularDistancia(ubicacion.lat, ubicacion.lng, a.lat, a.lng) <= 2
  })

  const alertasFiltradas = alertas.filter(a =>
    filtro === 'TODAS' || a.tipo === filtro
  ).map(a => ({
    ...a,
    distancia: ubicacion && a.lat && a.lng
      ? calcularDistancia(ubicacion.lat, ubicacion.lng, a.lat, a.lng)
      : null,
  })).sort((a, b) => {
    if (a.distancia === null) return 1
    if (b.distancia === null) return -1
    return a.distancia - b.distancia
  })

  const getTipoInfo = (tipo: string) => TIPOS_ALERTA.find(t => t.valor === tipo) || TIPOS_ALERTA[TIPOS_ALERTA.length - 1]

  const votar = async (alerta: any, tipo: 'util' | 'noUtil') => {
    if (votosLocales[alerta.id]) { toast('Ya votaste en esta alerta', { icon: 'ℹ️' }); return }
    setAlertas(prev => prev.map(a =>
      a.id === alerta.id ? { ...a, votos_util: tipo === 'util' ? (a.votos_util||0)+1 : a.votos_util, votos_no_util: tipo === 'noUtil' ? (a.votos_no_util||0)+1 : a.votos_no_util } : a
    ))
    setVotosLocales(prev => ({ ...prev, [alerta.id]: tipo }))
    guardarVotoLocal(alerta.id, tipo)
    try { await actualizarVotoAlerta(alerta.id, tipo) } catch { toast.error('Error al votar') }
  }

  const reportarAlerta = async () => {
    if (!nuevaAlerta.titulo || !nuevaAlerta.descripcion) {
      toast.error('Completa el título y la descripción')
      return
    }
    setEnviando(true)
    try {
      await crearAlertaVial({
        tipo: nuevaAlerta.tipo,
        titulo: nuevaAlerta.titulo,
        descripcion: nuevaAlerta.descripcion,
        lat: ubicacion?.lat || null,
        lng: ubicacion?.lng || null,
        reportado_por: user?.uid || 'anonimo',
        verificada: false,
        activa: true,
        votos_util: 0,
        votos_no_util: 0,
      })
      toast.success('¡Alerta reportada! Ya es visible en el mapa.')
      setMostrarForm(false)
      setNuevaAlerta(prev => ({ ...prev, titulo: '', descripcion: '', referencia: '' }))
      // Recargar alertas
      const nuevas = await obtenerAlertasActivas()
      setAlertas(nuevas)
    } catch {
      toast.error('Error al reportar la alerta')
    } finally {
      setEnviando(false)
    }
  }

  const getMapUrl = () => {
    if (ubicacion) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${ubicacion.lng - 0.05},${ubicacion.lat - 0.05},${ubicacion.lng + 0.05},${ubicacion.lat + 0.05}&layer=mapnik&marker=${ubicacion.lat},${ubicacion.lng}`
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=-74.12,4.55,-73.98,4.80&layer=mapnik`
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Alertas viales</h1>
            <p className="text-white/40 text-sm mt-1">{alertas.length} alertas activas</p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-dark-700 p-1 rounded-xl">
              <button onClick={() => setVista('lista')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  vista === 'lista' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
                <Map className="w-3 h-3" />
              </button>
              <button onClick={() => setVista('mapa')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  vista === 'mapa' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
                <Layers className="w-3 h-3" />
              </button>
            </div>
            <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Reportar
            </button>
          </div>
        </div>

        {/* Alerta de cercanía */}
        {alertasCercanas.length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-red-300 font-semibold text-sm">⚠️ {alertasCercanas.length} alerta{alertasCercanas.length > 1 ? 's' : ''} a menos de 2 km</p>
              <p className="text-red-400/70 text-xs">{alertasCercanas[0].titulo}</p>
            </div>
          </div>
        )}

        {/* Formulario nueva alerta */}
        {mostrarForm && (
          <div className="card border border-primary-500/20 space-y-4">
            <h2 className="text-white font-semibold">Reportar novedad vial</h2>
            <div>
              <label className="input-label">Tipo de novedad</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIPOS_ALERTA.filter(t => t.valor !== 'OTRO').map(tipo => (
                  <button key={tipo.valor} type="button"
                    onClick={() => setNuevaAlerta({ ...nuevaAlerta, tipo: tipo.valor as TipoAlerta })}
                    className={cn('flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-colors',
                      nuevaAlerta.tipo === tipo.valor ? tipo.color : 'bg-dark-700 border-white/10 text-white/50 hover:border-white/30')}>
                    <span>{tipo.emoji}</span> {tipo.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Título breve *</label>
              <input value={nuevaAlerta.titulo}
                onChange={e => setNuevaAlerta({ ...nuevaAlerta, titulo: e.target.value })}
                className="input-field" placeholder="Accidente en la Calle 80..." />
            </div>
            <div>
              <label className="input-label">Descripción *</label>
              <textarea value={nuevaAlerta.descripcion}
                onChange={e => setNuevaAlerta({ ...nuevaAlerta, descripcion: e.target.value })}
                className="input-field resize-none h-20" placeholder="Describe brevemente la situación..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Ciudad</label>
                <input value={nuevaAlerta.ciudad}
                  onChange={e => setNuevaAlerta({ ...nuevaAlerta, ciudad: e.target.value })}
                  className="input-field" placeholder="Bogotá" />
              </div>
              <div>
                <label className="input-label">Referencia</label>
                <input value={nuevaAlerta.referencia}
                  onChange={e => setNuevaAlerta({ ...nuevaAlerta, referencia: e.target.value })}
                  className="input-field" placeholder="Calle 80 con Ak 68" />
              </div>
            </div>
            {ubicacion
              ? <p className="text-accent-400 text-xs">✓ Se adjuntará tu ubicación GPS — visible en el mapa</p>
              : <p className="text-yellow-400 text-xs">⚠️ Activa el GPS para que la alerta aparezca en el mapa</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setMostrarForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
              <button onClick={reportarAlerta} disabled={enviando} className="btn-primary text-sm py-2">
                {enviando ? 'Enviando...' : 'Reportar alerta'}
              </button>
            </div>
          </div>
        )}

        {/* Vista mapa */}
        {vista === 'mapa' && (
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: '350px' }}>
            <iframe src={getMapUrl()} title="Mapa alertas" width="100%" height="100%"
              style={{ border: 0 }} loading="lazy" allowFullScreen />
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setFiltro('TODAS')}
            className={cn('px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              filtro === 'TODAS' ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white')}>
            Todas
          </button>
          {TIPOS_ALERTA.map(tipo => (
            <button key={tipo.valor} onClick={() => setFiltro(tipo.valor)}
              className={cn('px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
                filtro === tipo.valor ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/50 hover:text-white')}>
              {tipo.emoji} {tipo.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {vista === 'lista' && (
          cargando ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
          ) : alertasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No hay alertas activas en este momento</p>
              <p className="text-white/20 text-sm mt-1">Sé el primero en reportar una novedad</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertasFiltradas.map(alerta => {
                const tipoInfo = getTipoInfo(alerta.tipo)
                const miVoto   = votosLocales[alerta.id]
                const cercana  = alerta.distancia !== null && alerta.distancia <= 2
                return (
                  <div key={alerta.id} className={cn('card border',
                    cercana ? 'border-red-500/40 bg-red-500/5' : 'border-white/10')}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{tipoInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('badge border text-xs', tipoInfo.color)}>{tipoInfo.label}</span>
                          {alerta.verificada && (
                            <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20">✓ Verificada</span>
                          )}
                          {cercana && (
                            <span className="badge bg-red-500/20 text-red-300 border border-red-500/30">📍 Cerca de ti</span>
                          )}
                        </div>
                        <h3 className="text-white font-semibold text-sm mt-1">{alerta.titulo}</h3>
                        <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{alerta.descripcion}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {alerta.distancia !== null && (
                            <span className="text-primary-400 text-xs font-semibold">📍 {alerta.distancia.toFixed(1)} km</span>
                          )}
                          {alerta.created_at && (
                            <span className="text-white/20 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alerta.created_at).toLocaleDateString('es-CO')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/5 gap-2">
                      <button onClick={() => votar(alerta, 'util')} disabled={!!miVoto}
                        className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors',
                          miVoto === 'util' ? 'text-accent-400 bg-accent-500/10' :
                          miVoto ? 'text-white/20 cursor-not-allowed' : 'text-white/40 hover:text-accent-400 hover:bg-accent-500/10')}>
                        <ThumbsUp className="w-3 h-3" /> {alerta.votos_util || 0}
                      </button>
                      <button onClick={() => votar(alerta, 'noUtil')} disabled={!!miVoto}
                        className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors',
                          miVoto === 'noUtil' ? 'text-red-400 bg-red-500/10' :
                          miVoto ? 'text-white/20 cursor-not-allowed' : 'text-white/40 hover:text-red-400 hover:bg-red-500/10')}>
                        <ThumbsDown className="w-3 h-3" /> {alerta.votos_no_util || 0}
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
