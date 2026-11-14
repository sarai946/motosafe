'use client'
import React from 'react'
import Link from 'next/link'
import { Shield, Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dark-950 border-t border-white/10">
      <div className="container-max py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Columna 1: Marca */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-xl">MotoSafe</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Tu identidad. Tu seguridad. Tu camino.
            </p>
            <p className="text-white/40 text-xs leading-relaxed">
              Plataforma digital de identificación, seguridad y asistencia para motociclistas en Colombia.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4 text-white" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Columna 2: Plataforma */}
          <div>
            <h4 className="font-semibold text-white mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/registro', label: 'Registrarme' },
                { href: '/login', label: 'Iniciar sesión' },
                { href: '/#como-funciona', label: '¿Cómo funciona?' },
                { href: '/#beneficios', label: 'Beneficios' },
                { href: '/dashboard', label: 'Mi perfil' },
                { href: '/dashboard/qr', label: 'Mi código QR' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Servicios */}
          <div>
            <h4 className="font-semibold text-white mb-4">Servicios</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/dashboard/emergencias', label: 'Centro de emergencias' },
                { href: '/dashboard/mapa', label: 'Mapa motero' },
                { href: '/dashboard/alertas', label: 'Alertas viales' },
                { href: '/dashboard/comunidad', label: 'Comunidad motera' },
                { href: '/dashboard/moto', label: 'Mi motocicleta' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Contacto y emergencias */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-white/50 text-sm">
                <Mail className="w-4 h-4 mt-0.5 shrink-0 text-primary-400" />
                <span>contacto@motosafe.app</span>
              </li>
              <li className="flex items-start gap-2 text-white/50 text-sm">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-primary-400" />
                <span>Línea de emergencias Colombia: <strong className="text-white">123</strong></span>
              </li>
              <li className="flex items-start gap-2 text-white/50 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary-400" />
                <span>Colombia</span>
              </li>
            </ul>

            <div className="mt-5 p-3 bg-emergency-red/10 border border-emergency-red/30 rounded-xl">
              <p className="text-xs text-red-300 font-semibold mb-1">🚨 Emergencias Colombia</p>
              <p className="text-xs text-white/60">Ambulancia · Policía · Bomberos:</p>
              <p className="text-2xl font-display font-bold text-white">123</p>
            </div>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs text-center md:text-left">
            © {year} MotoSafe. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacidad" className="text-white/30 hover:text-white/60 text-xs transition-colors">
              Política de privacidad
            </Link>
            <Link href="/terminos" className="text-white/30 hover:text-white/60 text-xs transition-colors">
              Términos y condiciones
            </Link>
            <Link href="/tratamiento-datos" className="text-white/30 hover:text-white/60 text-xs transition-colors">
              Tratamiento de datos
            </Link>
          </div>
        </div>

        {/* Aviso legal */}
        <p className="text-white/20 text-xs text-center mt-4 leading-relaxed">
          Los números de emergencia mostrados corresponden a servicios oficiales de Colombia (Ley 1801/2016).
          MotoSafe no reemplaza los servicios de emergencia oficiales.
          Cumplimiento Ley 1581 de 2012 — Protección de Datos Personales.
        </p>
      </div>
    </footer>
  )
}
