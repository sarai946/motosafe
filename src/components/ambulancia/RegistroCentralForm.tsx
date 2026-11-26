'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const TIPOS_AMB = ['BASICA', 'MEDICALIZADA', 'NEONATAL', 'BARIATRICA']

export default function RegistroCentralForm() {
  const [paso, setPaso] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [form, setForm] = useState({
    nombre: '', nit: '', representante: '',
    email: '', celular: '', whatsapp: '',
    ciudad: '', departamento: '', direccion: '',
    total_ambulancias: 1,
    tipos_ambulancia: [] as string[],
    numero_habilitacion: '',
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const toggleTipo = (t: string) =>
    setForm(p => ({
      ...p,
      tipos_ambulancia: p.tipos_ambulancia.includes(t)
        ? p.tipos_ambulancia.filter(x => x !== t)
        : [...p.tipos_ambulancia, t],
    }))

  const validar = () => {
    if (paso === 1 && (!form.nombre || !form.representante || !form.email || !form.celular)) {
      toast.error('Completa todos los campos requeridos'); return false
    }
    if (paso === 2 && (!form.ciudad || !form.numero_habilitacion)) {
      toast.error('La ciudad y el número de habilitación son obligatorios'); return false
    }
    return true
  }

  const enviar = async () => {
    setEnviando(true)
    try {
      const { error } = await supabase.from('centrales_ambulancia').insert({
        nombre: form.nombre,
        nit: form.nit || null,
        representante: form.representante,
        email: form.email,
        celular: form.celular,
        whatsapp: form.whatsapp || null,
        ciudad: form.ciudad,
        departamento: form.departamento || null,
        direccion: form.direccion || null,
        total_ambulancias: form.total_ambulancias,
        tipos_ambulancia: form.tipos_ambulancia.length > 0 ? form.tipos_ambulancia : null,
        numero_habilitacion: form.numero_habilitacion,
        estado: 'INACTIVO',
        verificada: false,
        activa: false,
      })
      if (error) throw error
      setEnviado(true)
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-accent-400" />
        </div>
        <h1 className="text-white font-bold text-2xl mb-3">¡Solicitud enviada!</h1>
        <p className="text-white/60 leading-relaxed mb-6">
          Tu solicitud de registro fue recibida. El equipo de MotoSafe verificará tu habilitación legal
          y activará tu central. Recibirás las credenciales de acceso a <strong className="text-white">{form.email}</strong>.
        </p>
        <Link href="/" className="btn-primary py-3 px-8 inline-block">Ir al inicio</Link>
      </div>
    </div>
  )

  const pasos = [{ n: 1, label: 'Datos de la central' }, { n: 2, label: 'Operación' }, { n: 3, label: 'Confirmar' }]

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="bg-gradient-to-r from-red-700 to-red-500 py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Shield className="w-6 h-6 text-white" />
          <div>
            <h1 className="text-white font-bold">MotoSafe — Centrales de Ambulancia</h1>
            <p className="text-red-200 text-xs">Registro de central de servicios médicos</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Steps */}
        <div className="flex items-center gap-2">
          {pasos.map((p, i) => (
            <React.Fragment key={p.n}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  paso > p.n ? 'bg-accent-500 text-white' : paso === p.n ? 'bg-red-500 text-white' : 'bg-dark-700 text-white/30'
                }`}>{paso > p.n ? '✓' : p.n}</div>
                <span className={`text-[10px] hidden sm:block ${paso === p.n ? 'text-red-400' : 'text-white/30'}`}>{p.label}</span>
              </div>
              {i < pasos.length - 1 && <div className={`flex-1 h-0.5 ${paso > p.n ? 'bg-accent-500' : 'bg-dark-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── PASO 1 ── */}
        {paso === 1 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Datos de la central</h2>
            <div>
              <label className="input-label">Nombre de la empresa *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="input-field" placeholder="Cruz Roja Bogotá, SAMU Medellín..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">NIT (opcional)</label>
                <input value={form.nit} onChange={e => set('nit', e.target.value)}
                  className="input-field" placeholder="900.123.456-7" />
              </div>
              <div>
                <label className="input-label">Representante *</label>
                <input value={form.representante} onChange={e => set('representante', e.target.value)}
                  className="input-field" placeholder="Nombre del responsable" />
              </div>
            </div>
            <div>
              <label className="input-label">Correo electrónico *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field" placeholder="central@empresa.com" type="email" />
              <p className="text-white/30 text-xs mt-1">Las credenciales de acceso serán enviadas a este correo</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Celular *</label>
                <input value={form.celular} onChange={e => set('celular', e.target.value)}
                  className="input-field" placeholder="3001234567" type="tel" />
              </div>
              <div>
                <label className="input-label">WhatsApp</label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  className="input-field" placeholder="3001234567" type="tel" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => validar() && setPaso(2)} className="btn-primary py-2.5 px-6">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── PASO 2 ── */}
        {paso === 2 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Operación</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Ciudad *</label>
                <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                  className="input-field" placeholder="Bogotá" />
              </div>
              <div>
                <label className="input-label">Departamento</label>
                <input value={form.departamento} onChange={e => set('departamento', e.target.value)}
                  className="input-field" placeholder="Cundinamarca" />
              </div>
            </div>
            <div>
              <label className="input-label">Dirección sede</label>
              <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
                className="input-field" placeholder="Calle 80 #45-20" />
            </div>
            <div>
              <label className="input-label">Número de ambulancias *</label>
              <input value={form.total_ambulancias}
                onChange={e => set('total_ambulancias', parseInt(e.target.value) || 1)}
                className="input-field" type="number" min="1" />
            </div>
            <div>
              <label className="input-label">Tipos de ambulancia</label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_AMB.map(t => (
                  <button key={t} onClick={() => toggleTipo(t)}
                    className={`p-2.5 rounded-xl border text-sm text-left transition-all ${
                      form.tipos_ambulancia.includes(t)
                        ? 'border-red-500 bg-red-500/20 text-white'
                        : 'border-white/10 bg-dark-700 text-white/60'
                    }`}>
                    {t === 'BASICA' ? '🚑 Básica' : t === 'MEDICALIZADA' ? '🏥 Medicalizada' : t === 'NEONATAL' ? '👶 Neonatal' : '⚕️ Bariátrica'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
              <p className="text-red-300 text-xs font-semibold">🔴 Habilitación legal requerida</p>
              <input value={form.numero_habilitacion} onChange={e => set('numero_habilitacion', e.target.value)}
                className="input-field" placeholder="Número de habilitación del Ministerio de Salud *" />
              <p className="text-white/30 text-xs">MotoSafe verificará este número antes de activar la central</p>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setPaso(1)} className="btn-secondary py-2.5 px-5">← Atrás</button>
              <button onClick={() => validar() && setPaso(3)} className="btn-primary py-2.5 px-6">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Confirmar ── */}
        {paso === 3 && (
          <div className="card border border-white/10 space-y-4">
            <h2 className="text-white font-semibold">Confirmar registro</h2>
            <div className="space-y-3">
              <div className="p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-xs uppercase mb-1">Central</p>
                <p className="text-white font-semibold">{form.nombre}</p>
                <p className="text-white/60 text-sm">{form.email} · {form.celular}</p>
              </div>
              <div className="p-3 bg-dark-700 rounded-xl">
                <p className="text-white/40 text-xs uppercase mb-1">Operación</p>
                <p className="text-white">{form.ciudad}{form.departamento ? `, ${form.departamento}` : ''}</p>
                <p className="text-white/60 text-sm">{form.total_ambulancias} ambulancia{form.total_ambulancias > 1 ? 's' : ''}</p>
                <p className="text-white/60 text-sm">Hab. {form.numero_habilitacion}</p>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-300 text-xs leading-relaxed">
                ⚠️ Tu central <strong>no estará activa</strong> hasta que MotoSafe verifique la habilitación legal.
                Recibirás las credenciales de acceso al correo registrado.
              </p>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setPaso(2)} className="btn-secondary py-2.5 px-5">← Atrás</button>
              <button onClick={enviar} disabled={enviando}
                className="py-2.5 px-6 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                {enviando ? 'Enviando...' : '🚑 Enviar solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
