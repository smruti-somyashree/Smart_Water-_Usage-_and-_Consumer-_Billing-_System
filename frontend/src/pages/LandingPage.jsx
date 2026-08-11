import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Droplets,
  FileText,
  Gauge,
  Minus,
  Plus,
  Quote,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CountUp from '../components/CountUp'
import BuildingsSkyline from '../components/BuildingsSkyline'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Reveal from '../components/Reveal'
import WaveDivider from '../components/WaveDivider'

const stats = [
  { value: 48, suffix: '+', label: 'Apartment communities' },
  { value: 30, suffix: '%', label: 'Average waste reduction' },
  { value: 2600, suffix: '+', label: 'Households billed monthly' },
]

const features = [
  {
    icon: BarChart3,
    title: 'Usage tracking',
    body: 'See daily and monthly water consumption for every household in one place.',
    color: 'from-sky-500 to-sky-600',
  },
  {
    icon: FileText,
    title: 'Fair billing',
    body: 'Costs are split by actual metered usage, with shared areas divided by flat size.',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: Bell,
    title: 'Overuse alerts',
    body: 'Residents and admins are notified early when usage crosses a set threshold.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: ShieldCheck,
    title: 'Leak detection',
    body: 'Unusual spikes are flagged automatically so leaks get caught sooner.',
    color: 'from-cyan-500 to-sky-600',
  },
  {
    icon: Users,
    title: 'Resident and admin views',
    body: 'Residents track their own usage, admins manage the whole apartment.',
    color: 'from-indigo-500 to-sky-600',
  },
  {
    icon: Droplets,
    title: 'Bulk purchase tracking',
    body: 'Record tanker and municipal water purchases and see cost per cycle.',
    color: 'from-teal-500 to-cyan-600',
  },
]

const steps = [
  {
    step: '01',
    title: 'Log usage',
    body: 'Meter readings are entered manually or uploaded in bulk as a CSV file.',
    icon: Gauge,
  },
  {
    step: '02',
    title: 'Costs are calculated',
    body: 'A tiered tariff is applied and shared costs are split across households.',
    icon: FileText,
  },
  {
    step: '03',
    title: 'Everyone stays informed',
    body: 'Residents get a clear bill, admins get a full view of the apartment.',
    icon: Bell,
  },
]

const testimonials = [
  {
    quote:
      'Our water bill disputes disappeared once residents could see their own usage. It paid for itself in the first month.',
    name: 'Apartment administrator',
    place: 'Demo Heights',
    initials: 'DH',
    color: 'from-sky-500 to-teal-500',
  },
  {
    quote:
      'The leak alert caught a running toilet in Flat 12C before it added a single extra bill cycle of cost.',
    name: 'Facility manager',
    place: 'Riverside Residency',
    initials: 'RR',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    quote:
      'Splitting the borewell and tanker costs used to be a spreadsheet fight every month. Now it just happens.',
    name: 'Resident welfare secretary',
    place: 'Palm Court Society',
    initials: 'PC',
    color: 'from-amber-500 to-orange-500',
  },
]

const pricingPreview = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    tagline: 'For a single building trying it out',
    features: ['Up to 20 households', 'Manual meter entry', 'Monthly bill export'],
    highlight: false,
  },
  {
    name: 'Community',
    price: '\u20b92,499',
    period: '/month',
    tagline: 'For most apartment communities',
    features: [
      'Unlimited households',
      'CSV bulk upload',
      'Leak & overuse alerts',
      'Resident + admin logins',
    ],
    highlight: true,
  },
  {
    name: 'Township',
    price: 'Custom',
    period: '',
    tagline: 'For multi-block townships',
    features: ['Multiple properties', 'Role-based access', 'Priority support'],
    highlight: false,
  },
]

const faqs = [
  {
    q: 'How is each household\u2019s bill calculated?',
    a: 'Metered usage is multiplied against your tiered tariff, and shared costs like borewell power or tanker purchases are split either equally or by flat size, whichever your community picks during setup.',
  },
  {
    q: 'Do we need smart meters?',
    a: 'No. Readings can be entered manually by an admin, uploaded in bulk as a CSV, or pushed automatically if your building already has smart meters.',
  },
  {
    q: 'How do leak alerts work?',
    a: 'Every household has a rolling usage baseline. When a reading comes in well above that baseline, an alert goes out to the resident and the admin the same day.',
  },
  {
    q: 'Can residents see only their own data?',
    a: 'Yes. Residents get a login scoped to their own flat\u2019s usage and bills. Admins get the full-apartment view across every household.',
  },
]

function UsagePreviewCard() {
  const usageBars = [38, 52, 41, 60, 47, 55, 34]
  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl shadow-sky-900/10 backdrop-blur">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">This week</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">182 kL used</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
            <Droplets size={18} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-6 flex h-32 items-end gap-2">
          {usageBars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-sky-500 to-teal-400"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>Mon</span>
          <span>Sun</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-700">
            <Bell size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">Usage alert</p>
            <p className="text-xs text-slate-500">Flat 4B is 22% above average</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-white sm:text-base">{item.q}</span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-teal-300">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-slate-300">{item.a}</p>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-teal-50/60 to-white">
          <BuildingsSkyline className="absolute bottom-0 left-0 h-48 w-full opacity-70 blur-[3px] sm:h-64" />
          <div
            className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="animate-blob absolute -right-16 top-32 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl"
            style={{ animationDelay: '2s' }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-sky-700 backdrop-blur">
                  <Droplets size={12} aria-hidden="true" />
                  Built for apartment communities
                </span>
                <h1 className="font-display mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                  Water usage and billing,{' '}
                  <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
                    made simple
                  </span>
                </h1>
                <p className="mt-4 max-w-md text-base text-slate-500">
                  Track household consumption, split shared water costs fairly, and catch
                  leaks before they become a problem.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-teal-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-sky-600/20 transition-transform hover:scale-[1.03] hover:shadow-lg hover:shadow-sky-600/30"
                  >
                    Get started
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="rounded-lg border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 backdrop-blur transition-colors hover:border-sky-400 hover:text-sky-700"
                  >
                    Sign in
                  </button>
                </div>

                <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-8">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <dt className="font-display bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
                        <CountUp to={s.value} suffix={s.suffix} />
                      </dt>
                      <dd className="mt-1 text-xs text-slate-500">{s.label}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>

              <Reveal delay={150} className="animate-float-y">
                <UsagePreviewCard />
              </Reveal>
            </div>
          </div>

          <WaveDivider variant="skyToWhite" />
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-gradient-to-b from-white to-teal-50/50">
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-4">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Everything an apartment needs
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                One system for water tracking, billing, and alerts across every household.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 80}>
                  <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-sky-900/5">
                    <span
                      className="card-ripple-el pointer-events-none absolute left-10 top-10 h-10 w-10 rounded-full bg-sky-200/60"
                      aria-hidden="true"
                    />
                    <span
                      className={`relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${f.color} text-white shadow-sm`}
                    >
                      <f.icon size={20} aria-hidden="true" />
                    </span>
                    <p className="relative mt-4 text-sm font-medium text-slate-900">
                      {f.title}
                    </p>
                    <p className="relative mt-1.5 text-sm text-slate-500">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <WaveDivider variant="tealToWhite" />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              From a meter reading to a finished bill, in three steps.
            </p>
          </Reveal>

          <div className="relative mt-12 grid gap-10 sm:grid-cols-3">
            <div
              className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-sky-300 via-teal-300 to-sky-300 sm:block"
              aria-hidden="true"
            />
            {steps.map((s, i) => (
              <Reveal key={s.step} delay={i * 120} className="relative">
                <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sky-600 to-teal-500 text-sm font-semibold text-white shadow-md shadow-sky-600/20">
                  {s.step}
                </span>
                <p className="mt-4 flex items-center gap-2 text-base font-medium text-slate-900">
                  <s.icon size={16} className="text-teal-600" aria-hidden="true" />
                  {s.title}
                </p>
                <p className="mt-1.5 text-sm text-slate-500">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* DEEP DIVE / FAQ - dark "under the surface" section */}
        <div className="relative">
          <WaveDivider variant="whiteToNavy" />
          <section className="relative overflow-hidden bg-slate-900">
            <div
              className="animate-blob absolute left-1/3 top-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="animate-blob absolute right-0 bottom-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"
              style={{ animationDelay: '3s' }}
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-4xl px-5 py-16">
              <Reveal>
                <span className="text-xs font-medium uppercase tracking-wider text-teal-300">
                  Common questions
                </span>
                <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Answers before you dive in
                </h2>
              </Reveal>

              <div className="mt-8 flex flex-col gap-3">
                {faqs.map((item, i) => (
                  <Reveal key={item.q} delay={i * 80}>
                    <FaqItem
                      item={item}
                      open={openFaq === i}
                      onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
          <WaveDivider variant="navyToWhite" />
        </div>

        {/* TESTIMONIALS */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Communities already on board
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6">
                  <Quote size={20} className="text-sky-300" aria-hidden="true" />
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                    {t.quote}
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${t.color} text-xs font-semibold text-white`}
                    >
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.place}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PRICING PREVIEW */}
        <section
          id="pricing"
          className="border-t border-slate-200 bg-gradient-to-b from-sky-50/60 to-white"
        >
          <div className="mx-auto max-w-6xl px-5 py-16">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Simple pricing for any size community
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Start free, upgrade when your community grows.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {pricingPreview.map((tier, i) => (
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
                    <p
                      className={`text-sm font-medium ${
                        tier.highlight ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {tier.name}
                    </p>
                    <p className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-semibold">
                        {tier.price}
                      </span>
                      <span className={tier.highlight ? 'text-sky-100' : 'text-slate-500'}>
                        {tier.period}
                      </span>
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        tier.highlight ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {tier.tagline}
                    </p>
                    <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2
                            size={16}
                            className={
                              tier.highlight ? 'mt-0.5 text-teal-200' : 'mt-0.5 text-teal-600'
                            }
                            aria-hidden="true"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
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

            <Reveal delay={200}>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="mx-auto mt-8 flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-800"
              >
                Compare full plan details
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Reveal>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-500 to-teal-500">
          <div
            className="animate-gradient-x absolute inset-0 bg-gradient-to-br from-sky-600 via-teal-500 to-sky-600 opacity-80"
            aria-hidden="true"
          />
          <BuildingsSkyline className="absolute bottom-0 left-0 h-40 w-full opacity-25 blur-[2px]" />
          <svg
            className="absolute bottom-0 left-0 h-24 w-full opacity-40"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,100 C240,180 480,20 720,100 C960,180 1200,20 1440,90 L1440,200 L0,200 Z"
              className="fill-white/20"
            />
          </svg>
          <div className="relative mx-auto max-w-6xl px-5 py-16 text-center">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Ready to get started
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-sky-50">
                Create an account for your apartment and start tracking usage today.
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
