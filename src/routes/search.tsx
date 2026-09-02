import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { searchBGGFn, getBGGGameDetailsFn } from "@/lib/bgg.functions";
import type { BGGGameSearchResult } from "@/lib/bgg.functions";
import { toast } from "sonner";
import { Search, Loader2, Plus, ChevronLeft, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchBGG = useServerFn(searchBGGFn);
  const getBGGGameDetails = useServerFn(getBGGGameDetailsFn);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BGGGameSearchResult[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const data = await searchBGG({ data: { query } });
      setResults(data);
    } catch (error) {
      toast.error("Error al buscar en BoardGameGeek");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGame = async (gameId: number) => {
    if (!user) {
      toast.error("Debes iniciar sesión para añadir juegos.");
      return;
    }

    try {
      setAddingId(gameId);

      // 1. Check if game already in collection
      const { data: existing } = await supabase
        .from("user_games")
        .select("id")
        .eq("user_id", user.id)
        .eq("bgg_id", String(gameId))
        .single();

      if (existing) {
        toast.info("Este juego ya está en tu ludoteca.");
        return;
      }

      // 2. Fetch details from BGG to get image and full name
      const details = await getBGGGameDetails({ data: { id: gameId } });
      if (!details) {
        throw new Error("No se pudieron obtener los detalles del juego.");
      }

      // 3. Save to Supabase
      const { error } = await supabase.from("user_games").insert({
        user_id: user.id,
        bgg_id: String(details.id),
        name: details.name,
        image_url: details.image || null,
        year: details.yearPublished ? parseInt(String(details.yearPublished), 10) || null : null,
        min_players: details.minPlayers || null,
        max_players: details.maxPlayers || null,
      });

      if (error) throw error;

      toast.success(`${details.name} añadido a tu ludoteca.`);
    } catch (error: any) {
      toast.error(error.message || "Error al añadir el juego.");
      console.error(error);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto animate-fade-in pb-20">
        <header className="flex items-center gap-4 py-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="p-2 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Buscar en BGG</h1>
            <p className="text-xs text-slate-500">Añade juegos a tu Ludoteca</p>
          </div>
        </header>

        <form onSubmit={handleSearch} className="relative mb-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Catan, Azul, Ticket to Ride..."
            className="pr-12 bg-white h-12 rounded-2xl shadow-sm text-base"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1 h-10 w-10 rounded-xl"
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </form>

        <div className="space-y-3">
          {results.length === 0 && !loading && query.trim() !== "" && (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-500">Busca el nombre de tu juego arriba.</p>
            </div>
          )}

          {results.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                  {game.name}
                </h3>
                {game.yearPublished && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{game.yearPublished}</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl"
                onClick={() => handleAddGame(game.id)}
                disabled={addingId === game.id}
              >
                {addingId === game.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 flex justify-center">
          <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-xs font-semibold text-slate-500">Powered by</span>
            <a
              href="https://boardgamegeek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#ff5100] text-white text-[11px] font-black px-2 py-0.5 rounded-sm tracking-wide flex items-center shadow-sm"
            >
              BGG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
