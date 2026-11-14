'use client'
import React from 'react'
import Link from 'next/link'
import { Shield, QrCode, ChevronDown, Zap, Users, MapPin } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ── Imagen de fondo ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        aria-hidden="true"
      />
      {/* Overlay degradado oscuro para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(2,14,61,0.70) 0%, rgba(2,14,61,0.45) 50%, rgba(2,14,61,0.20) 100%)',
        }}
        aria-hidden="true"
      />
      {/* Overlay adicional en la parte inferior para transición suave */}
      <div
        className="absolute bottom-0 inset-x-0 h-32"
        style={{ background: 'linear-gradient(to top, #0d0d1a, transparent)' }}
        aria-hidden="true"
      />

      {/* Partículas decorativas (encima del overlay, debajo del contenido) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        {/* Grid de puntos */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container-max relative z-10 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Contenido izquierdo */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-primary-300" />
              <span className="text-primary-200 text-sm font-medium">Plataforma oficial para motociclistas</span>
            </div>

            {/* Título principal */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Tu identidad.
              <br />
              <span className="text-gradient">Tu seguridad.</span>
              <br />
              Tu camino.
            </h1>

            {/* Descripción */}
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              MotoSafe conecta a los motociclistas con la ayuda que necesitan.
              Identifica, protege y facilita la asistencia mediante un
              <strong className="text-white"> código QR personalizado</strong>.
            </p>

            {/* Estadísticas rápidas */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-10">
              {[
                { icon: Users, value: 'Gratuito', label: 'Para todos los motociclistas' },
                { icon: QrCode, value: 'QR único', label: 'Perfil digital seguro' },
                { icon: Zap, value: 'Inmediato', label: 'Sin registrarse para ver' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-primary-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">{stat.value}</p>
                    <p className="text-white/40 text-xs">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/registro" className="btn-primary text-base py-4 px-8 text-center">
                🏍️ Registrarme gratis
              </Link>
              <Link href="/login" className="btn-secondary text-base py-4 px-8 text-center">
                Iniciar sesión
              </Link>
            </div>

            {/* Aviso sin registro */}
            <p className="text-white/30 text-xs mt-5 text-center lg:text-left">
              ¿Encontraste un QR? Escanéalo directamente — no necesitas registrarte
            </p>
          </div>

          {/* Columna derecha: mockup de tarjeta QR */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Tarjeta principal */}
              <div className="w-72 md:w-80 bg-dark-800/80 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-2xl">
                {/* Header de la tarjeta */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Carlos Rodríguez</p>
                    <p className="text-white/40 text-xs">MotoSafe ID verificado</p>
                  </div>
                  <div className="ml-auto">
                    <span className="badge bg-accent-500/20 text-accent-300 border border-accent-500/30">
                      ✓ Activo
                    </span>
                  </div>
                </div>

                {/* QR real */}
                <div className="bg-white rounded-2xl p-4 mb-4 flex flex-col items-center justify-center gap-2">
                  <QRCodeSVG
                    value="http://192.168.1.67:3000/perfil/demo"
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#020e3d"
                    level="M"
                    includeMargin={false}
                  />
                  <p className="text-dark-500 text-[10px]">Escanea para ver perfil demo</p>
                </div>

                {/* Info moto */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4">
                  <div className="text-2xl">🏍️</div>
                  <div>
                    <p className="text-white text-xs font-semibold">Honda CB 500F · 2022</p>
                    <p className="text-accent-300 text-xs font-bold">ABC-123</p>
                  </div>
                </div>

                {/* Botones de emergencia mini */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { emoji: '🚑', label: 'Ambulancia', color: 'bg-red-500/20 border-red-500/30' },
                    { emoji: '👮', label: 'Policía', color: 'bg-blue-500/20 border-blue-500/30' },
                    { emoji: '🔧', label: 'Grúa', color: 'bg-green-500/20 border-green-500/30' },
                  ].map((btn) => (
                    <div
                      key={btn.label}
                      className={`${btn.color} border rounded-xl p-2 text-center`}
                    >
                      <div className="text-lg">{btn.emoji}</div>
                      <p className="text-white/60 text-[10px]">{btn.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge flotante - Ubicación */}
              <div className="absolute -bottom-4 -left-6 bg-dark-700 border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2 shadow-card animate-bounce-slow">
                <MapPin className="w-4 h-4 text-accent-400" />
                <span className="text-white text-xs font-medium">Ubicación compartida</span>
              </div>

              {/* Badge flotante - SOS */}
              <div className="absolute -top-4 -right-4 bg-emergency-red border border-red-400/30 rounded-xl px-3 py-2 shadow-glow-red emergency-pulse">
                <span className="text-white text-xs font-bold">🆘 SOS Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16">
          <a href="#como-funciona" className="scroll-indicator flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
            <span className="text-xs">Conoce más</span>
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
