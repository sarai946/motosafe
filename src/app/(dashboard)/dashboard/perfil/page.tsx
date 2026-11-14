'use client'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Phone, MapPin, Save, Edit2, Plus, Trash2,
  Heart, Eye, EyeOff, Shield, ChevronDown, ChevronUp,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import {
  obtenerPerfil, guardarPerfil,
  obtenerContactosEmergencia, guardarContactoEmergencia,
  eliminarContactoEmergencia, actualizarContactoEmergencia,
  obtenerInfoMedica, guardarInfoMedica,
} from '@/lib/firestore'
import type {
  MotocyclistProfile, ContactoEmergencia,
  InfoMedica, ConfiguracionPrivacidad,
} from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// ── Schemas ──────────────────────────────────────────────────
const schemaDatos = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  celular: z.string().min(7, 'Celular inválido'),
  ciudad: z.string().min(2, 'Ciudad requerida'),
  departamento: z.string().optional(),
})

const schemaContacto = z.object({
  nombreCompleto: z.string().min(3, 'Nombre requerido'),
  parentesco: z.string().min(2, 'Parentesco requerido'),
  celular: z.string().min(7, 'Celular inválido'),
  email: z.string().email().optional().or(z.literal('')),
  autorizadoNotificaciones: z.boolean(),
  esContactoPrincipal: z.boolean(),
})

type FormDatos = z.infer<typeof schemaDatos>
type FormContacto = z.infer<typeof schemaContacto>

const TABS = ['Datos personales', 'Contactos', 'Info médica', 'Privacidad'] as const
type Tab = typeof TABS[number]

const GRUPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido']
const PARENTESCOS = ['Esposo/a', 'Padre/Madre', 'Hijo/a', 'Hermano/a', 'Amigo/a', 'Compañero/a', 'Otro']

export default function PerfilPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('Datos personales')
  const [perfil, setPerfil] = useState<MotocyclistProfile | null>(null)
  const [contactos, setContactos] = useState<ContactoEmergencia[]>([])
  const [infoMedica, setInfoMedica] = useState<InfoMedica | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardandoDatos, setGuardandoDatos] = useState(false)
  const [mostrarFormContacto, setMostrarFormContacto] = useState(false)
  const [contactoEditando, setContactoEditando] = useState<ContactoEmergencia | null>(null)
  const [guardandoMedica, setGuardandoMedica] = useState(false)
  const [privacidad, setPrivacidad] = useState<ConfiguracionPrivacidad>({
    mostrarNombre: true, mostrarCelular: false, mostrarEmail: false,
    mostrarCiudad: true, mostrarPlacaMoto: true, mostrarFotoMoto: true,
    mostrarContactosEmergencia: true, mostrarInfoMedica: false,
  })
  const [guardandoPrivacidad, setGuardandoPrivacidad] = useState(false)

  // Formulario datos personales
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormDatos>({
    resolver: zodResolver(schemaDatos),
  })

  // Formulario contacto
  const {
    register: regC, handleSubmit: handleC, reset: resetC,
    formState: { errors: errC },
  } = useForm<FormContacto>({
    resolver: zodResolver(schemaContacto),
    defaultValues: { autorizadoNotificaciones: true, esContactoPrincipal: false },
  })

  // Info médica local
  const [medica, setMedica] = useState({
    grupoSanguineo: '', alergias: '', condicionesMedicas: '',
    medicamentos: '', observaciones: '', mostrarEnEmergencia: true,
  })

  useEffect(() => {
    if (!user) return
    Promise.all([
      obtenerPerfil(user.uid),
      obtenerContactosEmergencia(user.uid),
      obtenerInfoMedica(user.uid),
    ]).then(([p, c, m]) => {
      setPerfil(p)
      setContactos(c)
      setInfoMedica(m)
      if (p) {
        reset({ nombres: p.nombres, apellidos: p.apellidos, celular: p.celular, ciudad: p.ciudad, departamento: p.departamento || '' })
        if (p.profilePublico) setPrivacidad(p.profilePublico)
      }
      if (m) setMedica({
        grupoSanguineo: m.grupoSanguineo || '',
        alergias: m.alergias || '',
        condicionesMedicas: m.condicionesMedicas || '',
        medicamentos: m.medicamentos || '',
        observaciones: m.observaciones || '',
        mostrarEnEmergencia: m.mostrarEnEmergencia,
      })
      setCargando(false)
    })
  }, [user, reset])

  // ── Guardar datos personales ──
  const onGuardarDatos = async (data: FormDatos) => {
    if (!user) return
    setGuardandoDatos(true)
    try {
      await guardarPerfil(user.uid, data)
      toast.success('Datos actualizados correctamente')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardandoDatos(false)
    }
  }

  // ── Guardar contacto ──
  const onGuardarContacto = async (data: FormContacto) => {
    if (!user) return
    try {
      if (contactoEditando) {
        await actualizarContactoEmergencia(contactoEditando.id, data)
        toast.success('Contacto actualizado')
      } else {
        await guardarContactoEmergencia(user.uid, data)
        toast.success('Contacto agregado')
      }
      const c = await obtenerContactosEmergencia(user.uid)
      setContactos(c)
      setMostrarFormContacto(false)
      setContactoEditando(null)
      resetC({ autorizadoNotificaciones: true, esContactoPrincipal: false })
    } catch {
      toast.error('Error al guardar contacto')
    }
  }

  const editarContacto = (c: ContactoEmergencia) => {
    setContactoEditando(c)
    resetC({
      nombreCompleto: c.nombreCompleto, parentesco: c.parentesco,
      celular: c.celular, email: c.email || '',
      autorizadoNotificaciones: c.autorizadoNotificaciones,
      esContactoPrincipal: c.esContactoPrincipal,
    })
    setMostrarFormContacto(true)
  }

  const eliminarContacto = async (id: string) => {
    if (!confirm('¿Eliminar este contacto?')) return
    await eliminarContactoEmergencia(id)
    setContactos(prev => prev.filter(c => c.id !== id))
    toast.success('Contacto eliminado')
  }

  // ── Guardar info médica ──
  const onGuardarMedica = async () => {
    if (!user) return
    setGuardandoMedica(true)
    try {
      await guardarInfoMedica(user.uid, medica)
      toast.success('Información médica guardada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardandoMedica(false)
    }
  }

  // ── Guardar privacidad ──
  const onGuardarPrivacidad = async () => {
    if (!user) return
    setGuardandoPrivacidad(true)
    try {
      await guardarPerfil(user.uid, { profilePublico: privacidad })
      toast.success('Privacidad actualizada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardandoPrivacidad(false)
    }
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center font-bold text-white text-lg">
            {perfil?.nombres?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-white font-display font-bold text-2xl">Mi perfil</h1>
            <p className="text-white/40 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar bg-dark-700 p-1 rounded-xl">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                tab === t ? 'bg-primary-500 text-white' : 'text-white/50 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── TAB: Datos personales ── */}
        {tab === 'Datos personales' && (
          <form onSubmit={handleSubmit(onGuardarDatos)} className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" /> Datos personales
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nombres *</label>
                <input {...register('nombres')} className="input-field" />
                {errors.nombres && <p className="text-red-400 text-xs mt-1">{errors.nombres.message}</p>}
              </div>
              <div>
                <label className="input-label">Apellidos *</label>
                <input {...register('apellidos')} className="input-field" />
                {errors.apellidos && <p className="text-red-400 text-xs mt-1">{errors.apellidos.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Celular *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input {...register('celular')} className="input-field pl-10" placeholder="3001234567" />
                </div>
                {errors.celular && <p className="text-red-400 text-xs mt-1">{errors.celular.message}</p>}
              </div>
              <div>
                <label className="input-label">Ciudad *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input {...register('ciudad')} className="input-field pl-10" placeholder="Bogotá" />
                </div>
                {errors.ciudad && <p className="text-red-400 text-xs mt-1">{errors.ciudad.message}</p>}
              </div>
            </div>
            <div>
              <label className="input-label">Departamento</label>
              <input {...register('departamento')} className="input-field" placeholder="Cundinamarca" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={guardandoDatos} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}

        {/* ── TAB: Contactos de emergencia ── */}
        {tab === 'Contactos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" />
                Contactos de emergencia
                <span className="badge bg-primary-500/20 text-primary-300 border border-primary-500/20">{contactos.length}</span>
              </h2>
              {!mostrarFormContacto && (
                <button
                  onClick={() => { setContactoEditando(null); resetC({ autorizadoNotificaciones: true, esContactoPrincipal: false }); setMostrarFormContacto(true) }}
                  className="btn-primary text-sm py-2 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              )}
            </div>

            {/* Formulario contacto */}
            {mostrarFormContacto && (
              <form onSubmit={handleC(onGuardarContacto)} className="card border border-primary-500/20 space-y-4">
                <h3 className="text-white font-medium text-sm">
                  {contactoEditando ? 'Editar contacto' : 'Nuevo contacto de emergencia'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="input-label">Nombre completo *</label>
                    <input {...regC('nombreCompleto')} className="input-field" placeholder="María García" />
                    {errC.nombreCompleto && <p className="text-red-400 text-xs mt-1">{errC.nombreCompleto.message}</p>}
                  </div>
                  <div>
                    <label className="input-label">Parentesco *</label>
                    <select {...regC('parentesco')} className="input-field">
                      <option value="">Seleccionar...</option>
                      {PARENTESCOS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errC.parentesco && <p className="text-red-400 text-xs mt-1">{errC.parentesco.message}</p>}
                  </div>
                  <div>
                    <label className="input-label">Celular *</label>
                    <input {...regC('celular')} className="input-field" placeholder="3001234567" />
                    {errC.celular && <p className="text-red-400 text-xs mt-1">{errC.celular.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="input-label">Correo electrónico (opcional)</label>
                    <input {...regC('email')} type="email" className="input-field" placeholder="correo@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...regC('autorizadoNotificaciones')} className="w-4 h-4 accent-primary-500" />
                    <span className="text-white/70 text-sm">Autorizado para recibir notificaciones de emergencia</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...regC('esContactoPrincipal')} className="w-4 h-4 accent-primary-500" />
                    <span className="text-white/70 text-sm">Es el contacto principal</span>
                  </label>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setMostrarFormContacto(false); setContactoEditando(null) }} className="btn-secondary text-sm py-2">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary text-sm py-2 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Guardar contacto
                  </button>
                </div>
              </form>
            )}

            {/* Lista de contactos */}
            {contactos.length === 0 && !mostrarFormContacto ? (
              <div className="text-center py-10 card border border-white/10">
                <Phone className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No tienes contactos de emergencia registrados</p>
                <p className="text-white/20 text-sm mt-1">Agrega al menos uno para tu seguridad</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactos.map(c => (
                  <div key={c.id} className="card border border-white/10 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-primary-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium text-sm">{c.nombreCompleto}</p>
                            {c.esContactoPrincipal && (
                              <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/20">Principal</span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs">{c.parentesco} · {c.celular}</p>
                          {c.autorizadoNotificaciones && (
                            <p className="text-green-400/70 text-xs mt-0.5">✓ Recibe notificaciones</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => editarContacto(c)} className="p-2 text-white/30 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarContacto(c.id)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Info médica ── */}
        {tab === 'Info médica' && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" /> Información médica de emergencia
            </h2>
            <p className="text-white/40 text-xs">Esta información solo se muestra si tú la autorizas y puede salvar tu vida en un accidente.</p>
            <div>
              <label className="input-label">Grupo sanguíneo</label>
              <select
                value={medica.grupoSanguineo}
                onChange={e => setMedica({ ...medica, grupoSanguineo: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Alergias conocidas</label>
              <input
                value={medica.alergias}
                onChange={e => setMedica({ ...medica, alergias: e.target.value })}
                className="input-field"
                placeholder="Penicilina, mariscos..."
              />
            </div>
            <div>
              <label className="input-label">Condiciones médicas</label>
              <input
                value={medica.condicionesMedicas}
                onChange={e => setMedica({ ...medica, condicionesMedicas: e.target.value })}
                className="input-field"
                placeholder="Hipertensión, diabetes..."
              />
            </div>
            <div>
              <label className="input-label">Medicamentos habituales</label>
              <input
                value={medica.medicamentos}
                onChange={e => setMedica({ ...medica, medicamentos: e.target.value })}
                className="input-field"
                placeholder="Metformina 500mg..."
              />
            </div>
            <div>
              <label className="input-label">Observaciones adicionales</label>
              <textarea
                value={medica.observaciones}
                onChange={e => setMedica({ ...medica, observaciones: e.target.value })}
                className="input-field resize-none h-20"
                placeholder="Cualquier información relevante para primeros auxilios..."
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-dark-700 rounded-xl">
              <input
                type="checkbox"
                checked={medica.mostrarEnEmergencia}
                onChange={e => setMedica({ ...medica, mostrarEnEmergencia: e.target.checked })}
                className="w-4 h-4 accent-primary-500"
              />
              <div>
                <p className="text-white text-sm font-medium">Mostrar en mi perfil de emergencia</p>
                <p className="text-white/40 text-xs">Visible para quien escanee tu QR</p>
              </div>
            </label>
            <div className="flex justify-end">
              <button onClick={onGuardarMedica} disabled={guardandoMedica} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {guardandoMedica ? 'Guardando...' : 'Guardar información médica'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Privacidad ── */}
        {tab === 'Privacidad' && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-400" /> Configuración de privacidad
            </h2>
            <p className="text-white/40 text-xs leading-relaxed">
              Controla qué información ven quienes escanean tu código QR en caso de emergencia.
            </p>
            <div className="space-y-3">
              {(
                [
                  { key: 'mostrarNombre', label: 'Nombre completo', desc: 'Tu nombre y apellidos' },
                  { key: 'mostrarCelular', label: 'Número de celular', desc: 'Tu teléfono personal' },
                  { key: 'mostrarEmail', label: 'Correo electrónico', desc: 'Tu email' },
                  { key: 'mostrarCiudad', label: 'Ciudad', desc: 'Ciudad de residencia' },
                  { key: 'mostrarPlacaMoto', label: 'Placa de la moto', desc: 'Placa y datos del vehículo' },
                  { key: 'mostrarFotoMoto', label: 'Foto de la moto', desc: 'Fotografía del vehículo' },
                  { key: 'mostrarContactosEmergencia', label: 'Contactos de emergencia', desc: 'Nombres y teléfonos' },
                  { key: 'mostrarInfoMedica', label: 'Información médica', desc: 'Grupo sanguíneo, alergias' },
                ] as { key: keyof ConfiguracionPrivacidad; label: string; desc: string }[]
              ).map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl">
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-white/40 text-xs">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setPrivacidad(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                      privacidad[item.key]
                        ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                        : 'bg-white/5 text-white/30 border border-white/10'
                    )}
                  >
                    {privacidad[item.key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {privacidad[item.key] ? 'Visible' : 'Oculto'}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
              <p className="text-primary-200 text-xs leading-relaxed">
                💡 <strong>Recomendación:</strong> Muestra siempre el nombre, la placa, los contactos de emergencia
                y la información médica. Estos datos son los más importantes en caso de accidente.
              </p>
            </div>
            <div className="flex justify-end">
              <button onClick={onGuardarPrivacidad} disabled={guardandoPrivacidad} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {guardandoPrivacidad ? 'Guardando...' : 'Guardar privacidad'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
