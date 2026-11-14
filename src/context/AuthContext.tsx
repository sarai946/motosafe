'use client'
// ============================================================
// MOTOSAFE - Contexto de Autenticación (DEMO sin Firebase)
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, obtenerRolUsuario, type UserDemo } from '@/lib/auth'

interface AuthContextType {
  user: UserDemo | null
  rol: string
  cargando: boolean
  estaAutenticado: boolean
  esAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  rol: 'user',
  cargando: true,
  estaAutenticado: false,
  esAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDemo | null>(null)
  const [rol, setRol] = useState<string>('user')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (demoUser) => {
      setUser(demoUser)
      if (demoUser) {
        const rolUsuario = await obtenerRolUsuario(demoUser.uid)
        setRol(rolUsuario)
      } else {
        setRol('user')
      }
      setCargando(false)
    })
    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    rol,
    cargando,
    estaAutenticado: !!user,
    esAdmin: rol === 'admin' || rol === 'superadmin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
