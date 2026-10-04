export const MAX_PRICE_ZAR = 199.99
export const PRICE_BUCKETS = [50, 100, 150, 200] as const

export interface Meal {
  id: string
  title: string
  price_zar: number
  spot_name: string
  neighborhood: string
  city: string
  lat: number
  lng: number
  distance_m: number
  last_confirmed_at: string
}

export interface NewMeal {
  title: string
  price_zar: number
  spot_name: string
  neighborhood: string
  city: 'Johannesburg' | 'Cape Town'
  lat: number
  lng: number
}

export type Verdict = 'still_available' | 'price_increased' | 'closed'
