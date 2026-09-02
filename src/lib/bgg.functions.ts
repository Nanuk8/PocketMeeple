import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  yearPublished?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playTime?: number;
  description?: string;
}

// ─── XML Parser (fast-xml-parser — works in Node & Cloudflare Workers) ────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["item", "name", "link"].includes(name),
});

// ─── BGG fetch with auth + retry for HTTP 202 ────────────────────────────────
// Lineamientos BGG: No technical support is available for the XML API.
// See: https://boardgamegeek.com/using_the_xml_api

const BGG_BASE = "https://boardgamegeek.com/xmlapi2";

async function fetchBGG(path: string, retries = 3): Promise<string> {
  const token = process.env["BGG_API_TOKEN"];
  const headers: Record<string, string> = {
    "User-Agent": "PocketMeeple/1.0 (+https://boardgamegeek.com/using_the_xml_api)",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`${BGG_BASE}${path}`, { headers });

    if (res.status === 202) {
      // BGG is processing the request — wait and retry
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    if (!res.ok) {
      throw new Error(
        `BGG API error ${res.status}: ${res.statusText}. ` +
          (res.status === 401 ? "Falta el token BGG_API_TOKEN en el .env" : ""),
      );
    }

    return res.text();
  }

  throw new Error("BGG no respondió después de varios intentos (202).");
}

// ─── Server Functions ────────────────────────────────────────────────────────

export const searchBGGFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }): Promise<BGGGameSearchResult[]> => {
    const xml = await fetchBGG(`/search?query=${encodeURIComponent(data.query)}&type=boardgame`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = parser.parse(xml);
    const items: unknown[] = parsed?.items?.item ?? [];
    const results: BGGGameSearchResult[] = [];

    for (const raw of items.slice(0, 20)) {
      const item = raw as Record<string, unknown>;
      const id = parseInt(String(item["@_id"] ?? "0"), 10);
      if (!id) continue;

      // name can be a single object or an array
      const nameArr = Array.isArray(item["name"])
        ? (item["name"] as Record<string, unknown>[])
        : [item["name"] as Record<string, unknown>];

      const primaryName = nameArr.find((n) => n?.["@_type"] === "primary");
      const name = String(primaryName?.["@_value"] ?? "");
      if (!name) continue;

      const yearNode = item["yearpublished"] as Record<string, unknown> | undefined;
      const yearPublished = yearNode ? String(yearNode["@_value"] ?? "") : undefined;

      results.push({ id, name, yearPublished: yearPublished || undefined });
    }

    return results;
  });

export const getBGGGameDetailsFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data }): Promise<BGGGameDetails | null> => {
    const xml = await fetchBGG(`/thing?id=${data.id}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = parser.parse(xml);
    const items: unknown[] = parsed?.items?.item ?? [];
    if (items.length === 0) return null;

    const item = items[0] as Record<string, unknown>;

    // Primary name
    const nameArr = Array.isArray(item["name"])
      ? (item["name"] as Record<string, unknown>[])
      : [item["name"] as Record<string, unknown>];
    const primaryName = nameArr.find((n) => n?.["@_type"] === "primary");
    const name = String(primaryName?.["@_value"] ?? "");

    const image = typeof item["image"] === "string" ? item["image"].trim() : undefined;
    const thumbnail = typeof item["thumbnail"] === "string" ? item["thumbnail"].trim() : undefined;

    const minPlayersNode = item["minplayers"] as Record<string, unknown> | undefined;
    const minPlayers = minPlayersNode
      ? parseInt(String(minPlayersNode["@_value"] ?? "0"), 10) || undefined
      : undefined;

    const maxPlayersNode = item["maxplayers"] as Record<string, unknown> | undefined;
    const maxPlayers = maxPlayersNode
      ? parseInt(String(maxPlayersNode["@_value"] ?? "0"), 10) || undefined
      : undefined;

    const playTimeNode = item["playingtime"] as Record<string, unknown> | undefined;
    const playTime = playTimeNode
      ? parseInt(String(playTimeNode["@_value"] ?? "0"), 10) || undefined
      : undefined;

    const description =
      typeof item["description"] === "string" ? item["description"].trim() : undefined;

    const yearPublishedNode = item["yearpublished"] as Record<string, unknown> | undefined;
    const yearPublished = yearPublishedNode ? String(yearPublishedNode["@_value"] ?? "") || undefined : undefined;

    return { id: data.id, name, image, thumbnail, yearPublished, minPlayers, maxPlayers, playTime, description };
  });
