"use client"

import Navigation from "@/components/Navigation"
import Hero from "@/components/Hero"
import Features from "@/components/Features"
import HomeSections from "@/components/HomeSections"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <HomeSections />
      </main>
      <Footer />
    </div>
  )
}