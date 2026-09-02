# ARCHITECTURE.md — Arquitectura del Proyecto

> Referencia técnica de cómo está construido **PocketMeeple**: stack tecnológico, estructura de carpetas, flujo de datos y sistema de puntajes.

---

## Stack Tecnológico

| Capa                | Tecnología                          | Versión aproximada |
| ------------------- | ----------------------------------- | ------------------ |
| UI Framework        | React                               | 19                 |
| Routing / SSR       | TanStack Start + TanStack Router    | 1.x                |
| Build tool          | Vite                                | 7                  |
| Estilos             | Tailwind CSS                        | 4                  |
| Primitivos UI       | Radix UI + shadcn/ui                | —                  |
| Íconos              | Lucide React                        | 0.575+             |
| Base de datos       | Supabase (PostgreSQL)               | 2.x JS client      |
| Servidor/Edge       | Cloudflare Pages + Workers (Nitro)  | —                  |
| Móvil nativo        | Capacitor                           | 8                  |
| Plataformas nativas | Android (`/android`) · iOS (`/ios`) | —                  |
| Package manager     | Bun (lockfile) / npm (scripts)      | —                  |

---

## Estructura de Carpetas

```
PocketMeeple/
├── capacitor.config.ts       # Configuración de Capacitor (appId, webDir, plugins)
├── vite.config.ts            # Bundler y plugins (TanStack, Tailwind, Cloudflare)
├── package.json              # Scripts y dependencias
├── supabase/
│   ├── config.toml           # Configuración del proyecto Supabase
│   └── migrations/           # Migraciones SQL (nunca editar las ya aplicadas)
├── android/                  # Proyecto Android generado por Capacitor
├── ios/                      # Proyecto iOS generado por Capacitor
├── public/                   # Assets estáticos
├── scripts/
│   └── generate-mobile-html.mjs  # Post-build: genera index.html para Capacitor
└── src/
    ├── games/                # Núcleo de la lógica de juego
    ├── components/           # Componentes React reutilizables
    ├── routes/               # Páginas (file-based routing de TanStack)
    ├── hooks/                # Custom hooks de React
    ├── lib/                  # Server functions, helpers, Supabase client
    ├── integrations/
    │   └── supabase/         # Inicialización del cliente Supabase
    ├── styles.css            # Variables CSS globales y utilidades de Tailwind
    └── router.tsx            # Configuración del router
```

---

## `src/games/` — Catálogo de Juegos

Cada juego es un **módulo TypeScript autocontenido** que exporta un objeto `GameModule`. No hay lógica de juego dispersa en la UI.

### Archivos clave

| Archivo       | Propósito                                                                               |
| ------------- | --------------------------------------------------------------------------------------- |
| `types.ts`    | Tipos base (`GameModule`, `GameState`, `RoundEntry`, etc.) y funciones utilitarias      |
| `registry.ts` | Arreglo `GAMES` con todos los módulos; función `getGame(id)`                            |
| `theme.ts`    | Mapa de temas visuales por juego (`pirate`, `garden`, `cheese`, `racing`, `pocketmeeple`) |
| `<nombre>.ts` | Un archivo por juego con su definición y lógica de puntaje                              |

### Juegos registrados

| ID           | Nombre                   | Tipo         | Jugadores |
| ------------ | ------------------------ | ------------ | --------- |
| `skull-king` | Skull King               | `rounds`     | 2–10      |
| `fromage`    | Fromage                  | `categories` | 2–5       |
| `pergola`    | Pérgola                  | `categories` | 2–4       |
| `heat`       | Heat: Pedal to the Metal | `heat`       | 1–6       |
| `the-gang`   | The Gang                 | `coop`       | 3–6       |
| `cubitos`    | Cubitos                  | `categories` | 2–4       |
| `saboteur`   | Saboteur                 | `categories` | 3–10      |
| `isla-gatos` | La Isla de los Gatos     | `categories` | 1–4       |
| `luthier`    | Luthier                  | `categories` | 2–4       |

### Tipos de tablero (`kind`)

```
"rounds"      → Scoreboard.tsx       Rondas con bid/tricks y calcRoundScore()
"categories"  → CategoryBoard.tsx    Recuento final con categorías y calcTotal()
"heat"        → HeatBoard.tsx        Posiciones por carrera y puntos acumulados
"coop"        → CoopBoard.tsx        Partida cooperativa (ganó/perdió el equipo)
```

---

## Cálculo de Puntajes

### Juegos de rondas (`"rounds"`) — Skull King

Cada ronda produce un `RoundEntry = { bid, tricks, bonus }`.
La función `calcRoundScore(entry, roundNumber)` del módulo devuelve los puntos de esa ronda:

```
bid === tricks && bid === 0  →  roundNumber * 10 + bonus
bid === tricks && bid > 0   →  tricks * 20 + bonus
bid !== tricks && bid === 0 →  -(roundNumber * 10) + bonus
bid !== tricks && bid > 0   →  -(|bid - tricks| * 10) + bonus
```

Los totales acumulados se calculan con `cumulativeTotals(state, game)` en `types.ts`.

### Juegos de categorías (`"categories"`) — Fromage, Pérgola, Cubitos, Saboteur, Isla de los Gatos, Luthier

Cada jugador tiene un `CategoryValues` (mapa `id → number`).
`calcTotal(values)` suma todas las categorías aplicando ponderaciones específicas del juego.

Ejemplo Cubitos: `pista * 10 + monedas + bonus`

Ejemplo La Isla de los Gatos: `familias + lecciones + tesoros + (ratas * -5) + bonus`

### Juego de carreras (`"heat"`) — Heat: Pedal to the Metal

Tabla de puntos por posición:

| Posición | Puntos |
| -------- | ------ |
| 1°       | 9      |
| 2°       | 6      |
| 3°       | 4      |
| 4°       | 3      |
| 5°       | 2      |
| 6°       | 1      |

`heatPlayerTotal(data)` suma los puntos de todas las carreras (hasta 4 por defecto) más bonos de cada ronda.

### Juegos cooperativos (`"coop"`) — The Gang

No hay puntaje individual. El equipo registra si ganó o perdió (`coop.won`). Opcionalmente, un `teamScore` puede registrarse para comparaciones futuras. Los juegos cooperativos **no afectan el ranking individual**.

---

## Rutas (Pages)

| Ruta            | Archivo            | Descripción                               |
| --------------- | ------------------ | ----------------------------------------- |
| `/`             | `index.tsx`        | Selector de juegos                        |
| `/play/$gameId` | `play.$gameId.tsx` | Partida activa (setup → tablero → pódium) |
| `/history`      | `history.tsx`      | Historial de partidas guardadas           |
| `/rankings`     | `rankings.tsx`     | Rankings de jugadores por juego           |
| `/players`      | `players.tsx`      | Gestión de jugadores favoritos            |

---

## Persistencia y Supabase

### Tabla `matches`

```sql
matches (
  id           uuid PRIMARY KEY,
  game_id      text,
  played_at    timestamptz,
  players      jsonb,     -- array de nombres
  final_scores jsonb,     -- array de puntajes finales (mismo orden que players)
  winner       text,
  rounds       jsonb      -- estado completo del juego serializado
)
```

### Vista `player_rankings`

Calculada en Supabase a partir de `matches`: agrupa por `player_name + game_id` y expone `games_played`, `games_won`, `win_rate`, `max_score`.

### Seguridad

- Row Level Security (RLS) habilitada en `matches`.
- Políticas actuales: **lectura pública** + **inserción abierta** (sin autenticación requerida).
- Diseñado para uso en grupo local; si se expone en internet debe añadirse autenticación por usuario.

### Sesiones pausadas

Las partidas en curso se guardan en `localStorage` via `src/lib/sessions.ts`. Al entrar a `/play/$gameId` se ofrece retomar sesiones previas antes de iniciar una nueva.

---

## Build y Despliegue

```bash
# Desarrollo web
npm run dev

# Build para web (Cloudflare Pages)
npm run build

# Build + sync para móvil nativo
npm run cap:sync
```

El comando `cap:sync`:

1. Ejecuta `vite build` → genera `dist/client/`
2. Ejecuta `scripts/generate-mobile-html.mjs` → adapta el HTML para Capacitor
3. Ejecuta `npx cap sync` → copia el bundle a `android/` e `ios/`

### Capacitor (`capacitor.config.ts`)

```
appId:   com.pocketmeeple.app
appName: PocketMeeple
webDir:  dist/client
```

La app nativa carga el bundle local (sin servidor remoto por defecto). Para apuntar a un servidor externo, descomentar y configurar `server.url`.
