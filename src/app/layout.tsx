import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MotoSafe - Tu identidad. Tu seguridad. Tu camino.',
    template: '%s | MotoSafe',
  },
  description:
    'MotoSafe es la plataforma digital de identificación, seguridad y asistencia para motociclistas. Crea tu perfil, obtén tu QR personalizado y facilita la asistencia en emergencias.',
  keywords: [
    'motociclistas',
    'seguridad vial',
    'QR emergencias',
    'asistencia motocicletas',
    'Colombia',
    'MotoSafe',
  ],
  authors: [{ name: 'MotoSafe' }],
  creator: 'MotoSafe',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'MotoSafe - Tu identidad. Tu seguridad. Tu camino.',
    description: 'Plataforma digital de identificación y seguridad para motociclistas',
    siteName: 'MotoSafe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MotoSafe',
    description: 'Plataforma digital de identificación y seguridad para motociclistas',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#020e3d',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#16a34a',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
