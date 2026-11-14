'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Shield, User, Truck, Phone, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type Paso = 1 | 2 | 3

interface FormData {
  // Paso 1 - Datos personales
  nombres: string
  apellidos: string
  celular: string
  email: string
  contrasena: string
  // Paso 2 - Vehículo
  placaAmbulancia: string
  empresa: string
  tipoAmbulancia: 'BASICA' | 'MEDICALIZADA' | 'NEONATAL' | 'BARIATRICA'
  ciudad: string
  // Paso 3 - Confirmación
  aceptaTerminos: boolean
}

const TIPOS_AMBULANCIA = [
  { value: 'BASICA', label: 'Básica', desc: 'Traslado y primeros auxilios', emoji: '🚑' },
  { value: 'MEDICALIZADA', label: 'Medicalizada', desc: 'UCI móvil con médico', emoji: '🏥' },
  { value: 'NEONATAL', label: 'Neonatal', desc: 'Transporte de recién nacidos', emoji: '👶' },
  { value: 'BARIATRICA', label: 'Bariátrica', desc: 'Pacientes de alto peso', emoji: '⚕️' },
]

export default function RegistroAmbulanciaForm() {
  const [paso, setPaso] = useState<Paso>(1)
  const [registrado, setRegistrado] = useState(false)
  const [form, setForm] = useState<FormData>({
    nombres: '', apellidos: '', celular: '', email: '', contrasena: '',
    placaAmbulancia: '', empresa: '', tipoAmbulancia: 'BASICA', ciudad: '',
    aceptaTerminos: false,
  })

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const validarPaso1 = () => {
    if (!form.nombres || !form.apellidos || !form.celular || !form.email || !form.contrasena) {
      toast.error('Completa todos los campos')
      return false
    }
    return true
  }

  const validarPaso2 = () => {
    if (!form.placaAmbulancia || !form.empresa || !form.ciudad) {
      toast.error('Completa todos los campos')
      return false
    }
    return true
  }

  const handleSubmit = () => {
    if (!form.aceptaTerminos) {
      toast.error('Debes aceptar los términos')
      return
    }
    // Aquí irá la llamada a Firebase
    toast.success('¡Registro exitoso! Revisaremos tu información.')
    setRegistrado(true)
  }

  if (registrado) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-accent-400" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-2">¡Registro enviado!</h1>
          <p className="text-white/60 mb-6">
            Revisaremos tu información y activaremos tu perfil en las próximas 24 horas.
            Recibirás una notificación a <strong className="text-white">{form.email}</strong>.
          </p>
          <Link href="/ambulancia/dashboard" className="btn-primary block text-center py-3">
            Ir al panel del conductor →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-500 py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Shield className="w-6 h-6 text-white" />
          <div>
            <h1 className="text-white font-bold">MotoSafe — Ambulancias</h1>
            <p className="text-red-200 text-xs">Registro de conductor / servicio</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <React.Fragment key={n}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                paso >= n ? 'bg-red-500 text-white' : 'bg-dark-700 text-white/40'
              }`}>
                {paso > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`flex-1 h-0.5 transition-colors ${paso > n ? 'bg-red-500' : 'bg-dark-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Paso 1: Datos personales ── */}
        {paso === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <User className="w-5 h-5 text-red-400" /> Datos personales
              </h2>
              <p className="text-white/40 text-sm mt-1">Información del conductor o responsable del servicio</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/40 text-xs block mb-1">Nombres *</label>
                <input value={form.nombres} onChange={e => set('nombres', e.target.value)}
                  className="input-field" placeholder="Juan" />
              </div>
              <div>
                <label className="text-white/40 text-xs block mb-1">Apellidos *</label>
                <input value={form.apellidos} onChange={e => set('apellidos', e.target.value)}
                  className="input-field" placeholder="García" />
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">Celular *</label>
              <input value={form.celular} onChange={e => set('celular', e.target.value)}
                className="input-field" placeholder="+57 300 123 4567" type="tel" />
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">Correo electrónico *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field" placeholder="conductor@ejemplo.com" type="email" />
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">Contraseña *</label>
              <input value={form.contrasena} onChange={e => set('contrasena', e.target.value)}
                className="input-field" placeholder="Mínimo 8 caracteres" type="password" />
            </div>

            <button onClick={() => validarPaso1() && setPaso(2)}
              className="w-full btn-primary py-3 mt-2">
              Continuar →
            </button>
          </div>
        )}

        {/* ── Paso 2: Vehículo ── */}
        {paso === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Truck className="w-5 h-5 text-red-400" /> Datos del vehículo
              </h2>
              <p className="text-white/40 text-sm mt-1">Información de tu ambulancia o servicio</p>
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">Placa de la ambulancia *</label>
              <input value={form.placaAmbulancia} onChange={e => set('placaAmbulancia', e.target.value.toUpperCase())}
                className="input-field font-bold tracking-widest" placeholder="AMB-123" />
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">Empresa / Servicio *</label>
              <input value={form.empresa} onChange={e => set('empresa', e.target.value)}
                className="input-field" placeholder="Cruz Roja, Privada, Bomberos..." />
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-1">Ciudad de operación *</label>
              <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                className="input-field" placeholder="Bogotá" />
            </div>

            <div>
              <label className="text-white/40 text-xs block mb-2">Tipo de ambulancia *</label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_AMBULANCIA.map(t => (
                  <button key={t.value} onClick={() => set('tipoAmbulancia', t.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.tipoAmbulancia === t.value
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-white/10 bg-dark-700 hover:border-white/30'
                    }`}>
                    <p className="text-xl mb-1">{t.emoji}</p>
                    <p className="text-white font-semibold text-sm">{t.label}</p>
                    <p className="text-white/40 text-xs">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setPaso(1)} className="flex-1 btn-secondary py-3">
                ← Atrás
              </button>
              <button onClick={() => validarPaso2() && setPaso(3)} className="flex-1 btn-primary py-3">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3: Confirmación ── */}
        {paso === 3 && (
          <div className="space-y-4 pb-8">
            <div>
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-400" /> Confirmar registro
              </h2>
              <p className="text-white/40 text-sm mt-1">Revisa tu información antes de enviar</p>
            </div>

            {/* Resumen */}
            <div className="card border border-white/10 space-y-3">
              <div>
                <p className="text-white/40 text-xs uppercase">Conductor</p>
                <p className="text-white font-semibold">{form.nombres} {form.apellidos}</p>
                <p className="text-white/60 text-sm">{form.celular} · {form.email}</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-white/40 text-xs uppercase">Vehículo</p>
                <p className="text-white font-bold tracking-wider">{form.placaAmbulancia}</p>
                <p className="text-white/60 text-sm">
                  {form.empresa} · {TIPOS_AMBULANCIA.find(t => t.value === form.tipoAmbulancia)?.label}
                </p>
                <p className="text-white/60 text-sm">{form.ciudad}</p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.aceptaTerminos}
                onChange={e => set('aceptaTerminos', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-500" />
              <span className="text-white/60 text-sm">
                Acepto los <Link href="/terminos" className="text-red-400 underline">términos de servicio</Link> y
                confirmo que la información proporcionada es verídica. Entiendo que MotoSafe puede verificar mis datos.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setPaso(2)} className="flex-1 btn-secondary py-3">
                ← Atrás
              </button>
              <button onClick={handleSubmit} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors">
                🚑 Registrarme
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
