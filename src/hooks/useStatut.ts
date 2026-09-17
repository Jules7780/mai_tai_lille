import { useEffect, useState } from 'react'
import { statutActuel } from '../utils/horaires'

export function useStatut() {
  const [statut, setStatut] = useState(() => statutActuel())

  useEffect(() => {
    const id = window.setInterval(() => setStatut(statutActuel()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return statut
}
