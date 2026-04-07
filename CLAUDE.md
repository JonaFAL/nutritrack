# NutriTrack

App de tracking nutricional con IA para uso personal (single user, sin auth).

## Stack
- Next.js 15+ (App Router), TypeScript, Tailwind CSS v4
- SQLite con better-sqlite3 (archivo local, WAL mode)
- Qwen 3.6 Plus vía OpenRouter (free tier, formato OpenAI-compatible) para análisis nutricional
- PWA mobile-first, dark theme

## Comandos
- `npm run dev` — desarrollo local (port 3000)
- `npm run build` — build de producción
- `npm run start` — servidor de producción

## Estructura
- `/app/api/ai/*` — endpoints que llaman a OpenRouter (Qwen) (analyze, exercise, recipe)
- `/app/api/meals/*` — CRUD comidas
- `/app/api/exercises/*` — CRUD ejercicios
- `/app/api/days/*` — resumen por día e historial
- `/app/api/profile/*` — configuración del perfil
- `/lib/db.ts` — conexión SQLite + schema auto-migración
- `/lib/ai.ts` — system prompts y cliente OpenRouter (Qwen)
- `/lib/types.ts` — TypeScript types

## Reglas
- Cada llamada a la IA es independiente (no acumular historial de conversación)
- El contexto del día se inyecta en el system prompt desde la DB en cada llamada
- Todas las respuestas de IA deben ser JSON válido
- Mobile-first: diseñar para 480px max-width
- Fotos de comida se envían como base64 a la API de OpenRouter (Qwen)
- Self-hosted en notebook con Cloudflare Tunnel
- DB path: ./data/nutritrack.db

## Deploy
- Self-hosted en la notebook (como el expense tracker)
- Cloudflare Tunnel para acceso remoto
- Puerto: 3000 (default Next.js)

## Next.js 15+ Breaking Changes
- `params`, `searchParams`, `cookies()`, `headers()` son async — siempre usar await
- Route handlers usan `RouteContext` con params async
