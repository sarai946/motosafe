'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Search, CheckCircle, XCircle, MapPin, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerTodasAlertas, verificarAlerta } from '@/lib/firestore'
import type { AlertaVial, TipoAlerta } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIPOS: Record<TipoAlerta, { label: string; emoji: string; color: string }> = {
  ACCIDENTE:        { label: 'Accidente',       emoji: '🚨', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  VIA_CERRADA:      { label: 'Vía cerrada',     emoji: '🚧', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  OBRAS:            { label: 'Obras',           emoji: '🏗️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  CONGESTION:       { label: 'Congestión',      emoji: '🚗', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  CLIMA_PELIGROSO:  { label: 'Clima peligroso', emoji: '⛈️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  OBSTACULO:        { label: 'Obstáculo',       emoji: '⚠️', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  CONTROL_POLICIAL: { label: 'Control policial',emoji: '👮', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  OTRO:             { label: 'Otro',            emoji: '📍', color: 'text-white/60 bg-white/5 border-white/10' },
}

export default function AdminAlertasPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()
  const [alertas,  setAlertas]  = useState<AlertaVial[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtro,   setFiltro]   = useState<'TODAS' | 'ACTIVAS' | 'INACTIVAS' | 'VERIFICADAS' | 'PENDIENTES'>('TODAS')

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  useEffect(() => {
    if (!esAdmin) return
    obtenerTodasAlertas().then(a => { setAlertas(a); setCargando(false) })
  }, [esAdmin])

  const toggle = async (alerta: AlertaVial, accion: 'verificar' | 'desactivar' | 'activar') => {
    try {
      if (accion === 'verificar')  await verificarAlerta(alerta.id, true)
      if (accion === 'activar')    await verificarAlerta(alerta.id, true)
      if (accion === 'desactivar') await verificarAlerta(alerta.id, false)
      setAlertas(prev => prev.map(a =>
        a.id === alerta.id
          ? { ...a,
              verificada: accion === 'verificar' || accion === 'activar' ? true : a.verificada,
              activa:     accion === 'desactivar' ? false : true }
          : a
      ))
      toast.success(
        accion === 'verificar'  ? 'Alerta verificada ✓' :
        accion === 'activar'    ? 'Alerta activada' :
                                  'Alerta desactivada'
      )
    } catch { toast.error('Error al actualizar') }
  }

  const formatFecha = (val: any): string => {
    if (!val) return '—'
    if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('es-CO')
    if (val instanceof Date) return val.toLocaleDateString('es-CO')
    return '—'
  }

  const filtradas = alertas.filter(a => {
    const matchFiltro =
      filtro === 'TODAS' ||
      (filtro === 'ACTIVAS'    && a.activa) ||
      (filtro === 'INACTIVAS'  && !a.activa) ||
      (filtro === 'VERIFICADAS'&& a.verificada) ||
      (filtro === 'PENDIENTES' && !a.verificada && a.activa)
    const matchBusq = busqueda === '' ||
      a.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.ubicacion.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusq
  })

  const stats = {
    total:     alertas.length,
    activas:   alertas.filter(a => a.activa).length,
    verificadas: alertas.filter(a => a.verificada).length,
    pendientes:  alertas.filter(a => !a.verificada && a.activa).length,
  }

  if (authCargando || !esAdmin) return null

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl">
        <div>
          <h1 className="text-white font-display font-bold text-2xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-400" /> Alertas viales
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Moderar y verificar alertas reportadas por la comunidad</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total',      value: stats.total,      color: 'text-white' },
            { label: 'Activas',    value: stats.activas,    color: 'text-accent-400' },
            { label: 'Verificadas',value: stats.verificadas,color: 'text-primary-400' },
            { label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="card border border-white/10 text-center py-3">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{cargando ? '—' : s.value}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" placeholder="Buscar por título o ciudad..." />
          </div>
          <select value={filtro} onChange={e => setFiltro(e.target.value as any)}
            className="input-field sm:w-44">
            <option value="TODAS">Todas</option>
            <option value="ACTIVAS">Activas</option>
            <option value="INACTIVAS">Inactivas</option>
            <option value="VERIFICADAS">Verificadas</option>
            <option value="PENDIENTES">Pendientes verificación</option>
          </select>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No hay alertas que coincidan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map(alerta => {
              const info = TIPOS[alerta.tipo] || TIPOS.OTRO
              return (
                <div key={alerta.id} className={cn(
                  'card border transition-colors',
                  !alerta.activa ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-primary-500/20'
                )}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('badge border text-xs', info.color)}>{info.label}</span>
                        {alerta.verificada
                          ? <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20">✓ Verificada</span>
                          : alerta.activa && <span className="badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/20">Pendiente</span>}
                        {!alerta.activa && (
                          <span className="badge bg-white/5 text-white/30 border border-white/10">Inactiva</span>
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm mt-1">{alerta.titulo}</p>
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{alerta.descripcion}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {alerta.ubicacion.ciudad && (
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {alerta.ubicacion.ciudad}
                          </span>
                        )}
                        <span className="text-white/20 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatFecha(alerta.createdAt)}
                        </span>
                        <span className="text-white/20 text-xs flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> {alerta.votos.util}
                          <ThumbsDown className="w-3 h-3 ml-1" /> {alerta.votos.noUtil}
                        </span>
                      </div>
                    </div>

                    {/* Acciones de moderación */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {!alerta.verificada && alerta.activa && (
                        <button onClick={() => toggle(alerta, 'verificar')}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 bg-accent-500/10 text-accent-300 border border-accent-500/20 rounded-lg hover:bg-accent-500/20 transition-colors">
                          <CheckCircle className="w-3 h-3" /> Verificar
                        </button>
                      )}
                      {alerta.activa ? (
                        <button onClick={() => toggle(alerta, 'desactivar')}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                          <XCircle className="w-3 h-3" /> Desactivar
                        </button>
                      ) : (
                        <button onClick={() => toggle(alerta, 'activar')}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 bg-primary-500/10 text-primary-300 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 transition-colors">
                          <CheckCircle className="w-3 h-3" /> Activar
                        </button>
                      )}
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
