## Objetivo

Usar las portadas oficiales de BoardGameGeek (BGG) en las tarjetas del Selector de Juegos, en vez de las imágenes generadas localmente, y dar crédito a BGG al final de la app.

## Enfoque

BGG sirve las imágenes de caja desde su CDN público (`cf.geekdo-images.com`). Podemos hacer hotlink directo desde `<img src>` siempre que mostremos atribución visible. No se requiere proxy ni servidor intermedio.

## Cambios

### 1. Tipo `GameModule` (`src/games/types.ts`)

Agregar dos campos opcionales:

- `bggId?: number` — id del juego en BGG (para enlace de crédito por juego).
- `bggImage?: string` — URL absoluta de la portada (CDN de BGG, ej. `https://cf.geekdo-images.com/...__original/img/....jpg`).

Mantener `cover?: string` como fallback por si algún juego no tiene aún su imagen BGG.

### 2. Datos por juego (`skull-king.ts`, `fromage.ts`, `pergola.ts`)

Asignar `bggId` y `bggImage` con las URLs reales tomadas de la ficha pública de cada juego en boardgamegeek.com:

- Skull King — BGG ID 150145
- Fromage — BGG ID 390092
- Pérgola — BGG ID 369861

Las URLs exactas del CDN se resuelven al implementar (visitando la ficha BGG y copiando la URL de la imagen principal de caja). Se eliminan los imports de `@/assets/cover-*.jpg` y los archivos generados en `src/assets/cover-*.jpg`.

### 3. Render en `src/routes/index.tsx`

- Usar `g.bggImage ?? g.cover` como `src` de las portadas (tarjeta y bloque "Última partida"). Mantener `aspect-square object-cover rounded-lg shadow-sm`.
- Añadir `referrerPolicy="no-referrer"` al `<img>` (recomendado al hotlinkear desde CDN de terceros).
- Mantener `loading="lazy"`, `width`, `height` y `alt`.

### 4. Crédito a BGG (footer global)

Agregar un footer discreto en `src/routes/__root.tsx` (visible en todas las páginas) con un único texto centrado:

> "Portadas e información de juegos cortesía de **BoardGameGeek**" — enlace a `https://boardgamegeek.com` con `target="_blank"` y `rel="noopener noreferrer"`.

Estilo: `text-xs text-slate-400 text-center py-4`, dentro de un `<footer>` semántico debajo del `<Outlet />`.

### 5. Convención para juegos futuros

Cuando se añada un juego nuevo, basta con:

1. Buscarlo en boardgamegeek.com.
2. Copiar la URL de la portada y el BGG ID.
3. Setear `bggImage` y `bggId` en el módulo del juego.

No requiere tocar Supabase ni la lógica del frontend.

## Fuera de alcance

- No se integra la API XML de BGG (no es necesario para mostrar portadas estáticas).
- No se cachean las imágenes en nuestro propio storage (hotlink directo del CDN BGG).
- No se modifica la lógica de puntuación ni la base de datos.

## Archivos a modificar

- `src/games/types.ts`
- `src/games/skull-king.ts`, `src/games/fromage.ts`, `src/games/pergola.ts`
- `src/routes/index.tsx`
- `src/routes/__root.tsx`
- Eliminar `src/assets/cover-skull-king.jpg`, `src/assets/cover-fromage.jpg`, `src/assets/cover-pergola.jpg`
