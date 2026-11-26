'use client'
import React, { useEffect, useState } from 'react'
import { AlertTriangle, Plus, MapPin, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerAlertasActivas, crearAlertaVial, actualizarVotoAlerta } from '@/lib/firestore'
import type { AlertaVial, TipoAlerta } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIPOS_ALERTA: { valor: TipoAlerta; label: string; emoji: string; color: string }[] = [
  { valor: 'ACCIDENTE',       label: 'Accidente',      emoji: '🚨', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { valor: 'VIA_CERRADA',     label: 'Vía cerrada',    emoji: '🚧', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { valor: 'OBRAS',           label: 'Obras',          emoji: '🏗️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { valor: 'CONGESTION',      label: 'Congestión',     emoji: '🚗', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { valor: 'CLIMA_PELIGROSO', label: 'Clima peligroso',emoji: '⛈️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { valor: 'OBSTACULO',       label: 'Obstáculo',      emoji: '⚠️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { valor: 'CONTROL_POLICIAL',label: 'Control policial',emoji:'👮',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { valor: 'OTRO',            label: 'Otro',           emoji: '📍', color: 'text-white/60 bg-white/5 border-white/10' },
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

export default function AlertasPage() {
  const { user } = useAuth()
  const [alertas,     setAlertas]     = useState<AlertaVial[]>([])
  const [cargando,    setCargando]    = useState(true)
  const [filtro,      setFiltro]      = useState<TipoAlerta | 'TODAS'>('TODAS')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [votosLocales, setVotosLocales] = useState<Record<string, 'util' | 'noUtil'>>({})

  const [nuevaAlerta, setNuevaAlerta] = useState({
    tipo: 'ACCIDENTE' as TipoAlerta,
    titulo: '', descripcion: '', ciudad: '', referencia: '',
  })
  const [enviando,  setEnviando]  = useState(false)
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    obtenerAlertasActivas().then(a => { setAlertas(a as AlertaVial[]); setCargando(false) })
    setVotosLocales(cargarVotosLocales())
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos =>
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      )
    }
    // Prellenar ciudad con la del perfil del usuario
    if (user) {
      import('@/lib/firestore').then(({ obtenerPerfil }) => {
        obtenerPerfil(user.uid).then(p => {
          if (p?.ciudad) setNuevaAlerta(prev => ({ ...prev, ciudad: p.ciudad }))
        })
      })
    }
  }, [user])

  const alertasFiltradas = filtro === 'TODAS' ? alertas : alertas.filter(a => a.tipo === filtro)
  const getTipoInfo = (tipo: TipoAlerta) => TIPOS_ALERTA.find(t => t.valor === tipo) || TIPOS_ALERTA[TIPOS_ALERTA.length - 1]

  // ── Votar ──
  const votar = async (alerta: AlertaVial, tipo: 'util' | 'noUtil') => {
    if (votosLocales[alerta.id]) {
      toast('Ya votaste en esta alerta', { icon: 'ℹ️' })
      return
    }
    // Optimistic update
    setAlertas(prev => prev.map(a =>
      a.id === alerta.id
        ? { ...a, votos: { ...a.votos, [tipo]: (a.votos[tipo] || 0) + 1 } }
        : a
    ))
    setVotosLocales(prev => ({ ...prev, [alerta.id]: tipo }))
    guardarVotoLocal(alerta.id, tipo)
    try {
      await actualizarVotoAlerta(alerta.id, tipo)
    } catch {
      // Revertir si falla
      setAlertas(prev => prev.map(a =>
        a.id === alerta.id
          ? { ...a, votos: { ...a.votos, [tipo]: Math.max(0, (a.votos[tipo] || 1) - 1) } }
          : a
      ))
      const v = cargarVotosLocales()
      delete v[alerta.id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
      setVotosLocales(v)
      toast.error('Error al registrar el voto')
    }
  }

  // ── Reportar alerta ──
  const reportarAlerta = async () => {
    if (!nuevaAlerta.titulo || !nuevaAlerta.descripcion) {
      toast.error('Completa el título y la descripción')
      return
    }
    setEnviando(true)
    try {
      await crearAlertaVial({
        tipo:        nuevaAlerta.tipo,
        titulo:      nuevaAlerta.titulo,
        descripcion: nuevaAlerta.descripcion,
        ubicacion: {
          latitud:    ubicacion?.lat || 0,
          longitud:   ubicacion?.lng || 0,
          ciudad:     nuevaAlerta.ciudad || undefined,
          referencia: nuevaAlerta.referencia || undefined,
          timestamp:  new Date(),
        },
        reportadoPor: user?.uid || 'anonimo',
        verificada: false,
        activa:     true,
        votos:      { util: 0, noUtil: 0 },
      })
      toast.success('Alerta reportada. Será visible tras revisión.')
      setMostrarForm(false)
      setNuevaAlerta({ tipo: 'ACCIDENTE', titulo: '', descripcion: '', ciudad: '', referencia: '' })
    } catch {
      toast.error('Error al reportar la alerta')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Alertas viales</h1>
            <p className="text-white/40 text-sm mt-1">{alertas.length} alertas activas</p>
          </div>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="btn-primary text-sm py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Reportar
          </button>
        </div>

        {/* Formulario nueva alerta */}
        {mostrarForm && (
          <div className="card border border-primary-500/20 space-y-4">
            <h2 className="text-white font-semibold">Reportar novedad vial</h2>
            <div>
              <label className="input-label">Tipo de novedad</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIPOS_ALERTA.filter(t => t.valor !== 'OTRO').map(tipo => (
                  <button
                    key={tipo.valor} type="button"
                    onClick={() => setNuevaAlerta({ ...nuevaAlerta, tipo: tipo.valor })}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-colors',
                      nuevaAlerta.tipo === tipo.valor
                        ? tipo.color
                        : 'bg-dark-700 border-white/10 text-white/50 hover:border-white/30'
                    )}
                  >
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
                className="input-field resize-none h-20"
                placeholder="Describe brevemente la situación..." />
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
            {ubicacion && <p className="text-accent-400 text-xs">✓ Se adjuntará tu ubicación GPS</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setMostrarForm(false)} className="btn-secondary text-sm py-2">Cancelar</button>
              <button onClick={reportarAlerta} disabled={enviando} className="btn-primary text-sm py-2">
                {enviando ? 'Enviando...' : 'Reportar alerta'}
              </button>
            </div>
            <p className="text-white/30 text-xs">⚠️ Los reportes son revisados antes de publicarse.</p>
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
        {cargando ? (
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
              const tipoInfo  = getTipoInfo(alerta.tipo)
              const miVoto    = votosLocales[alerta.id]
              return (
                <div key={alerta.id} className="card border border-white/10">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{tipoInfo.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('badge border text-xs', tipoInfo.color)}>{tipoInfo.label}</span>
                        {alerta.verificada && (
                          <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20">✓ Verificada</span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-sm mt-1">{alerta.titulo}</h3>
                      <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{alerta.descripcion}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {alerta.ubicacion.ciudad && (
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {alerta.ubicacion.ciudad}
                          </span>
                        )}
                        {alerta.ubicacion.referencia && (
                          <span className="text-white/30 text-xs">{alerta.ubicacion.referencia}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-white/20 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alerta.createdAt
                        ? new Date((alerta.createdAt as any).seconds * 1000).toLocaleDateString('es-CO')
                        : 'Reciente'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => votar(alerta, 'util')}
                        disabled={!!miVoto}
                        className={cn(
                          'flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-lg',
                          miVoto === 'util'
                            ? 'text-accent-400 bg-accent-500/10'
                            : miVoto
                            ? 'text-white/20 cursor-not-allowed'
                            : 'text-white/40 hover:text-accent-400 hover:bg-accent-500/10'
                        )}
                        title="Es útil"
                      >
                        <ThumbsUp className="w-3 h-3" /> {alerta.votos.util}
                      </button>
                      <button
                        onClick={() => votar(alerta, 'noUtil')}
                        disabled={!!miVoto}
                        className={cn(
                          'flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-lg',
                          miVoto === 'noUtil'
                            ? 'text-red-400 bg-red-500/10'
                            : miVoto
                            ? 'text-white/20 cursor-not-allowed'
                            : 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
                        )}
                        title="No es útil"
                      >
                        <ThumbsDown className="w-3 h-3" /> {alerta.votos.noUtil}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
