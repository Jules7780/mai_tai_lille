import { FORMES, type FormeFeuille } from '../data/feuilles'

type Props = { forme: FormeFeuille; className?: string }

export default function Feuille({ forme, className = '' }: Props) {
  const { viewBox, limbe, nervures } = FORMES[forme]
  return (
    <svg className={`feuille ${className}`} viewBox={viewBox} aria-hidden="true" focusable="false">
      <path className="feuille__limbe" d={limbe} fillRule="evenodd" />
      <path className="feuille__nervures" d={nervures} />
    </svg>
  )
}
