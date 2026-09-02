export interface BGGGameSearchResult {
  id: number;
  name: string;
  yearPublished?: string;
}

export interface BGGGameDetails {
  id: number;
  name: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playTime?: number;
  description?: string;
}

export async function searchBGG(query: string): Promise<BGGGameSearchResult[]> {
  if (!query || query.trim() === "") return [];

  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
    query,
  )}&type=boardgame`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error en BGG API");

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  const items = xmlDoc.getElementsByTagName("item");
  const results: BGGGameSearchResult[] = [];

  for (let i = 0; i < Math.min(items.length, 20); i++) {
    const item = items[i];
    const id = parseInt(item.getAttribute("id") || "0", 10);

    let name = "";
    const nameNodes = item.getElementsByTagName("name");
    for (let j = 0; j < nameNodes.length; j++) {
      if (nameNodes[j].getAttribute("type") === "primary") {
        name = nameNodes[j].getAttribute("value") || "";
        break;
      }
    }

    let yearPublished = undefined;
    const yearNodes = item.getElementsByTagName("yearpublished");
    if (yearNodes.length > 0) {
      yearPublished = yearNodes[0].getAttribute("value") || undefined;
    }

    results.push({ id, name, yearPublished });
  }

  return results;
}

export async function getBGGGameDetails(id: number): Promise<BGGGameDetails | null> {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  const items = xmlDoc.getElementsByTagName("item");
  if (items.length === 0) return null;
  const item = items[0];

  let name = "";
  const nameNodes = item.getElementsByTagName("name");
  for (let j = 0; j < nameNodes.length; j++) {
    if (nameNodes[j].getAttribute("type") === "primary") {
      name = nameNodes[j].getAttribute("value") || "";
      break;
    }
  }

  const imageNode = item.getElementsByTagName("image")[0];
  const image = imageNode ? imageNode.textContent || undefined : undefined;

  const minPlayersNode = item.getElementsByTagName("minplayers")[0];
  const minPlayers = minPlayersNode
    ? parseInt(minPlayersNode.getAttribute("value") || "0", 10)
    : undefined;

  const maxPlayersNode = item.getElementsByTagName("maxplayers")[0];
  const maxPlayers = maxPlayersNode
    ? parseInt(maxPlayersNode.getAttribute("value") || "0", 10)
    : undefined;

  const playTimeNode = item.getElementsByTagName("playingtime")[0];
  const playTime = playTimeNode
    ? parseInt(playTimeNode.getAttribute("value") || "0", 10)
    : undefined;

  const descriptionNode = item.getElementsByTagName("description")[0];
  const description = descriptionNode ? descriptionNode.textContent || undefined : undefined;

  return {
    id,
    name,
    image,
    minPlayers,
    maxPlayers,
    playTime,
    description,
  };
}
