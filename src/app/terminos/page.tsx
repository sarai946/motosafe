import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function TerminosPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-white font-display font-bold text-3xl mb-2">Términos y condiciones</h1>
            <p className="text-white/40 text-sm">Última actualización: noviembre de 2026</p>
          </div>
          <div className="space-y-6 text-white/70 leading-relaxed text-sm">
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">1. Aceptación</h2>
              <p>Al registrarte en MotoSafe, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de los términos, no debes utilizar la plataforma.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">2. Descripción del servicio</h2>
              <p>MotoSafe es una plataforma digital de identificación, seguridad y asistencia para motociclistas. Proporciona un código QR personalizado que, al ser escaneado, permite acceder a información de emergencia del motociclista previamente autorizada.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">3. Uso del servicio</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>El usuario es responsable de mantener su información actualizada</li>
                <li>Está prohibido registrar información falsa o de terceros sin autorización</li>
                <li>El QR no debe utilizarse para fines distintos a la identificación y emergencias</li>
                <li>MotoSafe no garantiza la disponibilidad permanente de los servicios de emergencia externos</li>
              </ul>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">4. Limitación de responsabilidad</h2>
              <p>MotoSafe es una herramienta de apoyo. No reemplaza los servicios oficiales de emergencia. Las llamadas a servicios de emergencia se realizan directamente desde el dispositivo del usuario y requieren su confirmación. MotoSafe no es responsable de la respuesta o disponibilidad de los servicios externos.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">5. Privacidad</h2>
              <p>El tratamiento de datos personales se rige por nuestra <Link href="/privacidad" className="text-primary-400 underline">Política de Privacidad</Link>, en cumplimiento de la Ley 1581 de 2012.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">6. Modificaciones</h2>
              <p>MotoSafe se reserva el derecho de modificar estos términos. Los cambios serán notificados a los usuarios registrados y publicados en esta página.</p>
            </section>
          </div>
          <div className="mt-8">
            <Link href="/" className="text-primary-400 hover:text-primary-300 text-sm">← Volver al inicio</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
