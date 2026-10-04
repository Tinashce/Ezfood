import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { Meal } from '../types'

export function MapView({ meals, center }: { meals: Meal[]; center: [number, number] }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map>()
  const markers = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    map.current = new maplibregl.Map({
      container: el.current!,
      center, zoom: 13,
      style: {
        version: 8,
        sources: { osm: { type: 'raster', tileSize: 256, tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], attribution: '© OpenStreetMap contributors' } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
    })
    return () => map.current?.remove()
  }, [])

  useEffect(() => { map.current?.setCenter(center) }, [center[0], center[1]])

  useEffect(() => {
    markers.current.forEach((m) => m.remove())
    markers.current = meals.map((m) =>
      new maplibregl.Marker({ color: '#e8590c' })
        .setLngLat([m.lng, m.lat])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setText(`R${m.price_zar} – ${m.title} @ ${m.spot_name}`))
        .addTo(map.current!))
  }, [meals])

  return <div ref={el} className="map" />
}
