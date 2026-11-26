'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock, Eye, Shield,
  MapPin, Phone, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import {
  obtenerSolicitudesEstablecimiento,
  actualizarSolicitudEstablecimiento,
  aprobarSolicitudComoEstablecimiento,
  obtenerTodosEstablecimientosAdmin,
  actualizarEstablecimiento,
  eliminarEstablecimiento,
} from '@/lib/firestore'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const TIPOS_LABEL: Record<string, string> = {
  GASOLINERA: '⛽ Gasolinera', TALLER: '🔧 Taller',
  MONTALLANTAS: '🛞 Montallantas', REPUESTOS: '⚙️ Repuestos',
  GRUA: '🚛 Grúa', PARQUEADERO: '🅿️ Parqueadero',
  CENTRO_ASISTENCIA: '🆘 Asistencia', AMBULANCIA: '🚑 Ambulancia',
}

const ESTADO_SOLICITUD: Record<string, { label: string; color: string }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  EN_REVISION: { label: 'En revisión', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  APROBADA:    { label: 'Aprobada',    color: 'bg-accent-500/20 text-accent-300 border-accent-500/30' },
  RECHAZADA:   { label: 'Rechazada',   color: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

export default function AdminEstablecimientosPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'solicitudes' | 'establecimientos'>('solicitudes')
  const [solicitudes, setSolicitudes]           = useState<any[]>([])
  const [establecimientos, setEstablecimientos] = useState<any[]>([])
  const [cargando, setCargando]                 = useState(true)
  const [expandido, setExpandido]               = useState<string | null>(null)
  const [procesando, setProcesando]             = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo]       = useState('')
  const [rechazando, setRechazando]             = useState<string | null>(null)

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  const cargar = async () => {
    setCargando(true)
    const [s, e] = await Promise.all([
      obtenerSolicitudesEstablecimiento(),
      obtenerTodosEstablecimientosAdmin(),
    ])
    setSolicitudes(s)
    setEstablecimientos(e)
    setCargando(false)
  }

  useEffect(() => { if (esAdmin) cargar() }, [esAdmin])

  const aprobar = async (sol: any) => {
    setProcesando(sol.id)
    try {
      await aprobarSolicitudComoEstablecimiento(sol)
      toast.success(`"${sol.nombre}" agregado al mapa. Pendiente de verificación.`)
      await cargar()
    } catch { toast.error('Error al aprobar') }
    finally { setProcesando(null) }
  }

  const rechazar = async (sol: any) => {
    if (!motivoRechazo.trim()) { toast.error('Escribe el motivo del rechazo'); return }
    setProcesando(sol.id)
    try {
      await actualizarSolicitudEstablecimiento(sol.id, {
        estado: 'RECHAZADA',
        motivo_rechazo: motivoRechazo,
      })
      toast.success('Solicitud rechazada')
      setRechazando(null)
      setMotivoRechazo('')
      await cargar()
    } catch { toast.error('Error al rechazar') }
    finally { setProcesando(null) }
  }

  const marcarEnRevision = async (id: string) => {
    await actualizarSolicitudEstablecimiento(id, { estado: 'EN_REVISION' })
    await cargar()
    toast.success('Marcado en revisión')
  }

  const verificarEstablecimiento = async (id: string, verificado: boolean) => {
    setProcesando(id)
    try {
      await actualizarEstablecimiento(id, { verificado, activo: verificado })
      toast.success(verificado ? '✓ Establecimiento verificado y visible en el mapa' : 'Establecimiento desactivado')
      await cargar()
    } catch { toast.error('Error') }
    finally { setProcesando(null) }
  }

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    await eliminarEstablecimiento(id)
    toast.success('Eliminado')
    await cargar()
  }

  if (authCargando || !esAdmin) return null

  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE' || s.estado === 'EN_REVISION')

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-4xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Establecimientos</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {pendientes.length > 0 && (
                <span className="text-yellow-300 font-semibold">{pendientes.length} solicitud{pendientes.length > 1 ? 'es' : ''} pendiente{pendientes.length > 1 ? 's' : ''} · </span>
              )}
              {establecimientos.length} registrados
            </p>
          </div>
          <button onClick={cargar} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-700 p-1 rounded-xl">
          <button onClick={() => setTab('solicitudes')}
            className={cn('flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
              tab === 'solicitudes' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
            📋 Solicitudes
            {pendientes.length > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-dark-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendientes.length}
              </span>
            )}
          </button>
          <button onClick={() => setTab('establecimientos')}
            className={cn('flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
              tab === 'establecimientos' ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
            📍 Mapa ({establecimientos.length})
          </button>
        </div>

        {cargando ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : (

          /* ── TAB: SOLICITUDES ── */
          tab === 'solicitudes' ? (
            <div className="space-y-3">
              {solicitudes.length === 0 ? (
                <div className="text-center py-10 card border border-white/10">
                  <p className="text-white/40">No hay solicitudes</p>
                </div>
              ) : solicitudes.map(sol => {
                const estadoInfo = ESTADO_SOLICITUD[sol.estado] || ESTADO_SOLICITUD.PENDIENTE
                const abierto = expandido === sol.id
                return (
                  <div key={sol.id} className="card border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn('text-xs px-2 py-0.5 rounded-lg border', estadoInfo.color)}>
                            {estadoInfo.label}
                          </span>
                          <span className="text-white/40 text-xs">{TIPOS_LABEL[sol.tipo] || sol.tipo}</span>
                          {sol.tipo === 'AMBULANCIA' && (
                            <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-lg">
                              🚑 Requiere habilitación
                            </span>
                          )}
                        </div>
                        <p className="text-white font-semibold">{sol.nombre}</p>
                        <p className="text-white/40 text-xs">{sol.ciudad}{sol.localidad ? ` · ${sol.localidad}` : ''} · {sol.direccion}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          Solicitado por: {sol.nombre_solicitante} · {sol.email_solicitante}
                        </p>
                      </div>
                      <button onClick={() => setExpandido(abierto ? null : sol.id)}
                        className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/10 shrink-0">
                        {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Detalles expandidos */}
                    {abierto && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {sol.telefono && <p className="text-white/60">📞 {sol.telefono}</p>}
                          {sol.whatsapp && <p className="text-white/60">💬 {sol.whatsapp}</p>}
                          {sol.horarios && <p className="text-white/60">🕐 {sol.horarios}</p>}
                          {sol.nit && <p className="text-white/60">NIT: {sol.nit}</p>}
                          {sol.representante && <p className="text-white/60">Rep: {sol.representante}</p>}
                          {sol.es_24_horas && <p className="text-green-400">✓ 24 horas</p>}
                          {sol.servicio_domicilio && <p className="text-green-400">✓ A domicilio</p>}
                        </div>
                        {sol.habilitacion_legal && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-300 text-xs font-semibold">Habilitación legal</p>
                            <p className="text-white text-sm">{sol.habilitacion_legal}</p>
                          </div>
                        )}
                        {sol.descripcion && <p className="text-white/60 text-xs">{sol.descripcion}</p>}
                        {sol.servicios && sol.servicios.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sol.servicios.map((s: string) => (
                              <span key={s} className="text-[10px] bg-dark-700 text-white/40 px-2 py-0.5 rounded-lg">{s}</span>
                            ))}
                          </div>
                        )}
                        {sol.motivo_rechazo && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-300 text-xs">Motivo de rechazo: {sol.motivo_rechazo}</p>
                          </div>
                        )}

                        {/* Acciones */}
                        {(sol.estado === 'PENDIENTE' || sol.estado === 'EN_REVISION') && (
                          <div className="space-y-2 pt-1">
                            {rechazando === sol.id ? (
                              <div className="space-y-2">
                                <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)}
                                  className="input-field resize-none h-16 text-sm"
                                  placeholder="Motivo del rechazo (requerido)..." />
                                <div className="flex gap-2">
                                  <button onClick={() => { setRechazando(null); setMotivoRechazo('') }}
                                    className="flex-1 btn-secondary text-sm py-2">Cancelar</button>
                                  <button onClick={() => rechazar(sol)} disabled={procesando === sol.id}
                                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-colors">
                                    Confirmar rechazo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 flex-wrap">
                                {sol.estado === 'PENDIENTE' && (
                                  <button onClick={() => marcarEnRevision(sol.id)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold transition-colors hover:bg-blue-500/30">
                                    <Eye className="w-3 h-3" /> En revisión
                                  </button>
                                )}
                                <button onClick={() => setRechazando(sol.id)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold transition-colors hover:bg-red-500/30">
                                  <XCircle className="w-3 h-3" /> Rechazar
                                </button>
                                <button onClick={() => aprobar(sol)} disabled={procesando === sol.id}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-xl text-xs font-semibold transition-colors hover:bg-accent-500/30">
                                  <CheckCircle className="w-3 h-3" />
                                  {procesando === sol.id ? 'Procesando...' : 'Aprobar y agregar'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (

            /* ── TAB: ESTABLECIMIENTOS ── */
            <div className="space-y-3">
              {establecimientos.length === 0 ? (
                <div className="text-center py-10 card border border-white/10">
                  <p className="text-white/40">No hay establecimientos registrados</p>
                </div>
              ) : establecimientos.map(est => (
                <div key={est.id} className="card border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {est.verificado
                          ? <span className="flex items-center gap-1 text-xs bg-accent-500/20 text-accent-300 border border-accent-500/30 px-2 py-0.5 rounded-lg">
                              <Shield className="w-3 h-3" /> Verificado
                            </span>
                          : <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-lg">
                              Sin verificar
                            </span>
                        }
                        {!est.activo && (
                          <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-lg">Inactivo</span>
                        )}
                        <span className="text-white/40 text-xs">{TIPOS_LABEL[est.tipo] || est.tipo}</span>
                        {est.nombre.startsWith('[DEMO]') && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg">DEMO</span>
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm">{est.nombre}</p>
                      <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {est.ciudad}{est.localidad ? ` · ${est.localidad}` : ''} · {est.direccion}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!est.verificado ? (
                        <button onClick={() => verificarEstablecimiento(est.id, true)}
                          disabled={procesando === est.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-xl text-xs font-semibold transition-colors hover:bg-accent-500/30">
                          <Shield className="w-3 h-3" />
                          {procesando === est.id ? '...' : 'Verificar'}
                        </button>
                      ) : (
                        <button onClick={() => verificarEstablecimiento(est.id, false)}
                          disabled={procesando === est.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-xl text-xs transition-colors hover:bg-yellow-500/30">
                          Desactivar
                        </button>
                      )}
                      <button onClick={() => eliminar(est.id, est.nombre)}
                        className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
