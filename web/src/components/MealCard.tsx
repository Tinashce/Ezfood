import type { Meal, Verdict } from '../types'

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export function MealCard({ meal, onVerify }: { meal: Meal; onVerify: (id: string, v: Verdict) => void }) {
  const walkMin = Math.max(1, Math.round(meal.distance_m / 80)) // ~5 km/h
  return (
    <li className="card">
      <div className="price">R{meal.price_zar}</div>
      <div className="info">
        <strong>{meal.title}</strong>
        <span>{meal.spot_name} · {meal.neighborhood}</span>
        <span className="muted">
          {(meal.distance_m / 1000).toFixed(1)} km · {walkMin} min walk · confirmed {ago(meal.last_confirmed_at)}
        </span>
      </div>
      <div className="actions">
        <button onClick={() => onVerify(meal.id, 'still_available')}>Still valid</button>
        <button className="ghost" onClick={() => onVerify(meal.id, 'price_increased')}>Price changed</button>
        <button className="ghost" onClick={() => onVerify(meal.id, 'closed')}>Closed</button>
      </div>
    </li>
  )
}
