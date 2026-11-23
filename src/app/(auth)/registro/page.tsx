import React from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import RegistroStepper from '@/components/auth/RegistroStepper'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrarme - MotoSafe',
  description: 'Crea tu cuenta de motociclista en MotoSafe y obtén tu QR de emergencia personalizado.',
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-dark-900">
      <div className="bg-dark-800 border-b border-white/10 py-4 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">MotoSafe</span>
          </Link>
          <p className="text-white/40 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
      <RegistroStepper />
    </div>
  )
}
