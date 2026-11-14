'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Camera, MapPin, Bike, User, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  onComplete: () => void
}

type Paso = 1 | 2 | 3 | 4

export default function PerfilSetupModal({ onComplete }: Props) {
  const [paso, setPaso] = useState<Paso>(1)
  const [ubicacionOk, setUbicacionOk] = useState(false)
  const [obteniendo, setObteniendo] = useState(false)
  const [tipoMoto, setTipoMoto] = useState<'propia' | 'alquilada' | null>(null)
  const [foto, setFoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Intentar ubicación automáticamente al llegar al paso 2
  useEffect(() => {
    if (paso === 2 && !ubicacionOk) {
      activarUbicacion()
    }
  }, [paso])

  const activarUbicacion = () => {
    setObteniendo(true)
    navigator.geolocation?.getCurrentPosition(
      () => {
        setUbicacionOk(true)
        setObteniendo(false)
        toast.success('Ubicación activada correctamente')
      },
      () => {
        setObteniendo(false)
        toast.error('Activa la ubicación en tu dispositivo para continuar')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const finalizar = () => {
    if (!foto) {
      toast.error('La foto es obligatoria')
      return
    }
    // Guardar en localStorage para demo
    if (typeof window !== 'undefined') {
      localStorage.setItem('motosafe_setup_completo', 'true')
      if (foto) localStorage.setItem('motosafe_foto_perfil', foto)
      if (tipoMoto) localStorage.setItem('motosafe_tipo_moto', tipoMoto)
    }
    toast.success('¡Perfil configurado!')
    onComplete()
  }

  const pasos = [
    { n: 1, label: 'Bienvenida' },
    { n: 2, label: 'Ubicación' },
    { n: 3, label: 'Tu moto' },
    { n: 4, label: 'Tu foto' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Barra de progreso */}
        <div className="flex">
          {pasos.map((p) => (
            <div
              key={p.n}
              className={`flex-1 h-1 transition-colors duration-500 ${
                paso >= p.n ? 'bg-primary-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {pasos.map((p) => (
              <div key={p.n} className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                paso > p.n
                  ? 'bg-accent-500 text-white'
                  : paso === p.n
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-white/30'
              }`}>
                {paso > p.n ? '✓' : p.n}
              </div>
            ))}
          </div>

          {/* ── Paso 1: Bienvenida ── */}
          {paso === 1 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-white font-bold text-xl">¡Bienvenido a MotoSafe!</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Antes de empezar, necesitamos configurar tu perfil de emergencia.
                Esto tomará menos de 2 minutos y puede salvar tu vida.
              </p>
              <div className="space-y-2 text-left">
                {[
                  'Activar tu ubicación',
                  'Indicar si tu moto es propia o alquilada',
                  'Subir una foto tuya',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60 text-sm">
                    <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={() => setPaso(2)} className="w-full btn-primary py-3 mt-2">
                Comenzar →
              </button>
            </div>
          )}

          {/* ── Paso 2: Ubicación ── */}
          {paso === 2 && (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${ubicacionOk ? 'bg-accent-500/20' : 'bg-yellow-500/20'}`}>
                <MapPin className={`w-8 h-8 ${ubicacionOk ? 'text-accent-400' : 'text-yellow-400'}`} />
              </div>
              <h2 className="text-white font-bold text-xl">Activar ubicación</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Tu ubicación es necesaria para que los servicios de emergencia puedan encontrarte rápidamente.
              </p>

              {ubicacionOk ? (
                <div className="p-3 bg-accent-500/10 border border-accent-500/30 rounded-xl">
                  <p className="text-accent-300 font-semibold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Ubicación activada correctamente
                  </p>
                </div>
              ) : (
                <button onClick={activarUbicacion} disabled={obteniendo}
                  className="w-full btn-primary py-3">
                  {obteniendo ? '📍 Obteniendo ubicación...' : '📍 Activar mi ubicación'}
                </button>
              )}

              <div className="flex gap-3">
                <button onClick={() => setPaso(1)} className="flex-1 btn-secondary py-2.5 text-sm">← Atrás</button>
                <button
                  onClick={() => {
                    if (!ubicacionOk) {
                      toast.error('La ubicación es obligatoria para continuar')
                      return
                    }
                    setPaso(3)
                  }}
                  className="flex-1 btn-primary py-2.5 text-sm"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 3: Tipo de moto ── */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bike className="w-8 h-8 text-accent-400" />
                </div>
                <h2 className="text-white font-bold text-xl">Tu motocicleta</h2>
                <p className="text-white/50 text-sm mt-1">¿La moto es tuya o la tienes en alquiler?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTipoMoto('propia')}
                  className={`p-5 rounded-2xl border-2 text-center transition-all ${
                    tipoMoto === 'propia'
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-white/10 bg-dark-700 hover:border-white/30'
                  }`}
                >
                  <span className="text-3xl block mb-2">🏍️</span>
                  <p className="text-white font-semibold text-sm">Propia</p>
                  <p className="text-white/40 text-xs mt-0.5">Es mía</p>
                </button>
                <button
                  onClick={() => setTipoMoto('alquilada')}
                  className={`p-5 rounded-2xl border-2 text-center transition-all ${
                    tipoMoto === 'alquilada'
                      ? 'border-accent-500 bg-accent-500/20'
                      : 'border-white/10 bg-dark-700 hover:border-white/30'
                  }`}
                >
                  <span className="text-3xl block mb-2">🔑</span>
                  <p className="text-white font-semibold text-sm">Alquilada</p>
                  <p className="text-white/40 text-xs mt-0.5">En arriendo</p>
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(2)} className="flex-1 btn-secondary py-2.5 text-sm">← Atrás</button>
                <button
                  onClick={() => {
                    if (!tipoMoto) { toast.error('Selecciona el tipo de moto'); return }
                    setPaso(4)
                  }}
                  className="flex-1 btn-primary py-2.5 text-sm"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 4: Foto obligatoria ── */}
          {paso === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-white font-bold text-xl">Tu fotografía</h2>
                <p className="text-white/50 text-sm mt-1">
                  Obligatoria — ayuda a identificarte en caso de emergencia
                </p>
              </div>

              {/* Preview foto */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`w-32 h-32 mx-auto rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
                  foto ? 'border-accent-500' : 'border-white/20 hover:border-primary-500'
                }`}
              >
                {foto ? (
                  <img src={foto} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-white/30 mx-auto mb-1" />
                    <p className="text-white/30 text-xs">Toca para subir</p>
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFoto}
                className="hidden"
              />

              <button
                onClick={() => fileRef.current?.click()}
                className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {foto ? 'Cambiar foto' : 'Tomar / subir foto'}
              </button>

              {foto && (
                <div className="p-2.5 bg-accent-500/10 border border-accent-500/30 rounded-xl">
                  <p className="text-accent-300 text-sm text-center flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Foto cargada correctamente
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setPaso(3)} className="flex-1 btn-secondary py-2.5 text-sm">← Atrás</button>
                <button onClick={finalizar} disabled={!foto}
                  className="flex-1 py-2.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors">
                  ✓ Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
