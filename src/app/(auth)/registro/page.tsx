import React from 'react'
import Link from 'next/link'
import { Shield, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrarme - MotoSafe',
  description: 'Crea tu cuenta de motociclista en MotoSafe y obtén tu QR de emergencia personalizado.',
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">MotoSafe</span>
        </Link>

        <div className="card border border-white/10">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-white font-display font-bold text-2xl mb-2">Próximamente</h1>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            El registro estará disponible muy pronto.<br />
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
