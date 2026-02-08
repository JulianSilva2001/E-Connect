
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  variant?: "home" | "dashboard"
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Navigation({ variant = "home", user }: NavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isDashboard = variant === "dashboard"

  return (
    <nav
      className={cn(
        "w-full z-50 transition-all duration-300",
        isDashboard
          ? "sticky top-0 bg-primary shadow-md py-2 border-b border-white/10"
          : cn(
            "fixed top-0",
            scrolled
              ? "bg-primary/95 backdrop-blur-md shadow-lg py-2 border-b border-primary/10"
              : "bg-transparent py-4 bg-gradient-to-b from-black/50 to-transparent"
          )
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logos */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-4 group">
            {/* ENTC Logo */}
            <div className="bg-white/95 rounded-lg p-1.5 hover:scale-105 transition-transform flex items-center justify-center h-10 w-10 overflow-hidden">
              <Image
                src="/ENTC_logo_blue.png"
                alt="ENTC Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>

            {/* Divider */}
            <div className="h-8 w-[1px] bg-white/30 hidden sm:block" />

            {/* E-Club Logo */}
            <div className="relative h-10 w-24 hover:scale-105 transition-transform hidden sm:block">
              <Image
                src="/E club white.png"
                alt="E-Club Logo"
                fill
                className="object-contain object-left"
              />
            </div>
            {/* Mobile text backup */}
            <span className="font-bold text-lg text-white sm:hidden">ENTC Mentorship</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              // Logged In State for Dashboard
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white leading-none">{user.name}</p>
                  <p className="text-xs text-white/70">{user.email}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0)}
                </div>
                <form action={async () => {
                  // Simple client-side redirection to NextAuth signout
                  window.location.href = "/api/auth/signout"
                }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20 border-0"
                    type="submit"
                  >
                    Sign Out
                  </Button>
                </form>
              </div>
            ) : (
              // Guest State
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors text-white/90 hover:text-white"
                >
                  Login
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="bg-white text-primary hover:bg-white/90 font-semibold shadow-md rounded-full px-6 transition-transform hover:scale-105"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10 py-4 px-4 shadow-xl animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-white/10 mb-2">
                    <p className="font-bold text-white">{user.name}</p>
                    <p className="text-xs text-white/70">{user.email}</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = "/api/auth/signout"}
                    className="w-full bg-white/10 hover:bg-white/20 text-white justify-start"
                    variant="ghost"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 text-white hover:bg-white/10 rounded-lg text-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 bg-white text-primary text-center rounded-lg font-bold shadow-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
