import { ArrowRight, Droplets, Gauge, Mail, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BuildingsSkyline from '../components/BuildingsSkyline'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Reveal from '../components/Reveal'
import WaveDivider from '../components/WaveDivider'

const values = [
  {
    icon: Gauge,
    title: 'Accurate by default',
    body: 'Billing math is transparent and auditable, so no household has to take a number on faith.',
  },
  {
    icon: Users,
    title: 'Built for communities',
    body: 'Every decision is made for volunteer admins running a residents\u2019 association, not enterprise IT teams.',
  },
  {
    icon: ShieldCheck,
    title: 'Catch problems early',
    body: 'Leaks and overuse are surfaced the same day, before they turn into a disputed bill.',
  },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-teal-50/60 to-white">
          <BuildingsSkyline className="absolute bottom-0 left-0 h-40 w-full opacity-60 blur-[3px] sm:h-56" />
          <div
            className="animate-blob absolute -right-24 -top-10 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-4xl px-5 pb-14 pt-16 text-center sm:pt-20">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-sky-700 backdrop-blur">
                <Droplets size={12} aria-hidden="true" />
                About us
              </span>
              <h1 className="font-display mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                Built by residents,{' '}
                <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
                  for residents
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base text-slate-500">
                Smart water billing started as a way to end one apartment\u2019s monthly water
                bill arguments. It now runs usage tracking and billing for communities across
                the city.
              </p>
            </Reveal>
          </div>
          <WaveDivider variant="skyToWhite" />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 pt-4">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              What we care about
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100}>
                <div className="h-full rounded-xl border border-slate-200 bg-white p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
                    <v.icon size={20} aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-medium text-slate-900">{v.title}</p>
                  <p className="mt-1.5 text-sm text-slate-500">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <div className="relative">
          <WaveDivider variant="whiteToNavy" />
          <section id="contact" className="relative overflow-hidden bg-slate-900">
            <div
              className="animate-blob absolute left-1/4 top-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-3xl px-5 py-16 text-center">
              <Reveal>
                <span className="text-xs font-medium uppercase tracking-wider text-teal-300">
                  Get in touch
                </span>
                <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Questions about setting up your community?
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
                  Reach out and an admin from our team will walk you through onboarding your
                  apartment.
                </p>
                <a
                  href="mailto:hello@smartwaterbilling.example"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-teal-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-sky-900/30 transition-transform hover:scale-[1.03]"
                >
                  <Mail size={16} aria-hidden="true" />
                  hello@smartwaterbilling.example
                </a>
              </Reveal>
            </div>
          </section>
          <WaveDivider variant="navyToWhite" />
        </div>

        <section className="mx-auto max-w-6xl px-5 py-16 text-center">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Ready to try it in your apartment?
            </h2>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-teal-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-sky-600/20 transition-transform hover:scale-[1.03]"
            >
              Create an account
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
