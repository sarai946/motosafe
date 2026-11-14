import React from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-white font-display font-bold text-3xl mb-2">Política de privacidad</h1>
            <p className="text-white/40 text-sm">Última actualización: noviembre de 2026</p>
          </div>
          <div className="prose prose-invert max-w-none space-y-6 text-white/70 leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">1. Responsable del tratamiento</h2>
              <p>MotoSafe es responsable del tratamiento de los datos personales recopilados a través de esta plataforma, en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">2. Datos que recopilamos</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Datos de identificación: nombres, apellidos, tipo y número de documento</li>
                <li>Datos de contacto: correo electrónico, número de celular, ciudad</li>
                <li>Datos del vehículo: placa, marca, modelo, cilindraje, color, año</li>
                <li>Contactos de emergencia registrados voluntariamente</li>
                <li>Información médica registrada voluntariamente</li>
                <li>Datos de ubicación GPS con autorización previa</li>
                <li>Datos de uso de la plataforma</li>
              </ul>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">3. Finalidad del tratamiento</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Identificación del motociclista en situaciones de emergencia</li>
                <li>Facilitar la comunicación con contactos de emergencia y servicios de socorro</li>
                <li>Prestación de los servicios de la plataforma MotoSafe</li>
                <li>Mejora continua del servicio</li>
                <li>Cumplimiento de obligaciones legales</li>
              </ul>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">4. Datos públicos en el QR</h2>
              <p>El código QR de MotoSafe dirige a un perfil público que muestra <strong className="text-white">únicamente la información que el titular autorice expresamente</strong>. Por defecto, se muestran: nombre, foto de perfil, datos básicos de la motocicleta y contactos de emergencia habilitados. Nunca se muestran el número completo de documento, dirección residencial, contraseña ni información médica salvo autorización expresa.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">5. Derechos del titular</h2>
              <p>El titular de los datos tiene derecho a conocer, actualizar, rectificar y suprimir sus datos, así como a revocar la autorización otorgada. Para ejercer estos derechos puede contactarnos en: <strong className="text-white">contacto@motosafe.app</strong></p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">6. Seguridad</h2>
              <p>MotoSafe implementa medidas técnicas y organizativas apropiadas para proteger los datos personales, incluyendo cifrado HTTPS, almacenamiento seguro de contraseñas y control de acceso basado en roles.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-xl mb-3">7. Contacto</h2>
              <p>Para cualquier consulta relacionada con el tratamiento de sus datos personales: <strong className="text-white">contacto@motosafe.app</strong></p>
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
