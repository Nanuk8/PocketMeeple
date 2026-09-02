# AGENTS.md — Roles del Equipo de Desarrollo

> Documento de referencia para cualquier agente o colaborador que trabaje en **PocketMeeple**.
> Cada rol tiene responsabilidades delimitadas y restricciones estrictas para mantener la coherencia del proyecto.

---

## 1. Tech Lead

**Responsabilidad principal:** Arquitectura global, decisiones tecnológicas y cohesión del proyecto.

### Reglas

- Es el único rol autorizado para modificar la configuración raíz del proyecto: `vite.config.ts`, `capacitor.config.ts`, `tsconfig.json`, `package.json` y `eslint.config.js`.
- Toda decisión que añada o elimine una dependencia npm requiere su aprobación.
- Define y documenta las convenciones de naming, estructura de carpetas y patrones de código.
- Revisa y aprueba cualquier cambio en `src/router.tsx` y `src/routeTree.gen.ts`.
- Es responsable de mantener este archivo `AGENTS.md` y los demás documentos en `docs/` actualizados.

### Limitaciones

- **No** implementa lógica de negocio ni tableros de juego directamente.
- **No** diseña componentes de UI sin coordinación con el UI Specialist.
- **No** realiza cambios en las migraciones de Supabase sin revisión del QA Auditor.

---

## 2. Game Engine

**Responsabilidad principal:** Lógica de juego, cálculo de puntajes y definición de módulos en `src/games/`.

### Reglas

- Cada juego nuevo **debe** tener su propio archivo en `src/games/<id-del-juego>.ts` que exporte un objeto `GameModule`.
- Cada `GameModule` **debe** definir como mínimo: `id`, `name`, `tagline`, `icon`, `minPlayers`, `maxPlayers` y `kind`.
- Para juegos de tipo `"rounds"`: implementar `calcRoundScore` y `totalRounds`.
- Para juegos de tipo `"categories"`: implementar el arreglo `categories` y la función `calcTotal`.
- Para juegos de tipo `"heat"`: implementar `totalRounds` (por defecto 4).
- Para juegos de tipo `"coop"`: definir `coop: true`.
- Todo juego nuevo **debe** registrarse en el arreglo `GAMES` dentro de `src/games/registry.ts`.
- Las funciones de puntaje **deben** ser puras (sin efectos secundarios) y estar ubicadas en el mismo archivo que el módulo.

### Limitaciones

- **No** modifica componentes de UI ni archivos en `src/components/`.
- **No** modifica rutas en `src/routes/`.
- **No** accede a Supabase directamente; la persistencia es responsabilidad del Mobile Integrator.
- **No** puede eliminar un juego existente sin aprobación del Tech Lead.

---

## 3. UI Specialist

**Responsabilidad principal:** Diseño e implementación de componentes React, temas visuales y experiencia de usuario.

### Reglas

- Todos los componentes reutilizables viven en `src/components/`. Los componentes primitivos (botones, inputs, etc.) van en `src/components/ui/`.
- Cada tablero de juego tiene su componente dedicado: `Scoreboard.tsx` (rondas), `CategoryBoard.tsx` (categorías), `HeatBoard.tsx` (Heat), `CoopBoard.tsx` (cooperativos).
- Los temas visuales se definen en `src/games/theme.ts` y se aplican mediante clases de Tailwind CSS v4.
- Todo componente nuevo **debe** ser mobile-first: diseñado primero para pantallas pequeñas (mínimo 375 px de ancho).
- Usa **Radix UI** + **shadcn/ui** para primitivos accesibles; evita implementar primitivos de accesibilidad desde cero.
- Los íconos provienen exclusivamente de **Lucide React**.

### Limitaciones

- **No** modifica la lógica de puntaje en `src/games/`.
- **No** realiza llamadas directas a Supabase desde componentes (solo a través de hooks y server functions).
- **No** altera la configuración de Tailwind, Vite ni Capacitor.
- **No** añade librerías de UI externas sin aprobación del Tech Lead.

---

## 4. Mobile Integrator

**Responsabilidad principal:** Integración con Capacitor (iOS/Android), Supabase y flujo offline/sync.

### Reglas

- Toda interacción con Supabase se realiza a través de `src/lib/` (server functions, hooks de React Query).
- Las **server functions** se ubican en archivos con extensión `.functions.ts` dentro de `src/lib/`.
- El cliente de Supabase **solo** se inicializa en `src/integrations/supabase/` y nunca se instancia fuera de ese directorio.
- Las sesiones pausadas (partidas en curso) se gestionan a través de `src/lib/sessions.ts` con almacenamiento en `localStorage`.
- Cualquier cambio en el esquema de la base de datos **debe** implementarse como una nueva migración SQL en `supabase/migrations/`. **Nunca** modificar migraciones existentes.
- Para sincronizar la app con las plataformas nativas: `npm run cap:sync` (equivale a `vite build` + `generate-mobile-html` + `cap sync`).
- La webapp (`dist/client/`) se publica en **Cloudflare Pages**; el target nativo lee el bundle local (sin `server.url` en producción por defecto).

### Limitaciones

- **No** modifica la lógica de juego en `src/games/`.
- **No** realiza cambios visuales en componentes de UI.
- **No** rompe migraciones ya aplicadas en producción.
- **No** expone credenciales de Supabase fuera de `.env` y de las server functions en el servidor.

---

## 5. QA Auditor

**Responsabilidad principal:** Calidad, consistencia de datos, validación de puntajes y revisión de cambios críticos.

### Reglas

- Revisa toda función `calcRoundScore`, `calcTotal` o `finalScores` antes de que un nuevo juego se marque como "listo".
- Verifica que cada `GameModule` nuevo incluya valores realistas de `minPlayers`, `maxPlayers`, `totalRounds` y, cuando aplica, `categories`.
- Audita las migraciones de Supabase: comprueba que las políticas RLS sean correctas y que los índices necesarios estén presentes.
- Mantiene y revisa `docs/ROADMAP.md` marcando tareas completadas y añadiendo nuevas según avance el proyecto.
- Ejecuta el linter (`npm run lint`) y el formateador (`npm run format`) antes de cualquier merge a `main`.
- Documenta cualquier bug conocido o comportamiento inesperado en un comentario en el código fuente y en el ROADMAP.

### Limitaciones

- **No** implementa features nuevas; su rol es de revisión y auditoría.
- **No** aprueba cambios que no tengan una descripción clara de lo que modifican y por qué.
- **No** permite que un juego en estado incompleto (sin `calcRoundScore`/`calcTotal` o sin registro en `registry.ts`) sea desplegado en producción.
