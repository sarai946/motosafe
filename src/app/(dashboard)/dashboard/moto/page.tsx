'use client'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bike, Save, Edit2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { obtenerMotocicleta, guardarMotocicleta, guardarVencimientosDocumentos } from '@/lib/firestore'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const schemaMoto = z.object({
  placa:      z.string().min(5).max(8),
  marca:      z.string().min(2),
  modelo:     z.string().min(2),
  cilindraje: z.string().min(1),
  color:      z.string().min(2),
  anio:       z.coerce.number().min(1980).max(new Date().getFullYear() + 1),
})

const schemaVencimientos = z.object({
  soatVencimiento:   z.string().optional(),
  licenciaVencimiento: z.string().optional(),
})

type FormMoto         = z.infer<typeof schemaMoto>
type FormVencimientos = z.infer<typeof schemaVencimientos>

const MARCAS = [
  'Honda','Yamaha','Suzuki','Kawasaki','KTM','BMW','Ducati',
  'Royal Enfield','TVS','Bajaj','Auteco','AKT','Hero','Pulsar','Otra',
]

function diasHastaVencimiento(fechaStr: string | Date | undefined): number | null {
  if (!fechaStr) return null
  const fecha = fechaStr instanceof Date ? fechaStr : new Date(fechaStr)
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function estadoVencimiento(dias: number | null) {
  if (dias === null) return { color: 'text-white/30', bg: 'bg-dark-700', label: 'No registrado', icon: null }
  if (dias < 0)      return { color: 'text-red-400',    bg: 'bg-red-500/10',    label: `Vencido hace ${Math.abs(dias)} días`, icon: 'danger' }
  if (dias <= 30)    return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: `Vence en ${dias} días`,               icon: 'warning' }
  return               { color: 'text-accent-400',   bg: 'bg-accent-500/10',  label: `Vence en ${dias} días`,               icon: 'ok' }
}

function toISODate(val: Date | string | undefined): string {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
}

export default function MotoPage() {
  const { user } = useAuth()
  const [moto, setMoto]         = useState<any>(null)
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando]   = useState(false)
  const [guardandoVenc, setGuardandoVenc] = useState(false)
  const [tab, setTab] = useState<'datos' | 'documentos'>('datos')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormMoto>({
    resolver: zodResolver(schemaMoto),
  })
  const { register: regV, handleSubmit: handleV, reset: resetV } = useForm<FormVencimientos>({
    resolver: zodResolver(schemaVencimientos),
  })

  const cargar = async () => {
    if (!user) return
    const m = await obtenerMotocicleta(user.uid)
    setMoto(m)
    if (m) {
      reset({ placa: m.placa, marca: m.marca, modelo: m.modelo, cilindraje: m.cilindraje, color: m.color, anio: m.anio })
      resetV({
        soatVencimiento:    toISODate(m.soatVencimiento),
        licenciaVencimiento: toISODate(m.licenciaVencimiento),
      })
    } else {
      setEditando(true)
    }
    setCargando(false)
  }

  useEffect(() => { cargar() }, [user]) // eslint-disable-line

  const onGuardarMoto = async (data: FormMoto) => {
    if (!user) return
    setGuardando(true)
    try {
      await guardarMotocicleta(user.uid, { ...data, placa: data.placa.toUpperCase() })
      await cargar()
      setEditando(false)
      toast.success('Motocicleta guardada')
    } catch { toast.error('Error al guardar') }
    finally { setGuardando(false) }
  }

  const onGuardarVencimientos = async (data: FormVencimientos) => {
    if (!user) return
    setGuardandoVenc(true)
    try {
      await guardarVencimientosDocumentos(user.uid, {
        soatVencimiento:    data.soatVencimiento || undefined,
        licenciaVencimiento: data.licenciaVencimiento || undefined,
      })
      await cargar()
      toast.success('Documentos guardados')
    } catch { toast.error('Error al guardar') }
    finally { setGuardandoVenc(false) }
  }

  if (cargando) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Mi motocicleta</h1>
            <p className="text-white/40 text-sm mt-1">
              {moto ? `${moto.marca} ${moto.modelo} · ${moto.placa}` : 'Registra tu moto'}
            </p>
          </div>
          {moto && !editando && tab === 'datos' && (
            <button onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-2 text-sm py-2">
              <Edit2 className="w-4 h-4" /> Editar
            </button>
          )}
        </div>

        {moto && (
          <div className="flex gap-1 bg-dark-700 p-1 rounded-xl">
            {([
              { valor: 'datos',      label: '🏍️ Datos' },
              { valor: 'documentos', label: '📄 Documentos' },
            ] as const).map(t => (
              <button key={t.valor} onClick={() => setTab(t.valor)}
                className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                  tab === t.valor ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white')}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── TAB: Datos básicos ── */}
        {tab === 'datos' && (
          <>
            {!editando && moto ? (
              <div className="card border border-white/10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-accent-500/20 rounded-2xl flex items-center justify-center">
                    <Bike className="w-7 h-7 text-accent-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl">{moto.marca} {moto.modelo}</h2>
                    <p className="text-accent-400 font-bold text-lg">{moto.placa}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Placa',      value: moto.placa },
                    { label: 'Marca',      value: moto.marca },
                    { label: 'Modelo',     value: moto.modelo },
                    { label: 'Cilindraje', value: moto.cilindraje },
                    { label: 'Color',      value: moto.color },
                    { label: 'Año',        value: String(moto.anio) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-white/40 text-xs mb-0.5">{item.label}</p>
                      <p className="text-white font-medium text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onGuardarMoto)} className="card border border-white/10 space-y-4">
                <h2 className="text-white font-semibold">{moto ? 'Editar datos' : 'Registrar motocicleta'}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Placa *</label>
                    <input {...register('placa')} className="input-field uppercase" placeholder="ABC123" />
                    {errors.placa && <p className="text-red-400 text-xs mt-1">Placa inválida</p>}
                  </div>
                  <div>
                    <label className="input-label">Año *</label>
                    <input {...register('anio')} type="number" className="input-field" placeholder="2022" />
                    {errors.anio && <p className="text-red-400 text-xs mt-1">Año inválido</p>}
                  </div>
                  <div>
                    <label className="input-label">Marca *</label>
                    <select {...register('marca')} className="input-field">
                      <option value="">Seleccionar...</option>
                      {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.marca && <p className="text-red-400 text-xs mt-1">Requerido</p>}
                  </div>
                  <div>
                    <label className="input-label">Modelo *</label>
                    <input {...register('modelo')} className="input-field" placeholder="CB 500F" />
                    {errors.modelo && <p className="text-red-400 text-xs mt-1">Requerido</p>}
                  </div>
                  <div>
                    <label className="input-label">Cilindraje *</label>
                    <input {...register('cilindraje')} className="input-field" placeholder="500cc" />
                    {errors.cilindraje && <p className="text-red-400 text-xs mt-1">Requerido</p>}
                  </div>
                  <div>
                    <label className="input-label">Color *</label>
                    <input {...register('color')} className="input-field" placeholder="Rojo" />
                    {errors.color && <p className="text-red-400 text-xs mt-1">Requerido</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  {moto && (
                    <button type="button" onClick={() => { reset(); setEditando(false) }} className="btn-secondary">
                      Cancelar
                    </button>
                  )}
                  <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ── TAB: Documentos ── */}
        {tab === 'documentos' && moto && (
          <div className="space-y-4">
            {[
              { label: 'SOAT',                   valor: moto.soatVencimiento },
              { label: 'Licencia de conducción', valor: moto.licenciaVencimiento },
            ].map(doc => {
              const dias   = diasHastaVencimiento(doc.valor)
              const estado = estadoVencimiento(dias)
              return (
                <div key={doc.label} className={cn(
                  'flex items-center justify-between p-4 rounded-xl border',
                  estado.bg,
                  estado.icon === 'danger'  ? 'border-red-500/20' :
                  estado.icon === 'warning' ? 'border-yellow-500/20' :
                  estado.icon === 'ok'      ? 'border-accent-500/20' : 'border-white/10'
                )}>
                  <div>
                    <p className="text-white text-sm font-medium">{doc.label}</p>
                    <p className={cn('text-xs mt-0.5', estado.color)}>{estado.label}</p>
                  </div>
                  <div className="text-right">
                    {doc.valor
                      ? <p className="text-white/60 text-xs">{new Date(doc.valor).toLocaleDateString('es-CO')}</p>
                      : <p className="text-white/20 text-xs">Sin registrar</p>}
                    {estado.icon === 'danger'  && <AlertTriangle className="w-4 h-4 text-red-400 ml-auto mt-1" />}
                    {estado.icon === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 ml-auto mt-1" />}
                    {estado.icon === 'ok'      && <CheckCircle   className="w-4 h-4 text-accent-400 ml-auto mt-1" />}
                  </div>
                </div>
              )
            })}

            <form onSubmit={handleV(onGuardarVencimientos)} className="card border border-white/10 space-y-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-400" /> Actualizar fechas de vencimiento
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="input-label">Vencimiento SOAT</label>
                  <input {...regV('soatVencimiento')} type="date" className="input-field" />
                </div>
                <div>
                  <label className="input-label">Vencimiento Licencia de conducción</label>
                  <input {...regV('licenciaVencimiento')} type="date" className="input-field" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={guardandoVenc} className="btn-primary flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" />
                  {guardandoVenc ? 'Guardando...' : 'Guardar fechas'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
