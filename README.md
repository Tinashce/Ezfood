# EzFood

Crowdsourced meals under R200 in Johannesburg and Cape Town. Phase 1 MVP: read-and-discover.

- `supabase/` – PostGIS schema, RLS, `nearby_meals` radius RPC, "still valid" verification trigger, placeholder seed.
- `web/` – Vite + React + TypeScript PWA: price-bucket filter (R50/R100/R150/R200), feed and map (MapLibre + OSM), submit form, 1-tap confirm.

## Run

```
cd web && npm install && npm run dev
```

Without env vars the app runs in demo mode with sample data. For a live backend, copy `web/.env.example` to `web/.env`, fill in Supabase keys, and apply `supabase/migrations/0001_init.sql`.

Prices are capped below R200 in the database (`check`), the RPC and the form.

## Not yet built

Photo upload, auth UI beyond the `signIn` helper, auto-flag moderation queue UI, WhatsApp share cards, vendor claiming, payments (see roadmap phases 2–3).
