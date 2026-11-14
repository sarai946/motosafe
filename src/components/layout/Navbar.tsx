'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/#inicio',         label: 'Inicio' },
  { href: '/#como-funciona',  label: 'Cómo funciona' },
  { href: '/#beneficios',     label: 'Beneficios' },
  { href: '/#emergencias',    label: 'Emergencias' },
]

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Sombra al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra el menú al cambiar de ruta (clic en enlace)
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-950/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="container-max flex items-center justify-between h-16 md:h-18">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={cerrarMenu}
          aria-label="MotoSafe – Ir al inicio"
        >
          <div className="w-9 h-9 bg-primary-500 group-hover:bg-primary-400 rounded-xl flex items-center justify-center transition-colors duration-200 shadow-glow-blue">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-display font-bold text-white text-lg block leading-none">
              MotoSafe
            </span>
            <span className="text-white/40 text-[10px] hidden sm:block leading-none tracking-wide">
              Tu identidad. Tu seguridad. Tu camino.
            </span>
          </div>
        </Link>

        {/* ── Navegación escritorio ── */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="px-3 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/8 transition-all duration-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── CTAs escritorio ── */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="btn-secondary text-sm py-2 px-4"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="btn-primary text-sm py-2 px-4"
          >
            Registrarme
          </Link>
        </div>

        {/* ── Botón hamburguesa (móvil) ── */}
        <button
          onClick={() => setMenuAbierto((prev) => !prev)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="mobile-menu"
        >
          {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ── Menú móvil ── */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuAbierto ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!menuAbierto}
      >
        <div className="bg-dark-950/98 backdrop-blur-md border-t border-white/10 px-4 pb-6 pt-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={cerrarMenu}
              className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}

          {/* Divisor */}
          <div className="border-t border-white/10 my-3" />

          {/* CTAs móvil */}
          <Link
            href="/login"
            onClick={cerrarMenu}
            className="block text-center btn-secondary text-sm py-3"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            onClick={cerrarMenu}
            className="block text-center btn-primary text-sm py-3 mt-2"
          >
            🏍️ Registrarme gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
