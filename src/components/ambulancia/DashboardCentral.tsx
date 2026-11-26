'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import {
  Shield, Mail, Lock, Eye, EyeOff,
  Plus, Trash2, CheckCircle, LogOut,
  Ambulance
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Tipos ─────────────────────────────────────────────────────
interface AmbulanciaFlota {
  id: string
  placa: string
  tipo: 'BASICA' | 'MEDICALIZADA' | 'NEONATAL' | 'BARIATRICA'
  conductor: string
  disponible: boolean
}

const TIPOS_AMB = [
  { valor: 'BASICA',       label: 'Básica',       emoji: '🚑' },
  { valor: 'MEDICALIZADA', label: 'Medicalizada', emoji: '🏥' },
  { valor: 'NEONATAL',     label: 'Neonatal',     emoji: '👶' },
  { valor: 'BARIATRICA',   label: 'Bariátrica',   emoji: '⚕️' },
]

// ── Login de la central ───────────────────────────────────────
function LoginCentral({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass]   = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Completa los campos'); return }
    setCargando(true)
    // Demo: cualquier email/contraseña entra (hasta conectar Supabase Auth)
    setTimeout(() => {
      setCargando(false)
      onLogin(email)
      toast.success('Bienvenido a MotoSafe Centrales')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">MotoSafe</h1>
          <p className="text-white/40 text-sm mt-1">Acceso exclusivo · Centrales de Ambulancia</p>
        </div>

        <div className="card border border-white/10 space-y-4">
          <h2 className="text-white font-semibold">Iniciar sesión</h2>

          <div>
            <label className="input-label">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                type="email" className="input-field pl-10" placeholder="central@empresa.com" />
            </div>
          </div>

          <div>
            <label className="input-label">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                type={verPass ? 'text' : 'password'} className="input-field pl-10 pr-10"
                placeholder="••••••••" />
              <button onClick={() => setVerPass(!verPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={cargando}
            className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
            {cargando ? 'Entrando...' : '🚑 Entrar al panel'}
          </button>

          <p className="text-white/30 text-xs text-center">
            ¿No tienes acceso?{' '}
            <Link href="/ambulancia/registro" className="text-red-400 hover:text-red-300">
              Registrar mi central
            </Link>
          </p>
        </div>

        <p className="text-white/20 text-xs text-center mt-4">
          Las credenciales son asignadas por el equipo de MotoSafe tras verificar tu habilitación legal.
        </p>
      </div>
    </div>
  )
}

// ── Dashboard principal de la central ────────────────────────
function PanelCentral({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [tab, setTab] = useState<'flota' | 'perfil'>('flota')
  const [flota, setFlota] = useState<AmbulanciaFlota[]>([
    { id: '1', placa: 'AMB-001', tipo: 'MEDICALIZADA', conductor: 'Sin asignar', disponible: true },
    { id: '2', placa: 'AMB-002', tipo: 'BASICA',       conductor: 'Sin asignar', disponible: true },
  ])
  const [mostrarFormAmb, setMostrarFormAmb] = useState(false)
  const [nuevaAmb, setNuevaAmb] = useState({
    placa: '', tipo: 'BASICA' as AmbulanciaFlota['tipo'], conductor: '',
  })

  const agregarAmbulancia = () => {
    if (!nuevaAmb.placa) { toast.error('Ingresa la placa'); return }
    setFlota(prev => [...prev, {
      id: Date.now().toString(),
      placa: nuevaAmb.placa.toUpperCase(),
      tipo: nuevaAmb.tipo,
      conductor: nuevaAmb.conductor || 'Sin asignar',
      disponible: true,
    }])
    setNuevaAmb({ placa: '', tipo: 'BASICA', conductor: '' })
    setMostrarFormAmb(false)
    toast.success('Ambulancia agregada')
  }

  const quitarAmbulancia = (id: string) => {
    if (!confirm('¿Quitar esta ambulancia de la flota?')) return
    setFlota(prev => prev.filter(a => a.id !== id))
    toast.success('Ambulancia eliminada de la flota')
  }

  const toggleDisponible = (id: string) => {
    setFlota(prev => prev.map(a => a.id === id ? { ...a, disponible: !a.disponible } : a))
  }

  const disponibles = flota.filter(a => a.disponible).length

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-500 py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">Central de Ambulancias</p>
              <p className="text-red-200 text-xs">{email}</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto flex gap-6 mt-3">
          {[
            { label: 'Total flota',   value: flota.length },
            { label: 'Disponibles',   value: disponibles },
            { label: 'En servicio',   value: flota.length - disponibles },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white font-bold">{s.value}</p>
              <p className="text-red-200 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso de solicitudes por WhatsApp */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="text-green-300 text-sm font-semibold">Solicitudes por WhatsApp</p>
            <p className="text-white/50 text-xs">
              Las solicitudes de emergencia llegan directamente a los números <strong className="text-white">3123018786</strong> y <strong className="text-white">3025341789</strong> con todos los datos del accidentado y la ubicación GPS.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-dark-700 p-1 rounded-xl mb-5">
          <button onClick={() => setTab('flota')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'flota' ? 'bg-red-500 text-white' : 'text-white/50 hover:text-white'}`}>
            🚑 Mi flota ({flota.length})
          </button>
          <button onClick={() => setTab('perfil')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'perfil' ? 'bg-red-500 text-white' : 'text-white/50 hover:text-white'}`}>
            🏥 Perfil de la central
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">

        {/* ── TAB: FLOTA ── */}
        {tab === 'flota' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Ambulancias registradas</h2>
              <button onClick={() => setMostrarFormAmb(true)}
                className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4">
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>

            {/* Formulario nueva ambulancia */}
            {mostrarFormAmb && (
              <div className="card border border-red-500/20 space-y-3">
                <h3 className="text-white font-semibold text-sm">Nueva ambulancia</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Placa *</label>
                    <input value={nuevaAmb.placa}
                      onChange={e => setNuevaAmb(p => ({ ...p, placa: e.target.value.toUpperCase() }))}
                      className="input-field uppercase" placeholder="AMB-003" />
                  </div>
                  <div>
                    <label className="input-label">Conductor</label>
                    <input value={nuevaAmb.conductor}
                      onChange={e => setNuevaAmb(p => ({ ...p, conductor: e.target.value }))}
                      className="input-field" placeholder="Nombre del conductor" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Tipo de ambulancia</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_AMB.map(t => (
                      <button key={t.valor} onClick={() => setNuevaAmb(p => ({ ...p, tipo: t.valor as any }))}
                        className={`p-2.5 rounded-xl border text-sm text-left transition-all ${
                          nuevaAmb.tipo === t.valor
                            ? 'border-red-500 bg-red-500/20 text-white'
                            : 'border-white/10 bg-dark-700 text-white/60'
                        }`}>
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setMostrarFormAmb(false)} className="btn-secondary text-sm py-2">Cancelar</button>
                  <button onClick={agregarAmbulancia} className="btn-primary text-sm py-2 px-5">Agregar</button>
                </div>
              </div>
            )}

            {/* Lista de ambulancias */}
            {flota.length === 0 ? (
              <div className="card border border-white/10 text-center py-10">
                <span className="text-4xl block mb-3">🚑</span>
                <p className="text-white/40">No hay ambulancias registradas</p>
                <p className="text-white/20 text-sm mt-1">Agrega las ambulancias de tu flota</p>
              </div>
            ) : (
              flota.map(amb => (
                <div key={amb.id} className="card border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${amb.disponible ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {TIPOS_AMB.find(t => t.valor === amb.tipo)?.emoji || '🚑'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold tracking-widest">{amb.placa}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          amb.disponible ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {amb.disponible ? 'Disponible' : 'En servicio'}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs">{TIPOS_AMB.find(t => t.valor === amb.tipo)?.label} · {amb.conductor}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDisponible(amb.id)}
                        className="p-2 bg-dark-700 hover:bg-dark-600 border border-white/10 rounded-lg transition-colors"
                        title={amb.disponible ? 'Marcar en servicio' : 'Marcar disponible'}>
                        <CheckCircle className={`w-4 h-4 ${amb.disponible ? 'text-green-400' : 'text-white/30'}`} />
                      </button>
                      <button onClick={() => quitarAmbulancia(amb.id)}
                        className="p-2 bg-dark-700 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── TAB: PERFIL ── */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            <div className="card border border-white/10">
              <p className="text-white/40 text-xs uppercase mb-3">Información de la central</p>
              <div className="space-y-3">
                {[
                  { label: 'Correo de acceso', value: email },
                  { label: 'Solicitudes recibidas por', value: 'WhatsApp: 3123018786 · 3025341789' },
                  { label: 'Estado', value: 'Activa y verificada' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-sm">{item.label}</span>
                    <span className="text-white text-sm font-medium text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card border border-green-500/20 bg-green-500/5">
              <p className="text-green-300 text-sm font-semibold flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4" /> Central verificada por MotoSafe
              </p>
              <p className="text-white/40 text-xs">Tu habilitación legal fue validada. Puedes recibir solicitudes de emergencia.</p>
            </div>

            <div className="card border border-white/10">
              <p className="text-white font-semibold mb-2 text-sm">¿Cómo funcionan las solicitudes?</p>
              <div className="space-y-2">
                {[
                  'Un motociclista escanea un QR en un accidente',
                  'Presiona el botón 🚑 Solicitar Ambulancia',
                  'El sistema envía automáticamente un WhatsApp a tu central con la ubicación GPS y datos médicos del accidentado',
                  'Tu central gestiona internamente el despacho de la ambulancia más cercana',
                ].map((paso, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</div>
                    <p className="text-white/60 text-sm">{paso}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Componente raíz ───────────────────────────────────────────
export default function DashboardCentral() {
  const [emailLogueado, setEmailLogueado] = useState<string | null>(null)

  if (!emailLogueado) {
    return <LoginCentral onLogin={setEmailLogueado} />
  }

  return <PanelCentral email={emailLogueado} onLogout={() => setEmailLogueado(null)} />
}
