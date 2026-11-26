'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle, MapPin } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { enviarSolicitudEstablecimiento } from '@/lib/firestore'
import toast from 'react-hot-toast'

const TIPOS = [
  { valor: 'GASOLINERA',        label: 'Gasolinera',              emoji: '⛽' },
  { valor: 'TALLER',            label: 'Taller de motocicletas',  emoji: '🔧' },
  { valor: 'MONTALLANTAS',      label: 'Montallantas',            emoji: '🛞' },
  { valor: 'REPUESTOS',         label: 'Repuestos y accesorios',  emoji: '⚙️' },
  { valor: 'GRUA',              label: 'Grúa / Asistencia vial',  emoji: '🚛' },
  { valor: 'PARQUEADERO',       label: 'Parqueadero',             emoji: '🅿️' },
  { valor: 'CENTRO_ASISTENCIA', label: 'Centro de asistencia',    emoji: '🆘' },
  { valor: 'AMBULANCIA',        label: 'Ambulancia (habilitada)', emoji: '🚑' },
]

const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  GASOLINERA:        ['Gasolina corriente','Gasolina extra','Aire para llantas','Agua','Baños','24 horas'],
  TALLER:            ['Mecánica general','Cambio de aceite','Diagnóstico','Reparación de motor','Reparación eléctrica','Mantenimiento preventivo'],
  MONTALLANTAS:      ['Reparación de pinchazos','Cambio de llantas','Venta de llantas','Calibración de aire','Servicio a domicilio'],
  REPUESTOS:         ['Repuestos originales','Repuestos genéricos','Baterías','Frenos y pastillas','Cadenas y piñones','Cascos y accesorios'],
  GRUA:              ['Servicio de grúa','Transporte por avería','Transporte por accidente','Asistencia en carretera','Servicio 24 horas'],
  PARQUEADERO:       ['Parqueadero cubierto','Parqueadero vigilado','Por horas','Mensual','24 horas'],
  CENTRO_ASISTENCIA: ['Mecánico a domicilio','Paso de corriente','Suministro de combustible','Cambio de llanta','Asistencia por avería'],
  AMBULANCIA:        ['Ambulancia básica','Ambulancia medicalizada','Atención prehospitalaria','Solicitud de asistencia'],
}

type Paso = 1 | 2 | 3 | 4

export default function RegistrarEstablecimientoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [paso, setPaso] = useState<Paso>(1)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [form, setForm] = useState({
    // Solicitante
    nombre_solicitante: '',
    celular_solicitante: '',
    email_solicitante: '',
    // Negocio
    nombre: '',
    tipo: '',
    nit: '',
    representante: '',
    descripcion: '',
    direccion: '',
    ciudad: '',
    localidad: '',
    lat: '',
    lng: '',
    telefono: '',
    whatsapp: '',
    horarios: '',
    es_24_horas: false,
    servicio_domicilio: false,
    servicios: [] as string[],
    tarifas: '',
    habilitacion_legal: '',
  })

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const toggleServicio = (s: string) => {
    setForm(prev => ({
      ...prev,
      servicios: prev.servicios.includes(s)
        ? prev.servicios.filter(x => x !== s)
        : [...prev.servicios, s],
    }))
  }

  const validarPaso = () => {
    if (paso === 1 && (!form.nombre_solicitante || !form.celular_solicitante || !form.email_solicitante)) {
      toast.error('Completa tus datos de contacto'); return false
    }
    if (paso === 2 && (!form.nombre || !form.tipo || !form.direccion || !form.ciudad)) {
      toast.error('Completa los datos del negocio'); return false
    }
    if (paso === 2 && form.tipo === 'AMBULANCIA' && !form.habilitacion_legal) {
      toast.error('Las ambulancias deben indicar su número de habilitación legal'); return false
    }
    return true
  }

  const enviar = async () => {
    setEnviando(true)
    try {
      await enviarSolicitudEstablecimiento({
        nombre_solicitante: form.nombre_solicitante,
        celular_solicitante: form.celular_solicitante,
        email_solicitante: form.email_solicitante,
        nombre: form.nombre,
        tipo: form.tipo,
        nit: form.nit || null,
        representante: form.representante || null,
        descripcion: form.descripcion || null,
        direccion: form.direccion,
        ciudad: form.ciudad,
        localidad: form.localidad || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        telefono: form.telefono || null,
        whatsapp: form.whatsapp || null,
        horarios: form.horarios || null,
        es_24_horas: form.es_24_horas,
        servicio_domicilio: form.servicio_domicilio,
        servicios: form.servicios.length > 0 ? form.servicios : null,
        tarifas: form.tarifas || null,
        habilitacion_legal: form.habilitacion_legal || null,
      })
      setEnviado(true)
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-accent-400" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-3">¡Solicitud enviada!</h1>
          <p className="text-white/60 leading-relaxed mb-6">
            Tu solicitud fue recibida y está en revisión. El equipo de MotoSafe validará la información
            y te contactará a <strong className="text-white">{form.email_solicitante}</strong>.
            <br /><br />
            Tu establecimiento aparecerá en el mapa una vez sea verificado.
          </p>
          <button onClick={() => router.push('/dashboard/mapa')} className="btn-primary py-3 px-8">
            Volver al mapa
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const pasos = [
    { n: 1, label: 'Tus datos' },
    { n: 2, label: 'El negocio' },
    { n: 3, label: 'Servicios' },
    { n: 4, label: 'Confirmar' },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-white font-display font-bold text-2xl">Registrar establecimiento</h1>
          <p className="text-white/40 text-sm mt-1">
            Tu solicitud será revisada por el equipo MotoSafe antes de aparecer en el mapa.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {pasos.map((p, i) => (
            <React.Fragment key={p.n}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  paso > p.n ? 'bg-accent-500 text-white' : paso === p.n ? 'bg-primary-500 text-white' : 'bg-dark-700 text-white/30'
                }`}>
                  {paso > p.n ? '✓' : p.n}
                </div>
                <span className={`text-[10px] hidden sm:block ${paso === p.n ? 'text-primary-400' : 'text-white/30'}`}>{p.label}</span>
              </div>
              {i < pasos.length - 1 && (
                <div className={`flex-1 h-0.5 ${paso > p.n ? 'bg-accent-500' : 'bg-dark-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── PASO 1: Datos del solicitante ── */}
        {paso === 1 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Tus datos de contacto</h2>
            <p className="text-white/40 text-xs">MotoSafe te contactará para verificar la información.</p>
            <div>
              <label className="input-label">Nombre completo *</label>
              <input value={form.nombre_solicitante} onChange={e => set('nombre_solicitante', e.target.value)}
                className="input-field" placeholder="Tu nombre" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Celular *</label>
                <input value={form.celular_solicitante} onChange={e => set('celular_solicitante', e.target.value)}
                  className="input-field" placeholder="3001234567" type="tel" />
              </div>
              <div>
                <label className="input-label">Correo electrónico *</label>
                <input value={form.email_solicitante} onChange={e => set('email_solicitante', e.target.value)}
                  className="input-field" placeholder="tu@correo.com" type="email" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => validarPaso() && setPaso(2)} className="btn-primary py-2.5 px-6">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Datos del negocio ── */}
        {paso === 2 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Datos del establecimiento</h2>

            <div>
              <label className="input-label">Categoría *</label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS.map(t => (
                  <button key={t.valor} onClick={() => { set('tipo', t.valor); setForm(prev => ({ ...prev, servicios: [] })) }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-left transition-all ${
                      form.tipo === t.valor ? 'border-primary-500 bg-primary-500/20 text-white' : 'border-white/10 bg-dark-700 text-white/60 hover:border-white/30'
                    }`}>
                    <span className="text-xl">{t.emoji}</span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">Nombre del establecimiento *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="input-field" placeholder="Nombre del negocio" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">NIT (opcional)</label>
                <input value={form.nit} onChange={e => set('nit', e.target.value)}
                  className="input-field" placeholder="900.123.456-7" />
              </div>
              <div>
                <label className="input-label">Representante</label>
                <input value={form.representante} onChange={e => set('representante', e.target.value)}
                  className="input-field" placeholder="Nombre del responsable" />
              </div>
            </div>

            <div>
              <label className="input-label">Descripción</label>
              <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                className="input-field resize-none h-16" placeholder="Describe brevemente tu negocio..." />
            </div>

            <div>
              <label className="input-label">Dirección *</label>
              <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
                className="input-field" placeholder="Calle 80 #45-20" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Ciudad *</label>
                <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                  className="input-field" placeholder="Bogotá" />
              </div>
              <div>
                <label className="input-label">Localidad / Barrio</label>
                <input value={form.localidad} onChange={e => set('localidad', e.target.value)}
                  className="input-field" placeholder="Engativá" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Teléfono</label>
                <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                  className="input-field" placeholder="6012345678" type="tel" />
              </div>
              <div>
                <label className="input-label">WhatsApp</label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  className="input-field" placeholder="3001234567" type="tel" />
              </div>
            </div>

            <div>
              <label className="input-label">Horarios de atención</label>
              <input value={form.horarios} onChange={e => set('horarios', e.target.value)}
                className="input-field" placeholder="Lun-Sab 8am-6pm" />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.es_24_horas} onChange={e => set('es_24_horas', e.target.checked)}
                  className="w-4 h-4 accent-primary-500" />
                <span className="text-white/70 text-sm">Servicio 24 horas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.servicio_domicilio} onChange={e => set('servicio_domicilio', e.target.checked)}
                  className="w-4 h-4 accent-primary-500" />
                <span className="text-white/70 text-sm">Servicio a domicilio</span>
              </label>
            </div>

            {form.tipo === 'AMBULANCIA' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                <p className="text-red-300 text-xs font-semibold">🚑 Requisito para ambulancias</p>
                <input value={form.habilitacion_legal} onChange={e => set('habilitacion_legal', e.target.value)}
                  className="input-field" placeholder="Número de habilitación legal del Ministerio de Salud *" />
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setPaso(1)} className="btn-secondary py-2.5 px-5">← Atrás</button>
              <button onClick={() => validarPaso() && setPaso(3)} className="btn-primary py-2.5 px-6">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Servicios ── */}
        {paso === 3 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Servicios disponibles</h2>
            <p className="text-white/40 text-xs">Selecciona todos los servicios que ofrece tu establecimiento.</p>

            {form.tipo && SERVICIOS_POR_TIPO[form.tipo] && (
              <div className="flex flex-wrap gap-2">
                {SERVICIOS_POR_TIPO[form.tipo].map(s => (
                  <button key={s} onClick={() => toggleServicio(s)}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                      form.servicios.includes(s)
                        ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                        : 'bg-dark-700 border-white/10 text-white/50 hover:border-white/30'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="input-label">Tarifas (opcional)</label>
              <textarea value={form.tarifas} onChange={e => set('tarifas', e.target.value)}
                className="input-field resize-none h-16"
                placeholder="Ej: Cambio de aceite desde $35.000, Diagnóstico gratis..." />
            </div>

            <div className="flex justify-between">
              <button onClick={() => setPaso(2)} className="btn-secondary py-2.5 px-5">← Atrás</button>
              <button onClick={() => setPaso(4)} className="btn-primary py-2.5 px-6">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── PASO 4: Confirmar ── */}
        {paso === 4 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Confirmar solicitud</h2>

            <div className="space-y-3">
              <div className="p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-xs uppercase mb-1">Solicitante</p>
                <p className="text-white font-medium">{form.nombre_solicitante}</p>
                <p className="text-white/60 text-sm">{form.email_solicitante} · {form.celular_solicitante}</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-xs uppercase mb-1">Establecimiento</p>
                <p className="text-white font-medium">{form.nombre}</p>
                <p className="text-white/60 text-sm">{TIPOS.find(t => t.valor === form.tipo)?.emoji} {TIPOS.find(t => t.valor === form.tipo)?.label}</p>
                <p className="text-white/60 text-sm">{form.direccion}, {form.ciudad}</p>
              </div>
              {form.servicios.length > 0 && (
                <div className="p-3 bg-dark-700 rounded-xl">
                  <p className="text-white/40 text-xs uppercase mb-1">Servicios ({form.servicios.length})</p>
                  <p className="text-white/60 text-sm">{form.servicios.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-300 text-xs leading-relaxed">
                ⚠️ Tu solicitud será revisada por el equipo de MotoSafe. El establecimiento
                <strong> no aparecerá en el mapa hasta ser verificado</strong>. Para ambulancias,
                se verificará la habilitación legal antes de aprobar.
              </p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setPaso(3)} className="btn-secondary py-2.5 px-5">← Atrás</button>
              <button onClick={enviar} disabled={enviando} className="btn-primary py-2.5 px-6">
                {enviando ? 'Enviando...' : '✓ Enviar solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
