const VARIANTS = {
  skyToWhite: ['fill-sky-100', 'fill-white'],
  whiteToSky: ['fill-white', 'fill-sky-50'],
  skyToTeal: ['fill-sky-500', 'fill-teal-600'],
  tealToWhite: ['fill-teal-50', 'fill-white'],
  navyToWhite: ['fill-slate-900', 'fill-white'],
  whiteToNavy: ['fill-white', 'fill-slate-900'],
}

export default function WaveDivider({ variant = 'skyToWhite', flip = false }) {
  const [back, front] = VARIANTS[variant] ?? VARIANTS.skyToWhite

  return (
    <div
      className={`pointer-events-none -mb-1 w-full overflow-hidden leading-[0] ${
        flip ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className="h-16 w-full sm:h-24"
      >
        <path
          d="M0,50 C240,110 480,10 720,50 C960,90 1200,10 1440,55 L1440,110 L0,110 Z"
          className={back}
          opacity="0.6"
        />
        <path
          d="M0,70 C240,20 480,100 720,65 C960,30 1200,100 1440,70 L1440,110 L0,110 Z"
          className={front}
        />
      </svg>
    </div>
  )
}
