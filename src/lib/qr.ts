// ============================================================
// MOTOSAFE - Generación de QR (DEMO sin Firebase)
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/** Genera la URL pública del perfil del motociclista */
export function generarUrlPerfil(userId: string): string {
  return `${APP_URL}/perfil/${userId}`
}

/** Inicializa el QR de un usuario (demo: solo guarda en localStorage) */
export async function inicializarQR(userId: string): Promise<string> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`motosafe_qr_${userId}`, generarUrlPerfil(userId))
  }
  return generarUrlPerfil(userId)
}

/** Genera imagen QR en formato base64 */
export async function generarQRBase64(userId: string): Promise<string> {
  const QRCode = (await import('qrcode')).default
  const url = generarUrlPerfil(userId)
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#020e3d', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
}

/** Descarga el QR como PNG */
export async function descargarQRPNG(userId: string, nombreArchivo = 'motosafe-qr') {
  const dataUrl = await generarQRBase64(userId)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${nombreArchivo}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function desactivarQR(userId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`motosafe_qr_${userId}`)
  }
}

export async function reactivarQR(userId: string): Promise<void> {
  await inicializarQR(userId)
}
