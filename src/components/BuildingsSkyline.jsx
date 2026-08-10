const BUILDINGS = [
  { x: 0, w: 90, h: 160, windows: true },
  { x: 95, w: 60, h: 220, windows: true },
  { x: 160, w: 100, h: 130, windows: false },
  { x: 265, w: 70, h: 260, windows: true },
  { x: 340, w: 85, h: 190, windows: true },
  { x: 430, w: 55, h: 240, windows: false },
  { x: 490, w: 95, h: 150, windows: true },
  { x: 590, w: 70, h: 210, windows: true },
  { x: 665, w: 60, h: 170, windows: false },
  { x: 730, w: 100, h: 250, windows: true },
  { x: 835, w: 80, h: 180, windows: true },
  { x: 920, w: 65, h: 230, windows: false },
  { x: 990, w: 90, h: 150, windows: true },
  { x: 1085, w: 75, h: 210, windows: true },
  { x: 1165, w: 60, h: 170, windows: false },
  { x: 1230, w: 100, h: 240, windows: true },
  { x: 1335, w: 70, h: 160, windows: true },
  { x: 1410, w: 30, h: 200, windows: false },
]

function windowRows(b) {
  const rows = Math.max(2, Math.floor((b.h - 30) / 26))
  const cols = Math.max(2, Math.floor((b.w - 16) / 20))
  const rects = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={b.x + 10 + c * 20}
          y={400 - b.h + 16 + r * 26}
          width="9"
          height="12"
          className="fill-white/25"
        />
      )
    }
  }
  return rects
}

export default function BuildingsSkyline({ className = '' }) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {BUILDINGS.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={400 - b.h}
            width={b.w}
            height={b.h}
            className={i % 2 === 0 ? 'fill-sky-700/40' : 'fill-teal-700/35'}
          />
          {b.windows && windowRows(b)}
        </g>
      ))}
    </svg>
  )
}
