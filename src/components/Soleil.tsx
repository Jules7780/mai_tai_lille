// Soleil stylisé inspiré de l'enseigne néon du bar (interprétation, pas le fichier officiel).

const NB_RAYONS = 22
const C = 50

const r2 = (n: number) => Math.round(n * 100) / 100

function rayon(i: number) {
  const angle = (i / NB_RAYONS) * Math.PI * 2 - Math.PI / 2
  const long = i % 2 === 0
  const debut = 25
  const fin = long ? 47 : 39
  const ondulation = long ? 3.6 : 2.6
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const point = (r: number, decalage: number) =>
    `${r2(C + ux * r - uy * decalage)} ${r2(C + uy * r + ux * decalage)}`
  const d = fin - debut
  return `M${point(debut, 0)} C${point(debut + d / 3, ondulation)} ${point(debut + (2 * d) / 3, -ondulation)} ${point(fin, 0)}`
}

const RAYONS = Array.from({ length: NB_RAYONS }, (_, i) => rayon(i))

type Props = { className?: string; visage?: boolean }

export default function Soleil({ className, visage = true }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {RAYONS.map((d) => (
        <path key={d} d={d} />
      ))}
      <circle cx="50" cy="50" r="18.5" />
      {visage && (
        <g strokeWidth="2">
          <path d="M40.5 46.2 Q44 43.4 47.4 46.2 Q44 48.6 40.5 46.2 Z" />
          <path d="M52.6 46.2 Q56 43.4 59.5 46.2 Q56 48.6 52.6 46.2 Z" />
          <path d="M50 46.5 L48.4 53.6 Q50 54.8 51.8 53.6" />
          <path d="M44.6 58 Q50 61.4 55.4 58" />
        </g>
      )}
    </svg>
  )
}
