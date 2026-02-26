"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  variant?: "home" | "dashboard";
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Navigation({ variant = "home", user }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSignOutModal(false);
    };
    if (showSignOutModal) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSignOutModal]);

  const isDashboard = variant === "dashboard";

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
    setMobileMenuOpen(false);
  };

  const handleCancelSignOut = () => {
    setShowSignOutModal(false);
  };

  const handleConfirmSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <nav
        className={cn(
          "w-full z-50 transition-all duration-300",
          isDashboard
            ? "sticky top-0 bg-primary shadow-md py-2 border-b border-white/10"
            : cn(
                "fixed top-0",
                scrolled
                  ? "bg-primary/95 backdrop-blur-md shadow-lg py-2 border-b border-primary/10"
                  : "bg-transparent py-4 bg-gradient-to-b from-black/50 to-transparent",
              ),
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logos */}
            <Link
              href={user ? "/dashboard" : "/"}
              className="flex items-center gap-2 group animate-in fade-in-0 slide-in-from-top-2 duration-700"
            >
              {/* ENTC Logo */}
              <div className="bg-white/95 rounded-lg p-1.5 hover:scale-105 transition-transform flex items-center justify-center h-10 w-10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-700 delay-100">
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
              <div className="relative h-10 w-12 hover:scale-105 transition-transform hidden sm:block animate-in fade-in-0 slide-in-from-left-2 duration-700 delay-200">
                <Image
                  src="/E club white.png"
                  alt="E-Club Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>

              {/* Divider */}
              <div className="h-8 w-[1px] bg-white/30 hidden sm:block" />

              {/* E-Connect Logo */}
              <div className="bg-white/95 rounded-lg p-1.5 h-10 w-10 overflow-hidden hover:scale-105 transition-transform hidden sm:flex items-center justify-center animate-in fade-in-0 slide-in-from-left-2 duration-700 delay-300">
                <Image
                  src="/e-connect-logo.png"
                  alt="E-Connect Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  unoptimized
                />
              </div>

              {/* Mobile text backup */}
              <span className="font-bold text-lg text-white sm:hidden">
                ENTC Mentorship
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                // Logged In State for Dashboard
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-white/70">{user.email}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20 border-0"
                    type="button"
                    onClick={handleSignOutClick}
                  >
                    Sign Out
                  </Button>
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
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
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
                      onClick={handleSignOutClick}
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

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCancelSignOut}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X Close Button */}
            <button
              onClick={handleCancelSignOut}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              aria-label="Cancel sign out"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-50 rounded-full mb-4">
                <LogOut className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelSignOut}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
