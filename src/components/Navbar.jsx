import { Droplets, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const links = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
            <Droplets size={18} aria-hidden="true" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-slate-900">
            Smart water billing
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-sm text-slate-600 transition-colors hover:text-sky-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-sky-700"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="rounded-lg bg-gradient-to-r from-sky-600 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.03]"
          >
            Get started
          </button>
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="text-sm text-slate-600">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-teal-500 px-4 py-2 text-sm font-medium text-white"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
