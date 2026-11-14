// ============================================================
// MOTOSAFE - Autenticación DEMO (sin Firebase)
// Reemplazar con Firebase cuando esté configurado
// ============================================================

export interface UserDemo {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'user' | 'admin'
}

// Usuario demo almacenado en memoria
let usuarioActual: UserDemo | null = null
const listeners: Array<(user: UserDemo | null) => void> = []

// Usuarios demo predefinidos
const USUARIOS_DEMO: Record<string, { password: string; user: UserDemo }> = {
  'demo@motosafe.com': {
    password: '123456',
    user: {
      uid: 'demo-uid-001',
      email: 'demo@motosafe.com',
      displayName: 'Carlos Rodríguez',
      role: 'user',
    },
  },
  'admin@motosafe.com': {
    password: 'admin123',
    user: {
      uid: 'admin-uid-001',
      email: 'admin@motosafe.com',
      displayName: 'Administrador',
      role: 'admin',
    },
  },
}

function notificarListeners() {
  listeners.forEach(cb => cb(usuarioActual))
}

/** Registrar nuevo usuario */
export async function registrarUsuario(
  email: string,
  contrasena: string,
  nombreCompleto: string
): Promise<UserDemo> {
  await new Promise(r => setTimeout(r, 800)) // simular delay de red

  const nuevoUsuario: UserDemo = {
    uid: `uid-${Date.now()}`,
    email,
    displayName: nombreCompleto,
    role: 'user',
  }

  // Guardar en localStorage para persistencia
  if (typeof window !== 'undefined') {
    const registrados = JSON.parse(localStorage.getItem('motosafe_users') || '{}')
    registrados[email] = { password: contrasena, user: nuevoUsuario }
    localStorage.setItem('motosafe_users', JSON.stringify(registrados))
    localStorage.setItem('motosafe_current_user', JSON.stringify(nuevoUsuario))
  }

  usuarioActual = nuevoUsuario
  notificarListeners()
  return nuevoUsuario
}

/** Iniciar sesión con email y contraseña */
export async function iniciarSesion(
  email: string,
  contrasena: string
): Promise<UserDemo> {
  await new Promise(r => setTimeout(r, 600))

  // Verificar usuarios demo predefinidos
  const demo = USUARIOS_DEMO[email]
  if (demo && demo.password === contrasena) {
    usuarioActual = demo.user
    if (typeof window !== 'undefined') {
      localStorage.setItem('motosafe_current_user', JSON.stringify(demo.user))
    }
    notificarListeners()
    return demo.user
  }

  // Verificar usuarios registrados en localStorage
  if (typeof window !== 'undefined') {
    const registrados = JSON.parse(localStorage.getItem('motosafe_users') || '{}')
    const encontrado = registrados[email]
    if (encontrado && encontrado.password === contrasena) {
      usuarioActual = encontrado.user
      localStorage.setItem('motosafe_current_user', JSON.stringify(encontrado.user))
      notificarListeners()
      return encontrado.user
    }
  }

  // Error de credenciales
  const error: any = new Error('Correo o contraseña incorrectos')
  error.code = 'auth/invalid-credential'
  throw error
}

/** Iniciar sesión con Google (demo) */
export async function iniciarSesionGoogle(): Promise<UserDemo> {
  await new Promise(r => setTimeout(r, 500))

  const googleUser: UserDemo = {
    uid: `google-uid-${Date.now()}`,
    email: 'usuario@gmail.com',
    displayName: 'Usuario Google',
    photoURL: undefined,
    role: 'user',
  }

  usuarioActual = googleUser
  if (typeof window !== 'undefined') {
    localStorage.setItem('motosafe_current_user', JSON.stringify(googleUser))
  }
  notificarListeners()
  return googleUser
}

/** Cerrar sesión */
export async function cerrarSesion(): Promise<void> {
  usuarioActual = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('motosafe_current_user')
  }
  notificarListeners()
}

/** Enviar email de restablecimiento (demo) */
export async function restablecerContrasena(email: string): Promise<void> {
  await new Promise(r => setTimeout(r, 500))
  // En demo solo simulamos el envío
  console.log(`[DEMO] Email de recuperación enviado a: ${email}`)
}

/** Obtener rol del usuario */
export async function obtenerRolUsuario(userId: string): Promise<string> {
  if (typeof window !== 'undefined') {
    const current = localStorage.getItem('motosafe_current_user')
    if (current) {
      const user = JSON.parse(current) as UserDemo
      return user.role
    }
  }
  return 'user'
}

/** Listener del estado de autenticación */
export function onAuthChange(callback: (user: UserDemo | null) => void) {
  // Restaurar sesión desde localStorage
  if (typeof window !== 'undefined' && !usuarioActual) {
    const saved = localStorage.getItem('motosafe_current_user')
    if (saved) {
      usuarioActual = JSON.parse(saved)
    }
  }

  listeners.push(callback)
  // Llamar inmediatamente con el estado actual
  callback(usuarioActual)

  // Retornar función de limpieza
  return () => {
    const idx = listeners.indexOf(callback)
    if (idx > -1) listeners.splice(idx, 1)
  }
}
