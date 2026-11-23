'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { iniciarSesion } from '@/lib/auth'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  contrasena: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [verContrasena, setVerContrasena] = useState(false)
  const [cargando, setCargando] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setCargando(true)
    try {
      await iniciarSesion(data.email, data.contrasena)
      toast.success('¡Bienvenido a MotoSafe!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error('Correo o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-glow-blue">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-2xl">MotoSafe</span>
          </Link>
          <p className="text-white/40 text-sm mt-2">Tu identidad. Tu seguridad. Tu camino.</p>
        </div>

        <div className="card border border-white/10">
          <h1 className="text-white font-display font-bold text-2xl mb-1">Iniciar sesión</h1>
          <p className="text-white/40 text-sm mb-6">Accede a tu perfil de motociclista</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="input-label">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input {...register('email')} type="email" placeholder="tu@correo.com"
                  className="input-field pl-10" autoComplete="email" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Contraseña</label>
                <Link href="/recuperar" className="text-primary-400 text-xs hover:text-primary-300">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input {...register('contrasena')} type={verContrasena ? 'text' : 'password'}
                  placeholder="••••••••" className="input-field pl-10 pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setVerContrasena(!verContrasena)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {verContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.contrasena && <p className="text-red-400 text-xs mt-1">{errors.contrasena.message}</p>}
            </div>

            <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5 mt-2">
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-white/40 text-sm text-center mt-5">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-primary-400 hover:text-primary-300 font-medium">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
