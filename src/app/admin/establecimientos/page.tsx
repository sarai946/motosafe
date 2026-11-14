'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Map, Plus, Edit2, Trash2, Save, X, Search,
  Phone, MapPin, Star, CheckCircle, XCircle, ExternalLink,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import {
  obtenerTodosEstablecimientos,
  crearEstablecimiento,
  actualizarEstablecimiento,
  eliminarEstablecimiento,
} from '@/lib/firestore'
import type { Establecimiento, TipoEstablecimiento } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIPOS: { valor: TipoEstablecimiento; label: string; emoji: string }[] = [
  { valor: 'GASOLINERA',       label: 'Gasolinera',        emoji: '⛽' },
  { valor: 'TALLER',           label: 'Taller',            emoji: '🔧' },
  { valor: 'MONTALLANTAS',     label: 'Montallantas',      emoji: '🔄' },
  { valor: 'REPUESTOS',        label: 'Repuestos',         emoji: '⚙️' },
  { valor: 'GRUA',             label: 'Grúa',              emoji: '🚛' },
  { valor: 'PARQUEADERO',      label: 'Parqueadero',       emoji: '🅿️' },
  { valor: 'CENTRO_ASISTENCIA',label: 'Centro asistencia', emoji: '🏥' },
  { valor: 'OTRO',             label: 'Otro',              emoji: '📍' },
]

const schema = z.object({
  nombre:     z.string().min(2, 'Nombre requerido'),
  tipo:       z.enum(['GASOLINERA','TALLER','MONTALLANTAS','REPUESTOS','GRUA','PARQUEADERO','CENTRO_ASISTENCIA','OTRO']),
  descripcion:z.string().optional(),
  direccion:  z.string().min(5, 'Dirección requerida'),
  ciudad:     z.string().min(2, 'Ciudad requerida'),
  lat:        z.coerce.number().min(-90).max(90),
  lng:        z.coerce.number().min(-180).max(180),
  telefono:   z.string().optional(),
  whatsapp:   z.string().optional(),
  horarios:   z.string().optional(),
  calificacion: z.coerce.number().min(1).max(5).optional(),
  verificado: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminEstablecimientosPage() {
  const { esAdmin, cargando: authCargando } = useAuth()
  const router = useRouter()
  const [items, setItems]           = useState<Establecimiento[]>([])
  const [cargando, setCargando]     = useState(true)
  const [busqueda, setBusqueda]     = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoEstablecimiento | 'TODOS'>('TODOS')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]     = useState<Establecimiento | null>(null)
  const [guardando, setGuardando]   = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'TALLER', verificado: true, lat: 4.711, lng: -74.0721 },
  })

  useEffect(() => {
    if (!authCargando && !esAdmin) router.push('/dashboard')
  }, [esAdmin, authCargando, router])

  useEffect(() => {
    if (!esAdmin) return
    obtenerTodosEstablecimientos().then(e => { setItems(e); setCargando(false) })
  }, [esAdmin])

  const abrirNuevo = () => {
    setEditando(null)
    reset({ tipo: 'TALLER', verificado: true, lat: 4.711, lng: -74.0721 })
    setMostrarForm(true)
  }

  const abrirEditar = (est: Establecimiento) => {
    setEditando(est)
    reset({
      nombre: est.nombre, tipo: est.tipo, descripcion: est.descripcion || '',
      direccion: est.direccion, ciudad: est.ciudad,
      lat: est.ubicacion.lat, lng: est.ubicacion.lng,
      telefono: est.telefono || '', whatsapp: est.whatsapp || '',
      horarios: est.horarios || '',
      calificacion: est.calificacion ?? undefined,
      verificado: est.verificado,
    })
    setMostrarForm(true)
  }

  const onSubmit = async (data: FormData) => {
    setGuardando(true)
    try {
      const payload: Omit<Establecimiento, 'id' | 'createdAt'> = {
        nombre: data.nombre, tipo: data.tipo,
        descripcion: data.descripcion || undefined,
        direccion: data.direccion, ciudad: data.ciudad,
        ubicacion: { lat: data.lat, lng: data.lng },
        telefono: data.telefono || undefined,
        whatsapp: data.whatsapp || undefined,
        horarios: data.horarios || undefined,
        calificacion: data.calificacion ?? undefined,
        verificado: data.verificado,
      }
      if (editando) {
        await actualizarEstablecimiento(editando.id, payload)
        toast.success('Establecimiento actualizado')
      } else {
        await crearEstablecimiento(payload)
        toast.success('Establecimiento creado')
      }
      const e = await obtenerTodosEstablecimientos()
      setItems(e)
      setMostrarForm(false)
      setEditando(null)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const onEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este establecimiento? Esta acción no se puede deshacer.')) return
    await eliminarEstablecimiento(id)
    setItems(prev => prev.filter(e => e.id !== id))
    toast.success('Eliminado')
  }

  const toggleVerificado = async (est: Establecimiento) => {
    await actualizarEstablecimiento(est.id, { verificado: !est.verificado })
    setItems(prev => prev.map(e => e.id === est.id ? { ...e, verificado: !e.verificado } : e))
    toast.success(est.verificado ? 'Marcado como no verificado' : 'Verificado ✓')
  }

  const filtrados = items.filter(e => {
    const matchTipo = filtroTipo === 'TODOS' || e.tipo === filtroTipo
    const matchBusq = busqueda === '' ||
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.ciudad.toLowerCase().includes(busqueda.toLowerCase())
    return matchTipo && matchBusq
  })

  if (authCargando || !esAdmin) return null

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white font-display font-bold text-2xl flex items-center gap-2">
              <Map className="w-6 h-6 text-primary-400" /> Establecimientos
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              {items.length} registrados · {items.filter(e => e.verificado).length} verificados
            </p>
          </div>
          <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus className="w-4 h-4" /> Nuevo establecimiento
          </button>
        </div>

        {/* Formulario */}
        {mostrarForm && (
          <div className="card border border-primary-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {editando ? 'Editar establecimiento' : 'Nuevo establecimiento'}
              </h2>
              <button onClick={() => { setMostrarForm(false); setEditando(null) }}
                className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="input-label">Nombre *</label>
                  <input {...register('nombre')} className="input-field" placeholder="Taller Moto Centro" />
                  {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="input-label">Tipo *</label>
                  <select {...register('tipo')} className="input-field">
                    {TIPOS.map(t => (
                      <option key={t.valor} value={t.valor}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Ciudad *</label>
                  <input {...register('ciudad')} className="input-field" placeholder="Bogotá" />
                  {errors.ciudad && <p className="text-red-400 text-xs mt-1">{errors.ciudad.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="input-label">Dirección *</label>
                  <input {...register('direccion')} className="input-field" placeholder="Calle 80 # 45-23" />
                  {errors.direccion && <p className="text-red-400 text-xs mt-1">{errors.direccion.message}</p>}
                </div>
                <div>
                  <label className="input-label">Latitud *</label>
                  <input {...register('lat')} type="number" step="any" className="input-field" placeholder="4.711" />
                  {errors.lat && <p className="text-red-400 text-xs mt-1">Latitud inválida</p>}
                </div>
                <div>
                  <label className="input-label">Longitud *</label>
                  <input {...register('lng')} type="number" step="any" className="input-field" placeholder="-74.072" />
                  {errors.lng && <p className="text-red-400 text-xs mt-1">Longitud inválida</p>}
                </div>
                <div>
                  <label className="input-label">Teléfono</label>
                  <input {...register('telefono')} className="input-field" placeholder="6013456789" />
                </div>
                <div>
                  <label className="input-label">WhatsApp</label>
                  <input {...register('whatsapp')} className="input-field" placeholder="3001234567" />
                </div>
                <div>
                  <label className="input-label">Horarios</label>
                  <input {...register('horarios')} className="input-field" placeholder="Lun-Sáb 8am-6pm" />
                </div>
                <div>
                  <label className="input-label">Calificación (1-5)</label>
                  <input {...register('calificacion')} type="number" min={1} max={5} step={0.1} className="input-field" placeholder="4.5" />
                </div>
                <div className="sm:col-span-2">
                  <label className="input-label">Descripción</label>
                  <textarea {...register('descripcion')} className="input-field resize-none h-16"
                    placeholder="Descripción breve del servicio..." />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register('verificado')} className="w-4 h-4 accent-primary-500" />
                    <span className="text-white/70 text-sm">Marcar como verificado (visible en el mapa)</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-white/30 text-xs">
                    💡 Para obtener coordenadas: busca la dirección en{' '}
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                      className="text-primary-400 underline inline-flex items-center gap-0.5">
                      Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                    , haz clic derecho sobre el punto y copia las coordenadas.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setMostrarForm(false); setEditando(null) }}
                  className="btn-secondary text-sm py-2">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primary text-sm py-2 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" placeholder="Buscar por nombre o ciudad..." />
          </div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)}
            className="input-field sm:w-48">
            <option value="TODOS">Todos los tipos</option>
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.emoji} {t.label}</option>)}
          </select>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Map className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-medium">
              {items.length === 0 ? 'No hay establecimientos registrados' : 'Sin resultados para esta búsqueda'}
            </p>
            <p className="text-white/20 text-sm mt-1">
              {items.length === 0 && 'Agrega el primero con el botón superior'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(est => {
              const tipoInfo = TIPOS.find(t => t.valor === est.tipo) || TIPOS[TIPOS.length - 1]
              return (
                <div key={est.id} className="card border border-white/10 hover:border-primary-500/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-dark-700 rounded-xl flex items-center justify-center text-xl shrink-0">
                      {tipoInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm truncate">{est.nombre}</span>
                        {est.verificado
                          ? <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20 shrink-0">✓ Verificado</span>
                          : <span className="badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 shrink-0">Pendiente</span>}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">
                        {tipoInfo.label} · <MapPin className="w-3 h-3 inline" /> {est.ciudad} · {est.direccion}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {est.telefono && (
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {est.telefono}
                          </span>
                        )}
                        {est.calificacion && (
                          <span className="text-yellow-400 text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400" /> {est.calificacion}/5
                          </span>
                        )}
                        <span className="text-white/20 text-xs">
                          {est.ubicacion.lat.toFixed(4)}, {est.ubicacion.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleVerificado(est)}
                        title={est.verificado ? 'Quitar verificación' : 'Verificar'}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          est.verificado
                            ? 'text-accent-400 hover:bg-accent-500/10'
                            : 'text-white/30 hover:text-accent-400 hover:bg-accent-500/10'
                        )}>
                        {est.verificado ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => abrirEditar(est)}
                        className="p-2 text-white/30 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEliminar(est.id)}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
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
