// ============================================================
// MOTOSAFE - Utilidades generales
// ============================================================
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases de Tailwind de forma segura */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea un número de teléfono colombiano para whatsapp */
export function formatWhatsAppNumber(numero: string): string {
  // Eliminar todo excepto dígitos
  const limpio = numero.replace(/\D/g, '')
  // Si empieza con 0, reemplazar por código de Colombia
  if (limpio.startsWith('0')) return `57${limpio.slice(1)}`
  // Si ya tiene código de país
  if (limpio.startsWith('57') && limpio.length === 12) return limpio
  // Agregar código de Colombia
  return `57${limpio}`
}

/** Genera URL de WhatsApp con mensaje */
export function generarUrlWhatsApp(numero: string, mensaje: string): string {
  const numeroFormateado = formatWhatsAppNumber(numero)
  const mensajeCodificado = encodeURIComponent(mensaje)
  return `https://wa.me/${numeroFormateado}?text=${mensajeCodificado}`
}

/** Genera URL de Google Maps desde coordenadas */
export function generarUrlMaps(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

/** Genera link para compartir ubicación */
export function generarMensajeEmergencia(params: {
  nombreMotociclista: string
  placa?: string
  lat: number
  lng: number
  tipoEmergencia?: string
  direccion?: string
}): string {
  const { nombreMotociclista, placa, lat, lng, tipoEmergencia, direccion } = params
  const mapsUrl = generarUrlMaps(lat, lng)
  const ahora = new Date()
  const fecha = ahora.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  let mensaje = `🚨 *EMERGENCIA MOTOSAFE*\n\n`
  mensaje += `👤 *Motociclista:* ${nombreMotociclista}\n`
  if (placa) mensaje += `🏍️ *Placa:* ${placa}\n`
  if (tipoEmergencia) mensaje += `⚠️ *Tipo:* ${tipoEmergencia}\n`
  if (direccion) mensaje += `📍 *Dirección:* ${direccion}\n`
  mensaje += `🗺️ *Ubicación:* ${mapsUrl}\n`
  mensaje += `📌 *Coordenadas:* ${lat.toFixed(6)}, ${lng.toFixed(6)}\n`
  mensaje += `🕐 *Fecha y hora:* ${fecha}\n\n`
  mensaje += `_Mensaje generado automáticamente por MotoSafe_`

  return mensaje
}

/** Trunca texto a N caracteres */
export function truncarTexto(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto
  return `${texto.slice(0, maxLength)}...`
}

/** Formatea fecha en español */
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/** Genera un ID único simple */
export function generarId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/** Valida formato de placa colombiana */
export function validarPlaca(placa: string): boolean {
  // Formato colombiano: 3 letras + 2 números + 1 letra O 3 letras + 3 números
  const regex = /^[A-Z]{3}[0-9]{2}[A-Z]{1}$|^[A-Z]{3}[0-9]{3}$/i
  return regex.test(placa.toUpperCase())
}

/** Normaliza placa a mayúsculas sin espacios */
export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/\s/g, '')
}

/** Convierte número de documento a string limpio */
export function limpiarDocumento(doc: string): string {
  return doc.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
}
