'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Search, MapPin, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerTodosReportes, actualizarEstadoReporte } from '@/lib/firestore'
import type { ReporteEmergencia, EstadoReporte } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const ESTADOS: { valor: EstadoReporte; label: string; color: string }[] = [
  { valor: 'ACTIVO',       label: 'Activo',      color: 'bg-red-500/20 text-red-300 border-red-500/20' },
  { valor: 'EN_ATENCION',  label: 'En atención', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20' },
  { valor: 'RESUELTO',     label: 'Resuelto',    color: 'bg-accent-500/20 text-accent-300 border-accent-500/20' },
  { valor: 'FALSA_ALARMA', label: 'Falsa alarma',color: 'bg-white/10 text-white/40 border-white/10' },
]

const TIPOS_EMG = {
  ACCIDENTE:      { label: 'Accidente',       emoji: '🚨', color: 'text-red-400' },
  AVERIA_MECANICA:{ label: 'Avería mecánica', emoji: '🔧', color: 'text-orange-400' },
  ROBO:           { label: 'Robo',            emoji: '🚔', color: 'text-purple-400' },
  MEDICA:         { label: 'Médica',          emoji: '🏥', color: 'text-pink-400' },
  INCENDIO:       { label: 'Incendio',        emoji: '🔥', color: 'text-red-500' },
  OTRA:           { label: 'Otra',            emoji: '📋', color: 'text-white/60' },
}

export default function AdminReportesPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()
  const [reportes, setReportes]       = useState<ReporteEmergencia[]>([])
  const [cargando, setCargando]       = useState(true)
  const [busqueda, setBusqueda]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | 'TODOS'>('TODOS')
  const [expandido, setExpandido]     = useState<string | null>(null)

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  useEffect(() => {
    if (!esAdmin) return
    obtenerTodosReportes(200).then(r => { setReportes(r); setCargando(false) })
  }, [esAdmin])

  const cambiarEstado = async (reporte: ReporteEmergencia, estado: EstadoReporte) => {
    await actualizarEstadoReporte(reporte.id, estado)
    setReportes(prev => prev.map(r => r.id === reporte.id ? { ...r, estado } : r))
    toast.success(`Estado actualizado a "${ESTADOS.find(e => e.valor === estado)?.label}"`)
  }

  const formatFecha = (val: any): string => {
    if (!val) return '—'
    if (val?.seconds) return new Date(val.seconds * 1000).toLocaleString('es-CO')
    if (val instanceof Date) return val.toLocaleString('es-CO')
    return '—'
  }

  const filtrados = reportes.filter(r => {
    const matchEstado = filtroEstado === 'TODOS' || r.estado === filtroEstado
    const matchBusq   = busqueda === '' ||
      `${r.motociclista.nombres} ${r.motociclista.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.motociclista.placa?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.ubicacion.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusq
  })

  const stats = {
    total:     reportes.length,
    activos:   reportes.filter(r => r.estado === 'ACTIVO').length,
    atencion:  reportes.filter(r => r.estado === 'EN_ATENCION').length,
    resueltos: reportes.filter(r => r.estado === 'RESUELTO').length,
  }

  if (authCargando || !esAdmin) return null

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-white font-display font-bold text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-400" /> Reportes de emergencia
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Historial de emergencias reportadas en la plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total',      value: stats.total,     color: 'text-white' },
            { label: 'Activos',    value: stats.activos,   color: 'text-red-400' },
            { label: 'En atención',value: stats.atencion,  color: 'text-yellow-400' },
            { label: 'Resueltos',  value: stats.resueltos, color: 'text-accent-400' },
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
              className="input-field pl-10" placeholder="Buscar por nombre, placa o ciudad..." />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as any)}
            className="input-field sm:w-44">
            <option value="TODOS">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.valor} value={e.valor}>{e.label}</option>)}
          </select>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No hay reportes que coincidan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(r => {
              const tipoInfo = TIPOS_EMG[r.tipoEmergencia] || TIPOS_EMG.OTRA
              const estadoInfo = ESTADOS.find(e => e.valor === r.estado) || ESTADOS[0]
              const abierto = expandido === r.id

              return (
                <div key={r.id} className="card border border-white/10 hover:border-primary-500/20 transition-colors">
                  {/* Fila principal */}
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandido(abierto ? null : r.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{tipoInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">
                            {r.motociclista.nombres} {r.motociclista.apellidos}
                          </span>
                          {r.motociclista.placa && (
                            <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20 font-mono shrink-0">
                              {r.motociclista.placa}
                            </span>
                          )}
                          <span className={cn('badge border shrink-0', estadoInfo.color)}>{estadoInfo.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-0.5">
                          <span className={cn('text-xs font-medium', tipoInfo.color)}>{tipoInfo.label}</span>
                          {r.ubicacion.ciudad && (
                            <span className="text-white/30 text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {r.ubicacion.ciudad}
                            </span>
                          )}
                          <span className="text-white/20 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatFecha(r.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-white/30">
                        {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Detalle expandible */}
                  {abierto && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      {/* Descripción */}
                      {r.descripcion && (
                        <p className="text-white/60 text-sm">{r.descripcion}</p>
                      )}

                      {/* Ubicación */}
                      {(r.ubicacion.latitud !== 0 || r.ubicacion.longitud !== 0) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-primary-400" />
                          <span className="text-white/50 text-xs">
                            {r.ubicacion.latitud.toFixed(5)}, {r.ubicacion.longitud.toFixed(5)}
                            {r.ubicacion.direccion && ` · ${r.ubicacion.direccion}`}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${r.ubicacion.latitud},${r.ubicacion.longitud}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 ml-auto text-xs flex items-center gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" /> Ver en mapa
                          </a>
                        </div>
                      )}

                      {/* Reportado por */}
                      <div className="text-xs text-white/30">
                        {r.reportadoPor.esAnonimo
                          ? 'Reportado de forma anónima'
                          : `Reportado por: ${r.reportadoPor.nombre || '—'} ${r.reportadoPor.celular ? `· ${r.reportadoPor.celular}` : ''}`}
                      </div>

                      {/* Servicios contactados */}
                      {r.serviciosContactados?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {r.serviciosContactados.map(s => (
                            <span key={s} className="badge bg-primary-500/10 text-primary-300 border border-primary-500/20 text-xs">
                              {s.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Cambiar estado */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-white/40 text-xs">Cambiar estado:</span>
                        {ESTADOS.map(e => (
                          <button
                            key={e.valor}
                            onClick={() => cambiarEstado(r, e.valor)}
                            disabled={r.estado === e.valor}
                            className={cn(
                              'badge border text-xs cursor-pointer transition-opacity',
                              r.estado === e.valor ? e.color + ' opacity-100' : 'bg-dark-700 text-white/30 border-white/10 hover:opacity-80',
                              r.estado === e.valor && 'cursor-default'
                            )}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
