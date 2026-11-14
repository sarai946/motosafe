import React from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/home/HeroSection'
import ComoFunciona from '@/components/home/ComoFunciona'
import Beneficios from '@/components/home/Beneficios'
import SeccionEmergencias from '@/components/home/SeccionEmergencias'
import PreguntasFrecuentes from '@/components/home/PreguntasFrecuentes'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ComoFunciona />
        <Beneficios />
        <SeccionEmergencias />
        <PreguntasFrecuentes />
      </main>
      <Footer />
    </>
  )
}
