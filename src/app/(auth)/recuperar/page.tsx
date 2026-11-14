'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { restablecerContrasena } from '@/lib/auth'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
})
type FormData = z.infer<typeof schema>

export default function RecuperarPage() {
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setCargando(true)
    try {
      await restablecerContrasena(data.email)
      setEnviado(true)
      toast.success('Correo de recuperación enviado')
    } catch {
      toast.error('No se encontró una cuenta con ese correo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-glow-blue">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-2xl">MotoSafe</span>
          </Link>
        </div>

        <div className="card border border-white/10">
          {!enviado ? (
            <>
              <h1 className="text-white font-display font-bold text-2xl mb-1">Recuperar contraseña</h1>
              <p className="text-white/40 text-sm mb-6">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="input-label">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="tu@correo.com"
                      className="input-field pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5">
                  {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-accent-400 mx-auto mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">¡Correo enviado!</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-white/10">
            <Link href="/login" className="flex items-center justify-center gap-2 text-primary-400 hover:text-primary-300 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
