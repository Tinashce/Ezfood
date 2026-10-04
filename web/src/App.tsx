import { useCallback, useEffect, useState } from 'react'
import { fetchMeals, isDemo, verifyMeal } from './api'
import { MapView } from './components/MapView'
import { MealCard } from './components/MealCard'
import { SubmitForm } from './components/SubmitForm'
import { PRICE_BUCKETS, type Meal, type Verdict } from './types'

// Default: Braamfontein, Johannesburg. Replaced by device location when allowed.
const DEFAULT_CENTER: [number, number] = [28.033, -26.193]

export function App() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [maxPrice, setMaxPrice] = useState<number>(100)
  const [view, setView] = useState<'feed' | 'map'>('feed')
  const [adding, setAdding] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setCenter([p.coords.longitude, p.coords.latitude]))
  }, [])

  const load = useCallback(() => {
    fetchMeals(center[1], center[0], maxPrice).then(setMeals).catch((e) => setError(e.message))
  }, [center, maxPrice])
  useEffect(load, [load])

  async function onVerify(id: string, v: Verdict) {
    try { await verifyMeal(id, v); load() } catch (e) { setError((e as Error).message) }
  }

  return (
    <main>
      <header>
        <h1>EzFood <small>meals under R200</small></h1>
        {isDemo && <p className="muted">Demo mode – sample data. Set VITE_SUPABASE_URL to go live.</p>}
        <div className="chips">
          {PRICE_BUCKETS.map((p) => (
            <button key={p} className={p === maxPrice ? 'on' : ''} onClick={() => setMaxPrice(p)}>
              Under R{p}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={view === 'feed' ? 'on' : ''} onClick={() => setView('feed')}>Feed</button>
          <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>Map</button>
          <button onClick={() => setAdding(true)}>+ Add meal</button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {adding ? (
        <SubmitForm at={center} onDone={() => { setAdding(false); load() }} />
      ) : view === 'map' ? (
        <MapView meals={meals} center={center} />
      ) : (
        <ul className="list">
          {meals.map((m) => <MealCard key={m.id} meal={m} onVerify={onVerify} />)}
          {meals.length === 0 && <li className="muted">No meals under R{maxPrice} nearby yet. Add one!</li>}
        </ul>
      )}
    </main>
  )
}
