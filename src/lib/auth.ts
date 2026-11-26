// ============================================================
// MOTOSAFE - Autenticación con Supabase
// ============================================================
import { supabase } from './supabase'

export interface UserDemo {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'user' | 'admin'
}

/** Registrar nuevo usuario */
export async function registrarUsuario(
  email: string,
  contrasena: string,
  nombreCompleto: string
): Promise<UserDemo> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: contrasena,
    options: {
      data: { nombre_completo: nombreCompleto },
    },
  })
  if (error) {
    console.error('Supabase signup error:', error.message, error.status)
    const err: any = new Error(error.message)
    err.code = error.status
    throw err
  }
  if (!data.user) throw new Error('No se pudo crear el usuario')

  // Crear registro en tabla usuarios
  await supabase.from('usuarios').insert({
    auth_id: data.user.id,
    email: data.user.email,
    nombre_completo: nombreCompleto,
    role: 'user',
    is_active: true,
  })

  return {
    uid: data.user.id,
    email: data.user.email!,
    displayName: nombreCompleto,
    role: 'user',
  }
}

/** Iniciar sesión */
export async function iniciarSesion(
  email: string,
  contrasena: string
): Promise<UserDemo> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: contrasena,
  })
  if (error) {
    const err: any = new Error(error.message)
    err.code = 'auth/invalid-credential'
    throw err
  }

  const nombreCompleto = data.user.user_metadata?.nombre_completo || email

  // Obtener rol desde la tabla usuarios
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role')
    .eq('auth_id', data.user.id)
    .single()

  return {
    uid: data.user.id,
    email: data.user.email!,
    displayName: nombreCompleto,
    role: usuario?.role || 'user',
  }
}

/** Iniciar sesión con Google */
export async function iniciarSesionGoogle(): Promise<UserDemo> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  })
  if (error) throw error
  // El redirect maneja el resto
  return {} as UserDemo
}

/** Cerrar sesión */
export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut()
}

/** Restablecer contraseña */
export async function restablecerContrasena(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/nueva-contrasena`,
  })
  if (error) throw error
}

/** Obtener rol del usuario */
export async function obtenerRolUsuario(userId: string): Promise<string> {
  const { data } = await supabase
    .from('usuarios')
    .select('role')
    .eq('auth_id', userId)
    .single()
  return data?.role || 'user'
}

/** Listener del estado de autenticación */
export function onAuthChange(callback: (user: UserDemo | null) => void) {
  // Verificar sesión actual
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      obtenerRolUsuario(session.user.id).then(role => {
        callback({
          uid: session.user.id,
          email: session.user.email!,
          displayName: session.user.user_metadata?.nombre_completo || session.user.email!,
          role: role as 'user' | 'admin',
        })
      })
    } else {
      callback(null)
    }
  })

  // Escuchar cambios
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const role = await obtenerRolUsuario(session.user.id)
      callback({
        uid: session.user.id,
        email: session.user.email!,
        displayName: session.user.user_metadata?.nombre_completo || session.user.email!,
        role: role as 'user' | 'admin',
      })
    } else {
      callback(null)
    }
  })

  return () => subscription.unsubscribe()
}
