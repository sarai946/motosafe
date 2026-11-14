import React from 'react'
import Link from 'next/link'
import { Shield, Clock } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 justify-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-glow-blue">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-white text-2xl">MotoSafe</span>
        </Link>

        <div className="card border border-white/10">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-white font-display font-bold text-2xl mb-2">Próximamente</h1>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            El inicio de sesión estará disponible muy pronto.<br />
            Estamos terminando de configurar la plataforma para darte la mejor experiencia.
          </p>
          <Link href="/" className="btn-primary block text-center py-3">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
