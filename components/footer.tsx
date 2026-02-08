
import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logos & Branding */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-1.5 rounded-lg h-12 w-12 flex items-center justify-center">
                <Image
                  src="/ENTC_logo_blue.png"
                  alt="ENTC Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <div className="relative h-8 w-24">
                <Image
                  src="/E club white.png"
                  alt="E-Club Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-sm text-slate-400">
              Department of Electronic & Telecommunication Engineering,<br />
              University of Moratuwa.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register as Mentor</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register as Mentee</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>

          {/* Contact / Socials (Placeholder) */}
          <div>
            <h4 className="font-semibold text-white mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://ent.mrt.ac.lk/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Department Website</a></li>
              <li><a href="https://eclub.mrt.ac.lk/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">E-Club</a></li>
              <li><a href="https://www.linkedin.com/company/entc-uom/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} ENTC E-Club. All rights reserved.</p>
          <p>Designed  developed by Electronic and Telecommunication Engineering Students.</p>
        </div>
      </div>
    </footer>
  )
}
