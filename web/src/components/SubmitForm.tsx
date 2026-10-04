import { useState } from 'react'
import { submitMeal } from '../api'
import { MAX_PRICE_ZAR } from '../types'

export function SubmitForm({ at, onDone }: { at: [number, number]; onDone: () => void }) {
  const [err, setErr] = useState('')
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try {
      await submitMeal({
        title: String(f.get('title')), price_zar: Number(f.get('price')),
        spot_name: String(f.get('spot')), neighborhood: String(f.get('hood')),
        city: f.get('city') as 'Johannesburg' | 'Cape Town', lng: at[0], lat: at[1],
      })
      onDone()
    } catch (x) { setErr((x as Error).message) }
  }
  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>Add a meal under R200</h2>
      <input name="title" placeholder="Meal (e.g. Double Cheese Kota)" required />
      <input name="price" type="number" step="0.01" min="1" max={MAX_PRICE_ZAR} placeholder="Price in ZAR" required />
      <input name="spot" placeholder="Restaurant / vendor name" required />
      <input name="hood" placeholder="Neighbourhood" required />
      <select name="city"><option>Johannesburg</option><option>Cape Town</option></select>
      <p className="muted">Pin is placed at your current map location.</p>
      {err && <p className="error">{err}</p>}
      <button type="submit">Submit</button>
      <button type="button" className="ghost" onClick={onDone}>Cancel</button>
    </form>
  )
}
