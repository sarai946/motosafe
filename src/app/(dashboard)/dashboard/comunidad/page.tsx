'use client'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users, Calendar, MapPin, ChevronRight, Plus, Globe, Lock,
  Save, X, UserPlus, UserMinus, Clock,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerClubes, crearClub, unirseAClub, salirDeClub, obtenerEventos, crearEvento } from '@/lib/firestore'
import type { ClubMotero, EventoMotero } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Schemas ──────────────────────────────────────────────────
const schemaClub = z.object({
  nombre:      z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  ciudad:      z.string().min(2, 'Ciudad requerida'),
  esPrivado:   z.boolean(),
})

const schemaEvento = z.object({
  titulo:      z.string().min(3, 'Título requerido'),
  descripcion: z.string().min(5, 'Descripción requerida'),
  fechaInicio: z.string().min(1, 'Fecha requerida'),
  fechaFin:    z.string().optional(),
  ubicacion:   z.string().min(3, 'Ubicación requerida'),
  esPublico:   z.boolean(),
})

type FormClub   = z.infer<typeof schemaClub>
type FormEvento = z.infer<typeof schemaEvento>

function formatFechaEvento(val: any): string {
  if (!val) return '—'
  if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  if (val instanceof Date) return val.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  if (typeof val === 'string') return new Date(val).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  return '—'
}

export default function ComunidadPage() {
  const { user } = useAuth()
  const [clubes,   setClubes]   = useState<ClubMotero[]>([])
  const [eventos,  setEventos]  = useState<EventoMotero[]>([])
  const [cargando, setCargando] = useState(true)
  const [tab,      setTab]      = useState<'clubes' | 'eventos'>('clubes')

  const [mostrarFormClub,   setMostrarFormClub]   = useState(false)
  const [mostrarFormEvento, setMostrarFormEvento] = useState(false)
  const [creandoClub,       setCreandoClub]       = useState(false)
  const [creandoEvento,     setCreandoEvento]     = useState(false)
  const [clubDetalle,       setClubDetalle]       = useState<ClubMotero | null>(null)

  const { register: regC, handleSubmit: handleC, reset: resetC, formState: { errors: errC } } =
    useForm<FormClub>({ resolver: zodResolver(schemaClub), defaultValues: { esPrivado: false } })

  const { register: regE, handleSubmit: handleE, reset: resetE, formState: { errors: errE } } =
    useForm<FormEvento>({ resolver: zodResolver(schemaEvento), defaultValues: { esPublico: true } })

  const cargar = async () => {
    const [c, e] = await Promise.all([obtenerClubes(), obtenerEventos()])
    setClubes(c)
    setEventos(e)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  // ── Crear club ──
  const onCrearClub = async (data: FormClub) => {
    if (!user) return
    setCreandoClub(true)
    try {
      await crearClub({ ...data, adminId: user.uid, miembros: [user.uid] })
      await cargar()
      setMostrarFormClub(false)
      resetC()
      toast.success('Club creado exitosamente 🏍️')
    } catch { toast.error('Error al crear el club') }
    finally { setCreandoClub(false) }
  }

  // ── Unirse / salir club ──
  const toggleMembresia = async (club: ClubMotero) => {
    if (!user) return
    const esMiembro = club.miembros.includes(user.uid)
    if (esMiembro) {
      if (club.adminId === user.uid) {
        toast.error('Eres el administrador del club. No puedes salir.')
        return
      }
      await salirDeClub(club.id, user.uid)
      toast.success('Saliste del club')
    } else {
      await unirseAClub(club.id, user.uid)
      toast.success(`Te uniste a ${club.nombre} 🏍️`)
    }
    await cargar()
    if (clubDetalle?.id === club.id) {
      const updated = (await obtenerClubes()).find(c => c.id === club.id)
      if (updated) setClubDetalle(updated)
    }
  }

  // ── Crear evento ──
  const onCrearEvento = async (data: FormEvento) => {
    if (!user) return
    setCreandoEvento(true)
    try {
      await crearEvento({
        titulo:         data.titulo,
        descripcion:    data.descripcion,
        fechaInicio:    new Date(data.fechaInicio),
        fechaFin:       data.fechaFin ? new Date(data.fechaFin) : undefined,
        ubicacion:      data.ubicacion,
        organizadorId:  user.uid,
        participantes:  [user.uid],
        esPublico:      data.esPublico,
      })
      await cargar()
      setMostrarFormEvento(false)
      resetE()
      toast.success('Evento creado 📅')
    } catch { toast.error('Error al crear el evento') }
    finally { setCreandoEvento(false) }
  }

  // ── Vista detalle de club ──
  if (clubDetalle) {
    const esMiembro = user ? clubDetalle.miembros.includes(user.uid) : false
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setClubDetalle(null)}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              ← Volver
            </button>
            <h1 className="text-white font-display font-bold text-xl">{clubDetalle.nombre}</h1>
          </div>
          <div className="card border border-white/10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center shrink-0">
                {clubDetalle.logoUrl
                  ? <img src={clubDetalle.logoUrl} alt={clubDetalle.nombre} className="w-14 h-14 rounded-2xl object-cover" />
                  : <Users className="w-7 h-7 text-primary-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-bold">{clubDetalle.nombre}</h2>
                  {clubDetalle.esPrivado
                    ? <Lock className="w-3 h-3 text-white/30" />
                    : <Globe className="w-3 h-3 text-accent-400" />}
                </div>
                <p className="text-white/40 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {clubDetalle.ciudad}
                </p>
                <p className="text-primary-300 text-xs">{clubDetalle.miembros.length} miembro{clubDetalle.miembros.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {clubDetalle.descripcion && (
              <p className="text-white/60 text-sm leading-relaxed">{clubDetalle.descripcion}</p>
            )}
            {user && (
              <button
                onClick={() => toggleMembresia(clubDetalle)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors',
                  esMiembro
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                    : 'btn-primary'
                )}
              >
                {esMiembro
                  ? <><UserMinus className="w-4 h-4" /> Salir del club</>
                  : <><UserPlus  className="w-4 h-4" /> Unirme al club</>}
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Comunidad motera</h1>
            <p className="text-white/40 text-sm mt-1">Clubs, eventos y rutas</p>
          </div>
          {tab === 'clubes' && (
            <button onClick={() => setMostrarFormClub(!mostrarFormClub)}
              className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear club
            </button>
          )}
          {tab === 'eventos' && (
            <button onClick={() => setMostrarFormEvento(!mostrarFormEvento)}
              className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Crear evento
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-700 p-1 rounded-xl">
          {[
            { valor: 'clubes',  label: `🏍️ Clubs (${clubes.length})` },
            { valor: 'eventos', label: `📅 Eventos (${eventos.length})` },
          ].map(t => (
            <button key={t.valor} onClick={() => setTab(t.valor as any)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t.valor ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Formulario crear club ── */}
        {tab === 'clubes' && mostrarFormClub && (
          <form onSubmit={handleC(onCrearClub)} className="card border border-primary-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Crear nuevo club</h2>
              <button type="button" onClick={() => setMostrarFormClub(false)}
                className="p-1 text-white/30 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="input-label">Nombre del club *</label>
              <input {...regC('nombre')} className="input-field" placeholder="Riders de Bogotá" />
              {errC.nombre && <p className="text-red-400 text-xs mt-1">{errC.nombre.message}</p>}
            </div>
            <div>
              <label className="input-label">Ciudad *</label>
              <input {...regC('ciudad')} className="input-field" placeholder="Bogotá" />
              {errC.ciudad && <p className="text-red-400 text-xs mt-1">{errC.ciudad.message}</p>}
            </div>
            <div>
              <label className="input-label">Descripción (opcional)</label>
              <textarea {...regC('descripcion')} className="input-field resize-none h-16"
                placeholder="Club de motociclistas apasionados por las rutas de montaña..." />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...regC('esPrivado')} className="w-4 h-4 accent-primary-500" />
              <span className="text-white/70 text-sm">Club privado (solo por invitación)</span>
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarFormClub(false)} className="btn-secondary text-sm py-2">Cancelar</button>
              <button type="submit" disabled={creandoClub} className="btn-primary text-sm py-2 flex items-center gap-2">
                <Save className="w-4 h-4" />
                {creandoClub ? 'Creando...' : 'Crear club'}
              </button>
            </div>
          </form>
        )}

        {/* ── Tab Clubes ── */}
        {tab === 'clubes' && (
          <div className="space-y-3">
            {cargando ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)
            ) : clubes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 font-medium">No hay clubs registrados aún</p>
                <p className="text-white/20 text-sm mt-1">¡Sé el primero en crear tu club motero!</p>
              </div>
            ) : (
              clubes.map(club => {
                const esMiembro = user ? club.miembros.includes(user.uid) : false
                return (
                  <div key={club.id} className="card border border-white/10 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-2xl flex items-center justify-center shrink-0">
                        {club.logoUrl
                          ? <img src={club.logoUrl} alt={club.nombre} className="w-12 h-12 rounded-2xl object-cover" />
                          : <Users className="w-6 h-6 text-primary-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold truncate">{club.nombre}</h3>
                          {club.esPrivado
                            ? <Lock className="w-3 h-3 text-white/30 shrink-0" />
                            : <Globe className="w-3 h-3 text-accent-400 shrink-0" />}
                          {esMiembro && (
                            <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/20 shrink-0 text-[10px]">Miembro</span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {club.ciudad} · {club.miembros.length} miembro{club.miembros.length !== 1 ? 's' : ''}
                        </p>
                        {club.descripcion && (
                          <p className="text-white/30 text-xs mt-0.5 line-clamp-1">{club.descripcion}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => setClubDetalle(club)}
                          className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Ver detalle">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {user && (
                          <button
                            onClick={() => toggleMembresia(club)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              esMiembro
                                ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                                : 'text-accent-400/60 hover:text-accent-400 hover:bg-accent-500/10'
                            )}
                            title={esMiembro ? 'Salir del club' : 'Unirme'}
                          >
                            {esMiembro ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Formulario crear evento ── */}
        {tab === 'eventos' && mostrarFormEvento && (
          <form onSubmit={handleE(onCrearEvento)} className="card border border-primary-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Crear nuevo evento</h2>
              <button type="button" onClick={() => setMostrarFormEvento(false)}
                className="p-1 text-white/30 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="input-label">Título *</label>
              <input {...regE('titulo')} className="input-field" placeholder="Ruta a las montañas de Sumapaz" />
              {errE.titulo && <p className="text-red-400 text-xs mt-1">{errE.titulo.message}</p>}
            </div>
            <div>
              <label className="input-label">Descripción *</label>
              <textarea {...regE('descripcion')} className="input-field resize-none h-20"
                placeholder="Únete a nuestra ruta de domingo..." />
              {errE.descripcion && <p className="text-red-400 text-xs mt-1">{errE.descripcion.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Fecha inicio *</label>
                <input {...regE('fechaInicio')} type="datetime-local" className="input-field" />
                {errE.fechaInicio && <p className="text-red-400 text-xs mt-1">{errE.fechaInicio.message}</p>}
              </div>
              <div>
                <label className="input-label">Fecha fin (opcional)</label>
                <input {...regE('fechaFin')} type="datetime-local" className="input-field" />
              </div>
            </div>
            <div>
              <label className="input-label">Punto de encuentro *</label>
              <input {...regE('ubicacion')} className="input-field" placeholder="Parque Nacional, Bogotá" />
              {errE.ubicacion && <p className="text-red-400 text-xs mt-1">{errE.ubicacion.message}</p>}
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...regE('esPublico')} className="w-4 h-4 accent-primary-500" />
              <span className="text-white/70 text-sm">Evento público (visible para todos)</span>
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setMostrarFormEvento(false)} className="btn-secondary text-sm py-2">Cancelar</button>
              <button type="submit" disabled={creandoEvento} className="btn-primary text-sm py-2 flex items-center gap-2">
                <Save className="w-4 h-4" />
                {creandoEvento ? 'Creando...' : 'Crear evento'}
              </button>
            </div>
          </form>
        )}

        {/* ── Tab Eventos ── */}
        {tab === 'eventos' && (
          <div className="space-y-3">
            {cargando ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)
            ) : eventos.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 font-medium">No hay eventos próximos</p>
                <p className="text-white/20 text-sm mt-1">¡Crea el primer evento de la comunidad!</p>
              </div>
            ) : (
              eventos.map(evento => (
                <div key={evento.id} className="card border border-white/10 hover:border-primary-500/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold text-sm">{evento.titulo}</h3>
                        {!evento.esPublico && (
                          <span className="badge bg-dark-600 text-white/30 border border-white/10">Privado</span>
                        )}
                      </div>
                      <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{evento.descripcion}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        <span className="text-primary-300 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatFechaEvento(evento.fechaInicio)}
                        </span>
                        <span className="text-white/30 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {evento.ubicacion}
                        </span>
                        <span className="text-white/20 text-xs">
                          {evento.participantes.length} participante{evento.participantes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
