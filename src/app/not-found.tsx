import React from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 text-center">
      <div>
        <div className="text-8xl mb-4">🏍️</div>
        <h1 className="text-white font-display font-black text-6xl mb-2">404</h1>
        <p className="text-white/60 text-lg mb-2">Esta ruta no existe o el QR fue desactivado</p>
        <p className="text-white/30 text-sm mb-8">Si escaneaste un código QR, es posible que haya sido desactivado por su propietario.</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Shield className="w-4 h-4" /> Ir a MotoSafe
        </Link>
      </div>
    </div>
  )
}
