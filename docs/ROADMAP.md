# ROADMAP.md — Estado del Proyecto y Tareas Pendientes

> Documento vivo. El **QA Auditor** es responsable de mantenerlo actualizado tras cada sprint o release.
> Última actualización: 2026-08-25

---

## Estado Actual — Lo que ya funciona

### Juegos implementados y listos para producción

| Juego                        | Tipo                                             | Estado   |
| ---------------------------- | ------------------------------------------------ | -------- |
| **Skull King**               | Rondas (bid/tricks)                              | Completo |
| **Heat: Pedal to the Metal** | Carreras (posición + bonus)                      | Completo |
| **Fromage**                  | Categorías (point salad)                         | Completo |
| **Pérgola**                  | Categorías (point salad)                         | Completo |
| **Cubitos**                  | Categorías (pista + monedas + bonus)             | Completo |
| **Saboteur**                 | Categorías (3 rondas de oro)                     | Completo |
| **La Isla de los Gatos**     | Categorías (familias, lecciones, tesoros, ratas) | Completo |
| **The Gang**                 | Cooperativo (ganó/perdió)                        | Completo |
| **Luthier**                  | Categorías (instrumentos, pedidos, prestigio)    | Completo |

### Infraestructura

- [x] **Capacitor 8** configurado: `com.pocketmeeple.app`, targets Android e iOS generados.
- [x] **Supabase** conectado: tabla `matches` con RLS + vista `player_rankings`.
- [x] **Cloudflare Pages** como hosting web (build con Vite + Nitro/Wrangler).
- [x] **TanStack Router** con rutas `/`, `/play/$gameId`, `/history`, `/rankings`, `/players`.
- [x] **Sesiones pausadas** en `localStorage`: se puede retomar una partida interrumpida.
- [x] **Temas visuales** por juego: pirate, garden, cheese, racing, pocketmeeple.
- [x] **Rankings de jugadores** calculados en Supabase y mostrados por juego.
- [x] **Historial** de partidas con filtros.
- [x] **Jugadores favoritos** gestionados desde la sección `/players`.

---

## Tareas Pendientes

### Nuevos Juegos

> Para cada juego nuevo: crear `src/games/<id>.ts`, registrar en `registry.ts`, validar con QA Auditor.

- [ ] **Ticket to Ride** — Puntuación por rutas, ciudades conectadas, tickets completados/fallidos y estación de tren. Tipo: `categories`.
- [ ] **7 Wonders** — Categorías: escudos militares, tesoro, progreso, guilds, maravillas, civiles, comerciales. Tipo: `categories`.
- [ ] **Wingspan** — Categorías: aves, bonus de tablero, objetivos, huevos, alimentos, cartas escondidas, ronda. Tipo: `categories`.
- [ ] **Catan (puntos de victoria)** — Recuento simple de puntos de victoria. Tipo: `categories`.
- [ ] **Azul** — Puntaje por rondas (completado de filas) + bonus final (columnas, colores, fila completa). Tipo: `rounds` o `categories` mixto.
- [ ] **Cascadia** — Categorías: hábitats + tokens de vida silvestre según cartas de puntuación. Tipo: `categories`.

### Mejoras a Juegos Existentes

- [ ] **Skull King** — Añadir variante "Kraken & Mermaids" con reglas de bonus extendidas.
- [ ] **Heat** — Soporte para mostrar la mejora de cartas (upgrade path) en el resumen final.
- [ ] **The Gang** — Permitir registrar el puntaje de equipo opcional para histórico comparativo.
- [ ] **Cubitos** — Añadir dados especiales comprables al formulario de categorías para que el recuento sea más claro.

### Monetización

- [ ] **Plan de monetización**: definir el modelo (freemium, pago único, suscripción) antes de implementar cualquier paywall.
- [ ] **In-App Purchases (IAP)** — Integrar Capacitor Purchases (RevenueCat) para desbloquear juegos premium o packs temáticos.
- [ ] **Publicidad (opcional)** — Evaluar AdMob para usuarios gratuitos; requiere configurar `@capacitor-community/admob`.
- [ ] **Versión "Pro"** — Eliminar anuncios, acceso a todos los juegos, estadísticas avanzadas.
- [ ] **Exportar partidas** — Función para compartir el marcador final como imagen o PDF.

### UX / UI

- [ ] **Onboarding** — Pantalla de bienvenida para nuevos usuarios explicando cómo registrar una partida.
- [ ] **Modo oscuro** — Implementar el toggle de tema claro/oscuro usando variables CSS de Tailwind 4.
- [ ] **Animaciones de pódium** — Añadir confetti o animación al terminar una partida.
- [ ] **Splash screen personalizado** — Imagen de marca en lugar del splash vacío actual.
- [ ] **Notificaciones push** — Recordar a los jugadores que tienen una sesión pausada (requiere `@capacitor/push-notifications`).

### Infraestructura y DevOps

- [ ] **Autenticación** — Añadir login con Supabase Auth (Google / Magic Link) para proteger datos por usuario.
- [ ] **RLS por usuario** — Una vez con auth: limitar lectura/escritura de `matches` al usuario propietario.
- [ ] **CI/CD** — Pipeline de GitHub Actions: lint → build → deploy a Cloudflare Pages en push a `main`.
- [ ] **Tests unitarios** — Cubrir las funciones `calcRoundScore`, `calcTotal` y `finalScores` con Vitest.
- [ ] **Store listing** — Preparar assets (capturas, descripción, íconos) para Google Play Store y Apple App Store.
- [ ] **App signing** — Configurar keystores y certificados para builds de producción firmados.

### Documentación

- [ ] Añadir `docs/CONTRIBUTING.md` con guía para contribuir nuevos juegos.
- [ ] Documentar el proceso de firma y publicación en tiendas en `docs/PUBLISHING.md`.
- [ ] Añadir JSDoc a las funciones públicas de `src/games/types.ts`.

---

## Bugs Conocidos / Deuda Técnica

- [ ] `routeTree.gen.ts` es generado automáticamente por TanStack Router — no editar manualmente; recordar regenerar tras añadir rutas.
- [ ] Las sesiones pausadas en `localStorage` no tienen TTL: podrían acumularse indefinidamente. Añadir limpieza automática de sesiones antiguas (> 30 días).
- [ ] La vista `player_rankings` en Supabase no distingue entre partidas cooperativas e individuales — los juegos coop deberían excluirse del ranking individual.

---

## Historial de Releases

| Versión | Fecha   | Highlights                                                                |
| ------- | ------- | ------------------------------------------------------------------------- |
| v0.1    | 2026-05 | MVP: Skull King + Heat, tabla `matches` en Supabase                       |
| v0.2    | 2026-06 | Fromage, Pérgola, Cubitos, Saboteur, Isla de los Gatos, The Gang, Luthier |
| v0.3    | 2026-08 | Capacitor sync a Android/iOS, historial, rankings, sesiones pausadas      |
