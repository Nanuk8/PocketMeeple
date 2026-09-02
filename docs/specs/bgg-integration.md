# BGG Integration — Especificación Técnica

> Autor: Tech Lead  
> Estado: **APROBADA PARA IMPLEMENTACIÓN**

---

## 1. Contexto y Problema

BoardGameGeek (BGG) cerró su XML API pública a finales de 2025. Ahora **todos los requests sin token retornan HTTP 401**. Además, la API devuelve XML, que no puede parsearse con `DOMParser` en el runtime de Cloudflare Workers.

---

## 2. Arquitectura de la Integración

```
                   ┌─────────────┐
 Browser/Mobile    │  React UI   │  /search route
    (cliente)      │ SearchPage  │
                   └──────┬──────┘
                          │ useServerFn(searchBGGFn)
                          ▼
                   ┌─────────────────────────┐
 Cloudflare Worker │  Server Function        │  src/lib/bgg.functions.ts
    (servidor)     │  searchBGGFn            │
                   │  getBGGGameDetailsFn     │
                   └──────┬──────────────────┘
                          │ fetch + Bearer Token (desde env var)
                          ▼
                   ┌─────────────────────────┐
 API externa       │  BGG XML API v2          │  boardgamegeek.com/xmlapi2
                   │  /search?type=boardgame  │
                   │  /thing?id=Y             │
                   └─────────────────────────┘
                          │ XML response
                          ▼
                   fast-xml-parser (Node/CF compatible)
                          │ JSON tipado
                          ▼
                   UI renderiza resultados
```

---

## 3. Autenticación con BGG

BGG requiere un token Bearer en el header `Authorization`.

### Variable de entorno requerida

```
BGG_API_TOKEN=<token_obtenido_en_boardgamegeek.com/using_the_xml_api>
```

Archivo: `.env` (local) / secrets en Cloudflare Pages (producción).

### Cómo obtener el token

1. Ir a https://boardgamegeek.com/using_the_xml_api
2. Registrar tu aplicación (Nombre: `PocketMeeple`)
3. Guardar el token en `.env` como `BGG_API_TOKEN`

### Requisitos y Lineamientos BGG
- **Atribución obligatoria**: Se debe indicar la atribución a BoardGameGeek en la app y vistas de búsqueda.
- **Leyenda legal requerida**:
  > _"No technical support is available for the XML API. Please see https://boardgamegeek.com/using_the_xml_api for instructions, and links to other resources."_
- **User-Agent**: Peticiones al servidor deben incluir el header `User-Agent: PocketMeeple/1.0 (+https://boardgamegeek.com/using_the_xml_api)`.

---

## 4. Parsing de XML en el servidor

**Librería elegida:** `fast-xml-parser` (npm)  
**Por qué:** Compatible con Cloudflare Workers y Node.js. No depende de `DOMParser`. Ligera (~30KB). Fuertemente tipada.

### Instalación

```bash
npm install fast-xml-parser
```

---

## 5. Tipos de datos

```typescript
// src/lib/bgg.functions.ts

export interface BGGGameSearchResult {
  id: number;
  name: string;
  yearPublished?: string;
}

export interface BGGGameDetails {
  id: number;
  name: string;
  image?: string;
  thumbnail?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playTime?: number;
  description?: string;
}
```

---

## 6. Archivos a crear/modificar

### Backend Specialist

#### [MODIFY] `src/lib/bgg.functions.ts`

- Añadir header `Authorization: Bearer ${BGG_API_TOKEN}` en todos los fetch
- Reemplazar regex XML parsing por `fast-xml-parser`
- Manejar HTTP 202 (BGG a veces responde "procesando, reintenta en 5s") con retry automático (máx 3 intentos)

#### [MODIFY] `.env`

- Añadir `BGG_API_TOKEN=` (el usuario debe rellenarlo)

### UI Specialist

#### [MODIFY] `src/routes/search.tsx`

- Añadir thumbnail de imagen en los resultados de búsqueda (ya viene de `getBGGGameDetails`)
- Mejorar UI para mostrar imagen del juego al añadir

---

## 7. Flujo de búsqueda completo

```
1. Usuario escribe "Splendor" → submit
2. searchBGGFn({ query: "Splendor" })
   → GET /xmlapi2/search?query=Splendor&type=boardgame
   → Authorization: Bearer $BGG_API_TOKEN
3. Respuesta XML → fast-xml-parser → array de { id, name, year }
4. UI muestra lista (máx 20 resultados)

5. Usuario hace click en "Añadir"
6. getBGGGameDetailsFn({ id: 148228 })
   → GET /xmlapi2/thing?id=148228
   → Authorization: Bearer $BGG_API_TOKEN
7. Respuesta XML → { name, image, thumbnail, minPlayers, maxPlayers }
8. INSERT en user_games (Supabase)
9. Toast "Splendor añadido a tu ludoteca"
```

---

## 8. Plan de retry para HTTP 202

```typescript
async function fetchBGGWithRetry(url: string, token: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 2000)); // espera 2s
      continue;
    }
    return res;
  }
  throw new Error("BGG no respondió después de varios intentos");
}
```

---

## 9. Verificación

- [ ] `npm install fast-xml-parser` sin errores
- [ ] `BGG_API_TOKEN` en `.env` y en `import.meta.env`
- [ ] Búsqueda de "Splendor" retorna ≥1 resultado
- [ ] "Añadir" guarda correctamente en `user_games` con imagen
- [ ] El juego aparece en "Mi Ludoteca" en el home
