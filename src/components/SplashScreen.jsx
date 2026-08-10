import { useMemo } from 'react'
import { Droplets } from 'lucide-react'

const TITLE = 'Smart water billing'

function useRainDrops(count = 14) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 6 + Math.random() * 6,
        duration: 3 + Math.random() * 2.4,
        delay: Math.random() * 4,
        drift: (Math.random() - 0.5) * 30,
      })),
    [count]
  )
}

export default function SplashScreen({ exiting }) {
  const rainDrops = useRainDrops()

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-sky-50 to-white ${
        exiting ? 'animate-splash-exit' : ''
      }`}
    >
      {/* background wave shapes */}
      <svg
        className="absolute bottom-0 left-0 h-1/2 w-full"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,160 C240,240 480,80 720,140 C960,200 1200,80 1440,150 L1440,400 L0,400 Z"
          className="fill-teal-100"
        />
        <path
          d="M0,220 C240,280 480,180 720,220 C960,260 1200,180 1440,230 L1440,400 L0,400 Z"
          className="fill-sky-200"
        />
      </svg>

      {/* ambient falling droplets */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {rainDrops.map((d) => (
          <span
            key={d.id}
            className="animate-rain-fall absolute top-[-40px]"
            style={{
              left: d.left,
              width: d.size,
              height: d.size * 1.35,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              '--drift': `${d.drift}px`,
            }}
          >
            <svg viewBox="0 0 24 24" className="h-full w-full fill-sky-400/70">
              <path d="M12 2C12 2 5 11.2 5 15.5C5 19.6 8.13 22 12 22C15.87 22 19 19.6 19 15.5C19 11.2 12 2 12 2Z" />
            </svg>
          </span>
        ))}
      </div>

      <div className="relative grid h-full place-items-center">
        <div className="flex flex-col items-center">
          {/* logo with expanding ripple rings */}
          <div className="relative flex h-40 w-40 items-center justify-center">
            <span className="animate-ripple-ring absolute h-32 w-32 rounded-full border-2 border-sky-400" />
            <span
              className="animate-ripple-ring absolute h-32 w-32 rounded-full border-2 border-sky-400"
              style={{ animationDelay: '1s' }}
            />
            <span
              className="animate-ripple-ring absolute h-32 w-32 rounded-full border-2 border-sky-400"
              style={{ animationDelay: '2s' }}
            />

            <span className="animate-bob relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-900/20">
              <Droplets size={48} aria-hidden="true" />
            </span>
          </div>

          {/* animated title, letter by letter */}
          <h1 className="mt-8 flex text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {[...TITLE].map((ch, i) => (
              <span
                key={i}
                className="animate-letter-rise inline-block"
                style={{ animationDelay: `${0.15 + i * 0.045}s` }}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </h1>

          {/* subtitle with pulsing dots */}
          <p
            className="animate-splash-in mt-2 flex items-center gap-2 text-sm text-slate-600"
            style={{ animationDelay: '1.3s' }}
          >
            <span className="flex gap-1">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-sky-600" />
              <span
                className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-sky-600"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-sky-600"
                style={{ animationDelay: '0.4s' }}
              />
            </span>
            Loading your account
          </p>

          {/* flowing wave-line divider */}
          <svg
            className="animate-splash-in mt-6 w-64"
            style={{ animationDelay: '1.5s' }}
            viewBox="0 0 260 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="animate-wave-flow fill-none stroke-sky-500"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 10"
              d="M0 10 Q 15 0, 30 10 T 60 10 T 90 10 T 120 10 T 150 10 T 180 10 T 210 10 T 240 10 T 260 10"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
