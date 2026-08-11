import { ArrowRight, CheckCircle2, Minus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BuildingsSkyline from '../components/BuildingsSkyline'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Reveal from '../components/Reveal'
import WaveDivider from '../components/WaveDivider'

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    tagline: 'For a single building trying it out',
    highlight: false,
  },
  {
    name: 'Community',
    price: '\u20b92,499',
    period: '/month',
    tagline: 'For most apartment communities',
    highlight: true,
  },
  {
    name: 'Township',
    price: 'Custom',
    period: '',
    tagline: 'For multi-block townships',
    highlight: false,
  },
]

const rows = [
  { label: 'Households', values: ['Up to 20', 'Unlimited', 'Unlimited'] },
  { label: 'Meter reading entry', values: ['Manual', 'Manual + CSV bulk upload', 'Manual + CSV + smart meter feed'] },
  { label: 'Overuse & leak alerts', values: [false, true, true] },
  { label: 'Resident logins', values: [true, true, true] },
  { label: 'Admin dashboard', values: [true, true, true] },
  { label: 'Multiple properties', values: [false, false, true] },
  { label: 'Role-based access', values: [false, false, true] },
  { label: 'Support', values: ['Community forum', 'Email support', 'Priority support'] },
]

function Cell({ value }) {
  if (value === true) {
    return <CheckCircle2 size={18} className="mx-auto text-teal-600" aria-hidden="true" />
  }
  if (value === false) {
    return <Minus size={16} className="mx-auto text-slate-300" aria-hidden="true" />
  }
  return <span className="text-sm text-slate-700">{value}</span>
}

export default function PricingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-teal-50/60 to-white">
          <BuildingsSkyline className="absolute bottom-0 left-0 h-40 w-full opacity-60 blur-[3px] sm:h-56" />
          <div
            className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-4xl px-5 pb-14 pt-16 text-center sm:pt-20">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-sky-700 backdrop-blur">
                Pricing
              </span>
              <h1 className="font-display mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                Plans that grow with your{' '}
                <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
                  community
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base text-slate-500">
                No setup fees. No lock-in. Move up a plan whenever your apartment needs more.
              </p>
            </Reveal>
          </div>
          <WaveDivider variant="skyToWhite" />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 pt-4">
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                    tier.highlight
                      ? 'border-transparent bg-gradient-to-b from-sky-600 to-teal-600 text-white shadow-xl shadow-sky-600/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {tier.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-amber-950">
                      Most popular
                    </span>
                  )}
                  <p className={`text-sm font-medium ${tier.highlight ? 'text-sky-100' : 'text-slate-500'}`}>
                    {tier.name}
                  </p>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold">{tier.price}</span>
                    <span className={tier.highlight ? 'text-sky-100' : 'text-slate-500'}>
                      {tier.period}
                    </span>
                  </p>
                  <p className={`mt-1 text-xs ${tier.highlight ? 'text-sky-100' : 'text-slate-500'}`}>
                    {tier.tagline}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      tier.highlight
                        ? 'bg-white text-sky-700 hover:bg-sky-50'
                        : 'border border-slate-300 text-slate-700 hover:border-sky-400 hover:text-sky-700'
                    }`}
                  >
                    Choose {tier.name}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="mt-14 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 text-sm font-medium text-slate-900">Compare plans</th>
                    {tiers.map((t) => (
                      <th
                        key={t.name}
                        className="px-5 py-3 text-center text-sm font-medium text-slate-900"
                      >
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      <td className="px-5 py-3 text-sm text-slate-600">{row.label}</td>
                      {row.values.map((v, j) => (
                        <td key={j} className="px-5 py-3 text-center">
                          <Cell value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-500 to-teal-500">
          <div
            className="animate-gradient-x absolute inset-0 bg-gradient-to-br from-sky-600 via-teal-500 to-sky-600 opacity-80"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-5 py-16 text-center">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Not sure which plan fits?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-sky-50">
                Start on Starter for free and upgrade the moment your community needs more.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-sky-700 shadow-lg shadow-sky-900/20 transition-transform hover:scale-[1.03]"
              >
                Sign in
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
