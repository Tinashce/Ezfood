import { createClient } from '@supabase/supabase-js'
import { MAX_PRICE_ZAR, type Meal, type NewMeal, type Verdict } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const supabase = url && key ? createClient(url, key) : null

export const isDemo = !supabase

// Demo data so the app runs before a backend exists. Placeholder listings only.
let demoMeals: Omit<Meal, 'distance_m'>[] = [
  { id: 'd1', title: 'Double Cheese Kota', price_zar: 45, spot_name: 'Braam Kota Corner', neighborhood: 'Braamfontein', city: 'Johannesburg', lat: -26.193, lng: 28.033, last_confirmed_at: new Date().toISOString() },
  { id: 'd2', title: 'Chicken Pie + Drink', price_zar: 38, spot_name: 'Obs Pie Stop', neighborhood: 'Observatory', city: 'Cape Town', lat: -33.9395, lng: 18.4733, last_confirmed_at: new Date().toISOString() },
  { id: 'd3', title: 'Braai Plate', price_zar: 95, spot_name: 'Melville Grill', neighborhood: 'Melville', city: 'Johannesburg', lat: -26.1766, lng: 28.0058, last_confirmed_at: new Date().toISOString() },
]

export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(a))
}

export async function fetchMeals(lat: number, lng: number, maxPrice: number, radiusM = 5000): Promise<Meal[]> {
  const cap = Math.min(maxPrice, MAX_PRICE_ZAR)
  if (!supabase) {
    return demoMeals
      .map((m) => ({ ...m, distance_m: distanceM(lat, lng, m.lat, m.lng) }))
      .filter((m) => m.price_zar <= cap && m.distance_m <= radiusM)
      .sort((a, b) => a.distance_m - b.distance_m)
  }
  const { data, error } = await supabase.rpc('nearby_meals', {
    user_lat: lat, user_lng: lng, radius_m: radiusM, max_price: cap,
  })
  if (error) throw error
  return (data as any[]).map((r) => ({ ...r, id: r.meal_id }))
}

export async function verifyMeal(mealId: string, status: Verdict) {
  if (!supabase) {
    if (status === 'still_available') {
      demoMeals = demoMeals.map((m) => (m.id === mealId ? { ...m, last_confirmed_at: new Date().toISOString() } : m))
    }
    return
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to confirm deals')
  const { error } = await supabase.from('deal_verifications').insert({ meal_id: mealId, user_id: user.id, status })
  if (error) throw error
}

export async function submitMeal(m: NewMeal) {
  if (m.price_zar <= 0 || m.price_zar > MAX_PRICE_ZAR) throw new Error('Price must be under R200')
  if (!supabase) {
    demoMeals = [{ ...m, id: crypto.randomUUID(), last_confirmed_at: new Date().toISOString() }, ...demoMeals]
    return
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to add a deal')
  const { data: spot, error: e1 } = await supabase.from('spots').insert({
    name: m.spot_name, neighborhood: m.neighborhood, city: m.city, created_by: user.id,
    coordinates: `SRID=4326;POINT(${m.lng} ${m.lat})`,
  }).select('id').single()
  if (e1) throw e1
  const { error: e2 } = await supabase.from('meals').insert({
    spot_id: spot.id, title: m.title, price_zar: m.price_zar, created_by: user.id,
  })
  if (e2) throw e2
}

export async function signIn(email: string) {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw error
}
