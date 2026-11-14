// ============================================================
// MOTOSAFE - Tipos globales de TypeScript
// ============================================================

// --- Usuario / Motociclista ---
export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'user' | 'admin' | 'superadmin'
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  profileId: string // referencia al perfil del motociclista
}

export interface MotocyclistProfile {
  id: string
  userId: string
  // Datos personales
  nombres: string
  apellidos: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  fotoPerfil?: string
  celular: string
  email: string
  ciudad: string
  departamento?: string
  pais: string
  // QR
  qrCode: string // URL/ID único del QR
  qrActivo: boolean
  // Estado
  isActive: boolean
  profilePublico: ConfiguracionPrivacidad
  createdAt: Date
  updatedAt: Date
}

export type TipoDocumento =
  | 'CC'   // Cédula de ciudadanía
  | 'CE'   // Cédula de extranjería
  | 'PA'   // Pasaporte
  | 'TI'   // Tarjeta de identidad
  | 'NIT'  // NIT
  | 'OTRO'

// --- Motocicleta ---
export interface Motocicleta {
  id: string
  userId: string
  placa: string
  marca: string
  modelo: string
  cilindraje: string
  color: string
  anio: number
  fotoMoto?: string
  // Documentos
  soatVencimiento?: Date
  tecnomecanicaVencimiento?: Date
  licenciaVencimiento?: Date
  // Historial
  historialMantenimiento?: RegistroMantenimiento[]
  createdAt: Date
  updatedAt: Date
}

export interface RegistroMantenimiento {
  id: string
  fecha: Date
  tipo: string
  descripcion: string
  costo?: number
  kilometraje?: number
  taller?: string
}

// --- Contactos de emergencia ---
export interface ContactoEmergencia {
  id: string
  userId: string
  nombreCompleto: string
  parentesco: string
  celular: string
  email?: string
  autorizadoNotificaciones: boolean
  esContactoPrincipal: boolean
}

// --- Información médica ---
export interface InfoMedica {
  id: string
  userId: string
  grupoSanguineo?: string
  eps?: string
  alergias?: string
  condicionesMedicas?: string
  medicamentos?: string
  observaciones?: string
  // Privacidad: solo se muestra si el propietario lo autoriza
  mostrarEnEmergencia: boolean
  updatedAt: Date
}

// --- Configuración de privacidad del perfil público ---
export interface ConfiguracionPrivacidad {
  mostrarNombre: boolean
  mostrarCelular: boolean
  mostrarEmail: boolean
  mostrarCiudad: boolean
  mostrarPlacaMoto: boolean
  mostrarFotoMoto: boolean
  mostrarContactosEmergencia: boolean
  mostrarInfoMedica: boolean
}

// --- Perfil público (lo que ve quien escanea el QR) ---
export interface PerfilPublico {
  userId: string
  nombres: string
  apellidos: string
  fotoPerfil?: string
  ciudad?: string
  moto?: {
    placa: string
    marca: string
    modelo: string
    color: string
    fotoMoto?: string
  }
  contactosEmergencia: ContactoEmergenciaPublico[]
  infoMedica?: InfoMedicaPublica
  qrActivo: boolean
}

export interface ContactoEmergenciaPublico {
  id: string
  nombreCompleto: string
  parentesco: string
  celular: string
}

export interface InfoMedicaPublica {
  grupoSanguineo?: string
  eps?: string
  alergias?: string
  condicionesMedicas?: string
  medicamentos?: string
  observaciones?: string
}

// --- Reportes de emergencia ---
export interface ReporteEmergencia {
  id: string
  motociclista: {
    userId: string
    nombres: string
    apellidos: string
    placa?: string
  }
  reportadoPor: {
    esAnonimo: boolean
    nombre?: string
    celular?: string
    email?: string
  }
  tipoEmergencia: TipoEmergencia
  ubicacion: Ubicacion
  descripcion?: string
  estado: EstadoReporte
  serviciosContactados: ServicioEmergencia[]
  timestamp: Date
  updatedAt: Date
}

export type TipoEmergencia =
  | 'ACCIDENTE'
  | 'AVERIA_MECANICA'
  | 'ROBO'
  | 'MEDICA'
  | 'INCENDIO'
  | 'OTRA'

export type EstadoReporte =
  | 'ACTIVO'
  | 'EN_ATENCION'
  | 'RESUELTO'
  | 'FALSA_ALARMA'

export type ServicioEmergencia =
  | 'AMBULANCIA'
  | 'POLICIA'
  | 'BOMBEROS'
  | 'GRUA'
  | 'TRANSITO'
  | 'CONTACTO_PERSONAL'

// --- Ubicación ---
export interface Ubicacion {
  latitud: number
  longitud: number
  direccion?: string
  ciudad?: string
  referencia?: string
  timestamp: Date
  precision?: number
  mapsUrl?: string
}

// --- Alerta vial ---
export interface AlertaVial {
  id: string
  tipo: TipoAlerta
  titulo: string
  descripcion: string
  ubicacion: Ubicacion
  fotografia?: string
  reportadoPor: string // userId o 'anonimo'
  verificada: boolean
  activa: boolean
  votos: { util: number; noUtil: number }
  createdAt: Date
  expiresAt?: Date
}

export type TipoAlerta =
  | 'ACCIDENTE'
  | 'VIA_CERRADA'
  | 'OBRAS'
  | 'CONGESTION'
  | 'CLIMA_PELIGROSO'
  | 'OBSTACULO'
  | 'CONTROL_POLICIAL'
  | 'OTRO'

// --- Establecimiento / Servicio para motociclistas ---
export interface Establecimiento {
  id: string
  nombre: string
  tipo: TipoEstablecimiento
  descripcion?: string
  direccion: string
  ciudad: string
  ubicacion: { lat: number; lng: number }
  telefono?: string
  whatsapp?: string
  horarios?: string
  calificacion?: number
  verificado: boolean
  fotografia?: string
  createdAt: Date
}

export type TipoEstablecimiento =
  | 'GASOLINERA'
  | 'TALLER'
  | 'MONTALLANTAS'
  | 'REPUESTOS'
  | 'GRUA'
  | 'PARQUEADERO'
  | 'CENTRO_ASISTENCIA'
  | 'OTRO'

// --- Club motero ---
export interface ClubMotero {
  id: string
  nombre: string
  descripcion?: string
  ciudad: string
  logoUrl?: string
  adminId: string
  miembros: string[] // userIds
  esPrivado: boolean
  createdAt: Date
}

// --- Evento motero ---
export interface EventoMotero {
  id: string
  clubId?: string
  titulo: string
  descripcion: string
  fechaInicio: Date
  fechaFin?: Date
  ubicacion: string
  coordenadas?: { lat: number; lng: number }
  organizadorId: string
  participantes: string[]
  fotografia?: string
  esPublico: boolean
  createdAt: Date
}

// --- Formulario de registro ---
export interface FormularioRegistro {
  // Paso 1: Datos personales
  nombres: string
  apellidos: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  celular: string
  email: string
  ciudad: string
  contrasena: string
  confirmarContrasena: string
  // Paso 2: Motocicleta
  placa: string
  marcaMoto: string
  modeloMoto: string
  cilindraje: string
  colorMoto: string
  anioMoto: number
  // Paso 3: Contactos de emergencia
  contactosEmergencia: Omit<ContactoEmergencia, 'id' | 'userId'>[]
  // Paso 4: Info médica (opcional)
  infoMedica?: Omit<InfoMedica, 'id' | 'userId' | 'updatedAt'>
  // Paso 5: Términos
  aceptaTerminos: boolean
  autorizaTratamientoDatos: boolean
}

// --- Configuración de servicios de emergencia por región ---
export interface ServiciosEmergenciaRegion {
  id: string
  pais: string
  departamento?: string
  ciudad?: string
  ambulancia: string[]
  policia: string[]
  bomberos: string[]
  transito: string[]
  grua?: string[]
  updatedAt: Date
}

// --- Estadísticas del panel admin ---
export interface EstadisticasAdmin {
  totalUsuarios: number
  usuariosActivos: number
  totalMotocicletas: number
  totalQRGenerados: number
  reportesEmergenciaHoy: number
  reportesEmergenciaMes: number
  alertasViales: number
  clubes: number
  eventos: number
  establecimientos: number
}

// ============================================================
// SISTEMA DE AMBULANCIAS — Tipos
// ============================================================

export type EstadoConductorAmbulancia = 'DISPONIBLE' | 'OCUPADO' | 'INACTIVO'
export type EstadoSolicitudAmbulancia =
  | 'PENDIENTE'      // esperando que alguna ambulancia acepte
  | 'ACEPTADA'       // una ambulancia aceptó
  | 'EN_CAMINO'      // conductor en tránsito
  | 'COMPLETADA'     // servicio finalizado
  | 'CANCELADA'      // cancelada por el solicitante

export interface ConductorAmbulancia {
  id: string
  // Datos personales
  nombres: string
  apellidos: string
  celular: string
  email: string
  fotoPerfil?: string
  // Datos del vehículo
  placaAmbulancia: string
  empresa: string           // ej. "Cruz Roja", "Privada", "Bomberos"
  tipoAmbulancia: 'BASICA' | 'MEDICALIZADA' | 'NEONATAL' | 'BARIATRICA'
  fotoAmbulancia?: string
  // Ubicación en tiempo real
  ubicacionActual?: {
    lat: number
    lng: number
    timestamp: Date
  }
  estado: EstadoConductorAmbulancia
  // Verificación
  verificado: boolean
  calificacion: number      // promedio 1-5
  totalServicios: number
  createdAt: Date
  updatedAt: Date
}

export interface SolicitudAmbulancia {
  id: string
  // Datos del accidentado (del perfil QR)
  accidentado: {
    userId: string
    nombres: string
    apellidos: string
    placa?: string
    grupoSanguineo?: string
    eps?: string
    alergias?: string
    condicionesMedicas?: string
  }
  // Quien solicita (puede ser el mismo accidentado u otra persona)
  solicitante: {
    esAnonimo: boolean
    nombre?: string
    celular?: string
  }
  // Ubicación del accidente
  ubicacion: {
    lat: number
    lng: number
    direccion?: string
    mapsUrl?: string
  }
  estado: EstadoSolicitudAmbulancia
  // Conductor que aceptó
  conductorAceptado?: {
    conductorId: string
    nombres: string
    apellidos: string
    celular: string
    placaAmbulancia: string
    empresa: string
    tipoAmbulancia: string
    fotoPerfil?: string
    fotoAmbulancia?: string
    ubicacion?: { lat: number; lng: number }
    etaMinutos?: number       // tiempo estimado de llegada
  }
  // IDs de conductores que rechazaron (para no volvérselas a enviar)
  conductoresRechazados: string[]
  descripcion?: string
  timestamp: Date
  updatedAt: Date
}
