"use client"

import Navigation from "@/components/Navigation"
import Hero from "@/components/Hero"
import Features from "@/components/Features"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}