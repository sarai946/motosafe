// ============================================================
// MOTOSAFE - Generación de QR (DEMO sin Firebase)
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://motosafe-epce.vercel.app'

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

export async function descargarQRPDF(userId: string, nombre: string, placa?: string) {
  const dataUrl = await generarQRBase64(userId)
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 110] })
  pdf.setFillColor(2, 14, 61)
  pdf.rect(0, 0, 85, 110, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('MotoSafe', 42.5, 12, { align: 'center' })
  pdf.addImage(dataUrl, 'PNG', 17.5, 22, 50, 50)
  pdf.setFontSize(10)
  pdf.text(nombre, 42.5, 80, { align: 'center' })
  if (placa) { pdf.setFontSize(8); pdf.setTextColor(100, 200, 100); pdf.text(`Placa: ${placa}`, 42.5, 87, { align: 'center' }) }
  pdf.save(`motosafe-qr-${nombre.replace(/\s/g, '-').toLowerCase()}.pdf`)
}
