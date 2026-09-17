import Soleil from './Soleil'

type Props = { className?: string }

export default function Logo({ className = '' }: Props) {
  return (
    <span className={`logo ${className}`}>
      <Soleil className="logo__soleil" />
      <span className="logo__texte">
        <span className="logo__nom">Maï-Taï</span>
        <span className="logo__sous-titre">Bar thaï</span>
      </span>
    </span>
  )
}
