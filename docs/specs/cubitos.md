# Especificación Técnica — Cubitos

> **Estado:** BORRADOR · **Autor:** Tech Lead · **Fecha:** 2026-08-25  
> **Revisores requeridos:** Game Engine (lógica), UI Specialist (tablero), QA Auditor (validación)

---

## 1. Resumen Ejecutivo

Cubitos es un juego de carreras por rondas en el que los jugadores lanzan dados de colores para avanzar por una pista. El estado actual del módulo `cubitos.ts` trata el juego como `kind: "categories"` con un cálculo de puntaje simplificado (`pista * 10 + monedas + bonus`) que no captura la mecánica real de victoria.

Esta especificación reemplaza esa aproximación por un modelo correcto que:

1. Registra casillas recorridas **más allá de la meta** (`extraSquares`) como detonante y criterio de clasificación primario.
2. Usa **monedas** y **fichas de fanáticos** como desempate en cascada.
3. Expone datos suficientes para que el `PodiumScreen` genere un podio enriquecido con razón de desempate visible.

---

## 2. Mecánica de Victoria

### 2.1 Detonante de Fin de Juego

La partida termina al **final de la ronda** en la que uno o más jugadores superan la casilla de meta (cruce de meta). Esto es un evento explícito que el usuario registra en la UI; no se infiere automáticamente.

> **IMPORTANTE:** El fin de juego se produce **al cerrar la ronda completa**, no en el instante en que el primer jugador cruza. Todos los jugadores que aún no han jugado su turno en esa ronda deben completarlo antes de calcular el ganador.

### 2.2 Clasificación Final (Ranking)

El ranking se determina mediante tres criterios en cascada:

| Prioridad | Criterio       | Descripción                                                        |
| --------- | -------------- | ------------------------------------------------------------------ |
| 1°        | `extraSquares` | Casillas avanzadas más allá de la meta. **Quien más avanzó gana.** |
| 2°        | `coins`        | Monedas al final de la partida (desempate).                        |
| 3°        | `fans`         | Fichas de fanáticos/hinchas (desempate final).                     |

Si dos jugadores empatan en los tres criterios, se declara **empate compartido** (ambos reciben el mismo puesto).

### 2.3 Fórmula de Puntaje Compuesto (`calcTotal`)

Para mantener compatibilidad con el sistema de ranking de Supabase (campo `final_scores: jsonb` → array de números, mayor = mejor), se usa un puntaje compuesto que codifica la jerarquía de desempate:

```
score = extraSquares × 10_000 + coins × 100 + fans
```

**Invariantes:**

- `extraSquares` ∈ [0, 999] (máximo físico de la pista es inferior a 1 000 casillas).
- `coins` ∈ [0, 99] (el manual cita un máximo práctico de ~60 monedas).
- `fans` ∈ [0, 99].

Los multiplicadores aseguran que ningún valor de desempate puede "remontar" al criterio superior, preservando la semántica de la jerarquía de victoria.

> **NOTA:** El `calcTotal` produce el campo `final_scores` que se almacena en Supabase. La vista `player_rankings` calcula `max_score` y `win_rate` sobre este número; un puntaje mayor siempre significa mejor posición, lo cual es correcto bajo esta codificación.

---

## 3. Tipos TypeScript

### 3.1 `CubitosPlayerResult` (nuevo, en `src/games/cubitos.ts`)

```typescript
/**
 * Resultado final de un jugador en una partida de Cubitos.
 * Se almacena serializado dentro de categoryValues (GameState).
 */
export interface CubitosPlayerResult {
  /** ID del jugador (Player.id). Solo para referencia; no se persiste por separado. */
  id: string;
  /** Nombre del jugador (Player.name). */
  name: string;
  /**
   * Casillas avanzadas más allá de la meta (>= 0).
   * Es el criterio de clasificación primario.
   * Un jugador que no cruzó la meta tiene extraSquares = 0.
   */
  extraSquares: number;
  /**
   * Monedas al final de la partida (>= 0).
   * Primer criterio de desempate.
   */
  coins: number;
  /**
   * Fichas de fanáticos/hinchas al final de la partida (>= 0).
   * Segundo y último criterio de desempate.
   */
  fans: number;
  /**
   * Posición final en el ranking (1-based).
   * Se calcula en calcCubitosRanking(); no se persiste directamente.
   */
  finalPosition: number;
}
```

### 3.2 Mapeo a `CategoryValues`

`GameState.categoryValues` es `CategoryValues[]` donde `CategoryValues = Record<string, number | undefined>`.  
Cada `CubitosPlayerResult` se persiste en el índice correspondiente al jugador como:

```typescript
{
  extraSquares: number,   // casillas extra tras cruzar meta
  coins:        number,   // monedas de desempate
  fans:         number,   // fanáticos de desempate
}
```

Las claves son `"extraSquares"`, `"coins"` y `"fans"`.

### 3.3 Definición actualizada de `CUBITOS_CATEGORIES`

```typescript
export const CUBITOS_CATEGORIES: CategoryDef[] = [
  {
    id: "extraSquares",
    label: "Casillas más allá de la meta",
    kind: "number",
  },
  {
    id: "coins",
    label: "Monedas al final de la partida",
    kind: "number",
  },
  {
    id: "fans",
    label: "Fichas de fanáticos",
    kind: "number",
  },
];
```

> **ADVERTENCIA:** Este cambio **rompe compatibilidad** con partidas guardadas anteriormente que usaban las categorías `pista`, `monedas` y `bonus`. Ver §7 (Migración y Compatibilidad) para el plan de manejo de datos históricos.

### 3.4 Función `calcCubitosTotal`

```typescript
export function calcCubitosTotal(v: CategoryValues): number {
  const n = (k: string) => Math.max(0, Math.round(Number(v[k] ?? 0) || 0));
  return n("extraSquares") * 10_000 + n("coins") * 100 + n("fans");
}
```

### 3.5 Función `calcCubitosRanking` (auxiliar, no persiste)

```typescript
/**
 * Ordena y asigna posiciones finales a los jugadores.
 * Devuelve una copia ordenada con finalPosition asignado.
 * Empates comparten puesto (dense ranking).
 */
export function calcCubitosRanking(players: CubitosPlayerResult[]): CubitosPlayerResult[] {
  const sorted = [...players].sort((a, b) => {
    if (b.extraSquares !== a.extraSquares) return b.extraSquares - a.extraSquares;
    if (b.coins !== a.coins) return b.coins - a.coins;
    return b.fans - a.fans;
  });

  let position = 1;
  return sorted.map((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      const isTied =
        p.extraSquares === prev.extraSquares && p.coins === prev.coins && p.fans === prev.fans;
      if (!isTied) position = i + 1;
    }
    return { ...p, finalPosition: position };
  });
}
```

---

## 4. Archivos a Crear o Modificar

### 4.1 `src/games/cubitos.ts` — **MODIFICAR** (Game Engine)

#### Cambios requeridos

| Elemento              | Estado actual                  | Estado objetivo                              |
| --------------------- | ------------------------------ | -------------------------------------------- |
| `CUBITOS_CATEGORIES`  | `pista`, `monedas`, `bonus`    | `extraSquares`, `coins`, `fans`              |
| `calcCubitosTotal`    | `pista * 10 + monedas + bonus` | `extraSquares * 10_000 + coins * 100 + fans` |
| `CubitosPlayerResult` | No existe                      | Añadir como `interface` exportada            |
| `calcCubitosRanking`  | No existe                      | Añadir como función exportada                |
| `CUBITOS_DICE`        | Sin cambios                    | Mantener intacto                             |
| Metadatos BGG         | Sin cambios                    | Mantener intacto                             |

#### Sección a mantener intacta

```typescript
// CUBITOS_DICE permanece sin cambios:
// MACEDONIA_PUNK, BOOMERANG, ROCKET, COCONUT, NINJA
```

---

### 4.2 `src/components/CubitosBoard.tsx` — **CREAR** (UI Specialist)

Tablero dedicado para Cubitos. **No** modifica `CategoryBoard.tsx`; Cubitos requiere UX especializada para la mecánica de carrera.

#### Responsabilidades del componente

1. **Selector de cruce de meta**: Toggle o checkbox por jugador indicando si cruzó la meta. Permite registrar rápidamente sin necesidad de teclado.
2. **Contador de casillas extra** (`extraSquares`): Steppers numéricos (+/−) con valor inicial 0, habilitados solo si el jugador cruzó la meta.
3. **Contadores de desempate**:
   - `coins`: Input numérico, visible siempre (las monedas se acumulan durante la partida).
   - `fans`: Input numérico, visible siempre.
4. **Resumen de clasificación en tiempo real**: Preview del podio según los valores actuales, actualizado sin necesidad de confirmar.
5. **Acciones de fin de partida**: Botón "Finalizar" (con validación) y "Nueva partida".

#### Contrato de Props

```typescript
type CubitorsBoardProps = {
  game: GameModule; // cubitos GameModule
  state: GameState; // estado de la partida
  setState: (s: GameState) => void;
  onNewGame: () => void;
  onFinish: () => void; // dispara validación + PodiumScreen
  onBack?: () => void;
};
```

#### Estructura visual (mobile-first, 375 px mínimo)

```
┌─────────────────────────────────────────────┐
│ [← Volver]  🎲 CUBITOS          [Finalizar] │  ← Header sticky (theme: racing)
│                                  [Nueva]    │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ 👤 Jugador 1              🏆 #1     │    │
│  │ ☑ Cruzó la meta                     │    │
│  │ Casillas extra:  [−] [  3  ] [+]    │    │
│  │ Monedas:              [_____]        │    │
│  │ Fanáticos:            [_____]        │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 👤 Jugador 2              🥈 #2     │    │
│  │ ☐ No cruzó la meta                  │    │  ← extraSquares deshabilitado
│  │ Monedas:              [_____]        │    │
│  │ Fanáticos:            [_____]        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ── Clasificación actual ──                 │
│  1° Jugador 1  · 3 casillas extra           │
│  2° Jugador 2  · empate → 12 monedas        │
└─────────────────────────────────────────────┘
```

#### Comportamiento del selector "Cruzó la meta"

- Es un **checkbox** (o toggle pill) por jugador.
- Al marcar → habilita el stepper `extraSquares` (mínimo 0; si el jugador cruzó exactamente la meta sin extra → valor 0 es válido).
- Al desmarcar → fuerza `extraSquares = 0` y deshabilita el stepper.

> **TIP:** Usar `Checkbox` de Radix UI vía shadcn/ui. El stepper se implementa con dos `Button` `size="icon"` flanqueando un `Input type="number"`.

#### Etiquetas y textos

| Elemento              | Texto sugerido                                      |
| --------------------- | --------------------------------------------------- |
| Checkbox activo       | "✓ Cruzó la meta"                                   |
| Checkbox inactivo     | "No cruzó la meta"                                  |
| Label `extraSquares`  | "Casillas más allá de la meta"                      |
| Label `coins`         | "Monedas"                                           |
| Label `fans`          | "Fanáticos"                                         |
| Sección clasificación | "Clasificación actual"                              |
| Razón de desempate    | "Desempate por monedas" / "Desempate por fanáticos" |

#### Razón de desempate en el resumen

Cuando dos jugadores empatan en `extraSquares`, la tarjeta del jugador que queda por delante en el ranking debe mostrar una píldora indicando la razón:

```
🥇 Jugador A  · 3 casillas extra
🥈 Jugador B  · 3 casillas extra  ← [Desempate: +2 monedas]
```

---

### 4.3 `src/components/PodiumScreen.tsx` — **NO MODIFICAR** (UI Specialist)

El `PodiumScreen` existente ya ordena por `finalScores` (número compuesto). Dado que `calcCubitosTotal` produce un número cuyo orden es correcto, el pódium se renderiza correctamente **sin cambios**.

Si el UI Specialist quiere enriquecer el pódium con el desglose de Cubitos (casillas / monedas / fanáticos), puede hacerlo añadiendo una prop opcional `renderScoreDetail` en una iteración futura. **No es parte de esta especificación.**

---

### 4.4 `src/routes/play.$gameId.tsx` — **VERIFICAR** (Tech Lead / UI Specialist)

Revisar que el dispatcher de `kind` renderice `CubitosBoard` en lugar de `CategoryBoard` para `game.id === "cubitos"`. Hay dos estrategias posibles:

**Opción A — Nuevo `kind`:**  
Añadir `kind: "cubitos"` al `GameModule` y un nuevo case en el dispatcher de la ruta. Esta es la opción más limpia arquitectónicamente.

**Opción B — Detección por `id`:**  
Mantener `kind: "categories"` y hacer una excepción `if (game.id === "cubitos") return <CubitosBoard … />` antes del switch. Más rápido de implementar, pero rompe el principio de uniformidad del catálogo.

> **IMPORTANTE — Decisión pendiente del Tech Lead:** Se recomienda la **Opción A** (`kind: "cubitos"`) para mantener la coherencia del sistema de tipos y facilitar futuros juegos de carreras similares. Si se elige esta opción, se debe actualizar:
>
> - `GameModule.kind` en `src/games/types.ts` (unión de tipos)
> - El switch/dispatcher en `src/routes/play.$gameId.tsx`
> - Documentar el nuevo `kind` en `ARCHITECTURE.md`

---

### 4.5 `src/games/types.ts` — **MODIFICAR** si se adopta Opción A (Tech Lead)

```typescript
// Línea 48 — ampliar la unión de kind:
kind?: "rounds" | "categories" | "heat" | "coop" | "cubitos";
```

---

### 4.6 `src/games/registry.ts` — **SIN CAMBIOS**

`cubitos` ya está registrado. Solo requiere actualización si se cambia el nombre del export en `cubitos.ts`.

---

### 4.7 `src/games/theme.ts` — **VERIFICAR**

Se recomienda aplicar el tema `"racing"` (ya existente) al módulo `cubitos`:

```typescript
// En cubitos.ts — añadir:
theme: "racing",
```

Si el UI Specialist considera que la paleta no es adecuada para el arte de Cubitos (colores vivos, humor), puede proponer un nuevo tema `"cubitos"` en `theme.ts`. **Requiere aprobación del Tech Lead.**

---

## 5. Validación (`validateGameState`)

La función `validateGameState` en `src/games/types.ts` maneja `"categories"` de forma genérica. Si se adopta `kind: "cubitos"`, se debe añadir un caso específico.

### Reglas de validación para Cubitos

```typescript
if (game.kind === "cubitos") {
  const vals = state.categoryValues ?? [];
  for (let p = 0; p < state.players.length; p++) {
    const v = vals[p] ?? {};
    const coins = v["coins"];
    const fans = v["fans"];

    if (coins === undefined || Number.isNaN(coins)) {
      return `Falta el número de monedas para ${state.players[p].name}`;
    }
    if (fans === undefined || Number.isNaN(fans)) {
      return `Falta el número de fanáticos para ${state.players[p].name}`;
    }
  }
  return null;
}
```

> **RECOMENDACIÓN:** El estado local `crossedMeta: boolean[]` en React gestiona qué jugadores cruzaron la meta. Al desmarcar se mantiene `extraSquares = 0`. La validación solo exige que `coins` y `fans` estén rellenados para todos los jugadores y que al menos uno tenga `extraSquares > 0` (o que el usuario haya confirmado que alguien cruzó). Esto evita contaminar `categoryValues` con claves auxiliares.

---

## 6. Flujo de Datos Completo

```
Usuario
  │
  ├─▶ CubitosBoard
  │     ├─ Marca "cruzó la meta" por jugador   → crossedMeta[] (estado local React)
  │     ├─ Ajusta extraSquares (stepper)        → categoryValues[i].extraSquares
  │     ├─ Introduce coins y fans               → categoryValues[i].coins / fans
  │     │
  │     ├─ [Tiempo real] calcCubitosTotal(v)   → score compuesto → preview ranking
  │     └─ calcCubitosRanking(players[])        → posiciones + razón de desempate
  │
  ├─▶ [Pulsa Finalizar]
  │     ├─ validateGameState(state, game)       → null | string error
  │     └─ onFinish() → PodiumScreen
  │
  └─▶ PodiumScreen
        ├─ finalScores(state, game)             → scores[] (calcCubitosTotal por jugador)
        ├─ sort descendente                     → ranked[]
        └─ saveMatch({ players, final_scores, winner, rounds }) → Supabase
```

---

## 7. Migración y Compatibilidad con Datos Históricos

### 7.1 Problema

Las partidas de Cubitos guardadas antes de este cambio usan las claves `pista`, `monedas` y `bonus` en `categoryValues`. El nuevo modelo usa `extraSquares`, `coins` y `fans`.

### 7.2 Estrategia de Migración (Mobile Integrator)

Añadir una migración de lectura no destructiva en la capa de deserialización:

```typescript
// src/lib/sessions.ts o donde se deserializa el estado del juego
function migrateCubitosState(state: GameState): GameState {
  if (!state.categoryValues) return state;
  return {
    ...state,
    categoryValues: state.categoryValues.map((v) => {
      // Si ya tiene el nuevo formato, no tocar
      if (v["extraSquares"] !== undefined) return v;
      // Migrar desde el formato viejo
      const pista = Number(v["pista"] ?? 0);
      const monedas = Number(v["monedas"] ?? 0);
      return {
        extraSquares: pista, // Aproximación: pista → casillas extra
        coins: monedas,
        fans: Number(v["bonus"] ?? 0), // bonus → fans (aproximación razonable)
      };
    }),
  };
}
```

> **ADVERTENCIA:** Esta migración es una **aproximación**. Las partidas históricas que usaban `pista` como "posición total" (no casillas extra) producirán puntajes distintos al reinterpretarlas. Se recomienda aceptar que las partidas antiguas de Cubitos tienen datos aproximados.

### 7.3 Sin migración de Supabase

No se requiere ninguna migración SQL. El campo `rounds: jsonb` almacena el `GameState` serializado; la columna `final_scores` almacena el array de números. Ambos son compatibles con el nuevo modelo siempre que el código cliente maneje la migración de lectura.

---

## 8. Entradas para el UI Specialist — Resumen de Componentes

### 8.1 Inventario de elementos en `CubitosBoard.tsx`

| #   | Elemento UI                    | Tipo Radix/shadcn                     | Notas                                               |
| --- | ------------------------------ | ------------------------------------- | --------------------------------------------------- |
| 1   | **Checkbox "cruzó la meta"**   | `Checkbox`                            | Por jugador; controla habilitación del stepper      |
| 2   | **Stepper `extraSquares`**     | `Button` (×2) + `Input type="number"` | Min 0; deshabilitado si no cruzó meta               |
| 3   | **Input `coins`**              | `Input type="number"`                 | Visible siempre; min 0                              |
| 4   | **Input `fans`**               | `Input type="number"`                 | Visible siempre; min 0                              |
| 5   | **Preview ranking**            | Lista `<ol>` ordenada                 | Recalculada en tiempo real con `calcCubitosRanking` |
| 6   | **Chip de razón de desempate** | `Badge` (shadcn)                      | Visible solo cuando hay empate en `extraSquares`    |
| 7   | **Botón Finalizar**            | `Button` (accentBg)                   | Dispara `validateGameState` antes de `onFinish`     |
| 8   | **Botón Nueva partida**        | `AlertDialog` + `Button outline`      | Igual al patrón de `CategoryBoard`                  |

### 8.2 Iconografía sugerida (Lucide React)

| Elemento       | Ícono sugerido              |
| -------------- | --------------------------- |
| Cruce de meta  | `Flag`                      |
| Casillas extra | `Footprints` o `ArrowRight` |
| Monedas        | `Coins`                     |
| Fanáticos      | `Users` o `Star`            |
| 1° puesto      | `Trophy`                    |
| 2°–3° puestos  | `Medal` / `Award`           |

### 8.3 Comportamiento de la tarjeta de jugador

- **Expandida por defecto** al iniciar la partida (igual que `CategoryBoard`).
- Al marcar "cruzó la meta" → el fondo de la tarjeta cambia a un tono ligeramente distinto (ej. `bg-green-900/20` en tema racing) para indicar visualmente el estado.
- La posición en tiempo real (`#1`, `#2`, etc.) se muestra en la esquina superior derecha de cada tarjeta.

---

## 9. Verificación y QA

### 9.1 Casos de prueba para `calcCubitosTotal`

| extraSquares | coins | fans | Puntaje esperado |
| :----------: | :---: | :--: | :--------------: |
|      5       |  12   |  3   |      51 203      |
|      5       |  10   |  7   |      51 007      |
|      3       |  99   |  99  |      39 999      |
|      0       |  60   |  20  |      6 020       |
|      0       |   0   |  0   |        0         |

**Verificación de jerarquía:**

- `extraSquares=3, coins=99, fans=99` = 39 999 < `extraSquares=4, coins=0, fans=0` = 40 000 ✓ (extraSquares siempre domina)
- `extraSquares=5, coins=10, fans=99` = 51 099 < `extraSquares=5, coins=11, fans=0` = 51 100 ✓ (coins domina sobre fans)

### 9.2 Casos de prueba para `calcCubitosRanking`

**Caso 1 — Ganador claro:**

```
Input:  [{ A, extra:3, coins:10, fans:2 }, { B, extra:3, coins:10, fans:5 }, { C, extra:5, coins:0, fans:0 }]
Output: [C→#1, B→#2, A→#3]   // C gana por extra; B supera a A por fans
```

**Caso 2 — Empate total:**

```
Input:  [{ X, extra:2, coins:5, fans:3 }, { Y, extra:2, coins:5, fans:3 }]
Output: [X→#1, Y→#1]   // empate compartido
```

### 9.3 Checklist de validación de UI

- [ ] El botón "Finalizar" no se activa si `coins` o `fans` están vacíos para algún jugador.
- [ ] El stepper `extraSquares` no permite valores negativos.
- [ ] El stepper se deshabilita cuando `crossedMeta[i] === false`.
- [ ] El preview de ranking se actualiza inmediatamente al cambiar cualquier valor.
- [ ] El chip de desempate muestra la razón correcta al haber empate en `extraSquares`.
- [ ] La tarjeta cambia de tono visual al marcar "cruzó la meta".

---

## 10. Decisiones Pendientes (Abiertas)

| ID  | Decisión                           | Opciones                                                                        | Responsable                          |
| --- | ---------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| D1  | Estrategia de dispatch del tablero | **Opción A** (`kind: "cubitos"`) recomendada vs Opción B (detect por `game.id`) | **Tech Lead**                        |
| D2  | Tema visual para Cubitos           | Reusar `"racing"` vs crear `"cubitos"` nuevo                                    | **UI Specialist** + Tech Lead        |
| D3  | Estado `crossedMeta`               | Local React (recomendado) vs persistir en `categoryValues`                      | **Game Engine** + UI Specialist      |
| D4  | Enriquecimiento del Podium         | Pódium genérico (sin cambios) vs añadir desglose Cubitos                        | **UI Specialist** (iteración futura) |

---

## 11. Checklist de Implementación por Rol

### Game Engine

- [ ] Actualizar `CUBITOS_CATEGORIES` en `cubitos.ts` (`extraSquares`, `coins`, `fans`)
- [ ] Reescribir `calcCubitosTotal` con fórmula compuesta (`extraSquares * 10_000 + coins * 100 + fans`)
- [ ] Añadir `interface CubitosPlayerResult` exportada
- [ ] Añadir `calcCubitosRanking` exportada con dense ranking
- [ ] Añadir `theme: "racing"` al módulo (o el tema que defina UI Specialist)
- [ ] Añadir `kind: "cubitos"` si se adopta Opción A (D1)

### Tech Lead

- [ ] Resolver D1 (estrategia de dispatch)
- [ ] Si Opción A: ampliar unión de `kind` en `GameModule` (`src/games/types.ts` L.48)
- [ ] Si Opción A: añadir case en dispatcher de `src/routes/play.$gameId.tsx`
- [ ] Si Opción A: actualizar `ARCHITECTURE.md` con el nuevo `kind` y su tablero asociado

### UI Specialist

- [ ] Crear `src/components/CubitosBoard.tsx`
- [ ] Implementar checkbox "cruzó la meta" con control de habilitación del stepper
- [ ] Implementar steppers `extraSquares` y inputs `coins` / `fans`
- [ ] Implementar preview de ranking en tiempo real con chips de razón de desempate
- [ ] Decidir tema visual (D2) y crear tema propio si es necesario

### Mobile Integrator

- [ ] Añadir función `migrateCubitosState` en capa de deserialización de sesiones
- [ ] Asegurar que el migrador se invoca al cargar partidas de Cubitos desde `localStorage` y Supabase

### QA Auditor

- [ ] Verificar `calcCubitosTotal` con la tabla de casos de prueba (§9.1)
- [ ] Verificar `calcCubitosRanking` con los casos de prueba (§9.2)
- [ ] Verificar jerarquía de desempate: `extraSquares` > `coins` > `fans`
- [ ] Validar que `win_rate` y `max_score` en `player_rankings` son coherentes con el nuevo puntaje
- [ ] Ejecutar `npm run lint` y `npm run format` antes del merge a `main`

---

_Fin de la especificación — Cubitos · PocketMeeple_
