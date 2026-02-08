
"use client"

import React from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Users, GraduationCap, ArrowRight, Lightbulb } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navigation />

      <main className="flex-1">
        {/* Helper Wrapper for consistency */}
        <div className="bg-background">

          {/* Hero Section */}
          <section className="relative overflow-hidden bg-primary text-primary-foreground py-20 lg:py-32">
            <div className="absolute inset-0 z-0">
              <Image
                src="/entc.jpg"
                alt="ENTC Department"
                fill
                className="object-cover opacity-40 hover:scale-105 transition-transform duration-[60s]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary/95 mix-blend-multiply" />
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center">
              <div className="inline-block px-3 py-1 bg-primary-foreground/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-primary-foreground/20">
                Department of Electronic & Telecommunication Engineering
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-balance">
                ENTC Mentorship <br className="hidden md:block" /> Programme
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                Connecting undergraduates with alumni and industry professionals for career guidance, research mentorship, and professional growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold h-12 px-8 text-base shadow-lg shadow-black/10">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8 text-base">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Simple Overview Section */}
          <section className="py-20 container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Empowering the Next Generation</h2>
              <p className="text-muted-foreground text-lg">
                A structured platform to bridge the gap between academic learning and industry reality.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                icon={<GraduationCap className="w-8 h-8" />}
                title="For Undergraduates"
                description="Identify your career path, find research opportunities, and get personalized advice from seniors who have walked the path."
              />
              <FeatureCard
                icon={<Users className="w-8 h-8" />}
                title="For Mentors"
                description="Give back to the department, shape the future of engineering talent, and stay connected with the ENTC community."
              />
              <FeatureCard
                icon={<Lightbulb className="w-8 h-8" />}
                title="Knowledge Exchange"
                description="Facilitate a culture of learning where industry insights and academic innovations meet."
              />
            </div>
          </section>

          {/* Final CTA */}
          <section className="bg-muted/30 py-20 border-t">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6">Join the Community</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Whether you are a student looking for guidance or an alumnus ready to mentor, your journey starts here.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Join Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </div>

      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
      <div className="w-14 h-14 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}
