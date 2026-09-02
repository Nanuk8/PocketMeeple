import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, ChevronRight, LogOut, Plus, Search, BookOpen, Star, Grid } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GAMES_CATALOG, GAMES } from "@/games/registry";
import { listMatches } from "@/lib/matches.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { GameModule } from "@/games/types";
import { GameCard } from "@/components/GameCard";
import { FavoritesSection } from "@/components/FavoritesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PocketMeeple · Selector de Juegos" },
      {
        name: "description",
        content: "Plataforma para anotar puntajes de juegos de mesa con historial y rankings.",
      },
    ],
  }),
  component: Home,
});

const FAVORITES_KEY = "pocketmeeple:favorite-games";
const LEGACY_FAVORITES_KEY = "ludiscorer:favorite-games";

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY) || window.localStorage.getItem(LEGACY_FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function Home() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const fetchMatches = useServerFn(listMatches);
  const [lastMatch, setLastMatch] = useState<{ game_name: string; date: string } | null>(null);

  const [importedGames, setImportedGames] = useState<GameModule[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadMyGames = async () => {
      setLoadingGames(true);
      const { data, error } = await supabase.from("user_games").select("*").eq("user_id", user.id);

      if (error) {
        console.error("Error loading games", error);
      } else if (data) {
        const genericGames: GameModule[] = [];
        for (const ug of data) {
          const catalogGame = GAMES_CATALOG.find((g) => String(g.bggId) === String(ug.bgg_id));
          if (!catalogGame) {
            genericGames.push({
              id: `bgg-${ug.bgg_id}`,
              name: ug.name,
              icon: "Skull",
              bggId: ug.bgg_id,
              bggImage: ug.image_url,
              kind: "generic",
              minPlayers: 1,
              maxPlayers: 99,
              startLabel: "Jugar",
              theme: "default",
            } as unknown as GameModule);
          }
        }

        // Remove duplicates if any
        const unique = Array.from(new Map(genericGames.map((g) => [g.id, g])).values());
        setImportedGames(unique);
      }
      setLoadingGames(false);
    };

    loadMyGames();
  }, [user]);

  useEffect(() => {
    fetchMatches()
      .then((d) => {
        const arr = d as unknown as Array<{ game_name: string; date: string }>;
        if (arr && arr.length > 0) setLastMatch({ game_name: arr[0].game_name, date: arr[0].date });
      })
      .catch(() => {
        // ignore
      });
  }, [fetchMatches]);

  const lastGame = useMemo(() => {
    if (!lastMatch) return null;
    return GAMES.find((g) => g.name === lastMatch.game_name) ?? null;
  }, [lastMatch]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleReorderFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch {
      // ignore
    }
  };

  // We only show non-favorites in their respective lists so they don't duplicate
  // Wait, or maybe show them in both. It's usually better to show them only in favorites if they are favorited, or just show them in both but with the star active. Let's show in both with star active.

  const sortedIntegratedGames = useMemo(() => {
    return [...GAMES_CATALOG].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const sortedImportedGames = useMemo(() => {
    return [...importedGames].sort((a, b) => a.name.localeCompare(b.name));
  }, [importedGames]);

  // Combine both for the favorites section
  const allGamesMap = useMemo(() => {
    const map = new Map<string, GameModule>();
    GAMES_CATALOG.forEach((g) => map.set(g.id, g));
    importedGames.forEach((g) => map.set(g.id, g));
    return map;
  }, [importedGames]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 pb-24">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <header className="relative flex items-center justify-between py-6 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              PocketMeeple
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
              Tu Ludoteca
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/search"
              className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
              aria-label="Buscar juegos"
            >
              <Search className="h-5 w-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {lastMatch &&
          lastGame &&
          (() => {
            const dateLabel = new Date(lastMatch.date).toLocaleDateString("es", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Última partida
                  </span>
                </div>
                <Link
                  to="/play/$gameId"
                  params={{ gameId: lastGame.id }}
                  className="bg-primary text-primary-foreground rounded-3xl p-4 sm:p-5 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center gap-4 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {(lastGame.bggImage ?? lastGame.cover) ? (
                    <img
                      src={lastGame.bggImage ?? lastGame.cover}
                      alt={`Portada de ${lastGame.name}`}
                      width={56}
                      height={56}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 aspect-square object-cover rounded-2xl shadow-sm shrink-0 border-2 border-primary-foreground/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-primary-foreground/10 border-2 border-primary-foreground/20">
                      <Grid className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold truncate">{lastGame.name}</div>
                    <div className="text-sm text-primary-foreground/80 mt-0.5">
                      {dateLabel} · Retomar
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary-foreground/60 shrink-0" />
                </Link>
              </div>
            );
          })()}

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-200/50 p-1 rounded-2xl">
            <TabsTrigger
              value="favorites"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Star className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Favoritos</span>
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Mi Ludoteca</span>
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Grid className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="focus-visible:outline-none">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Favoritos
              </h2>
              <span className="text-xs text-slate-400">Arrastra para reordenar</span>
            </div>
            <FavoritesSection
              favoriteIds={favorites}
              gamesMap={allGamesMap}
              onReorder={handleReorderFavorites}
              toggleFavorite={toggleFavorite}
            />
          </TabsContent>

          <TabsContent value="library" className="focus-visible:outline-none">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Juegos Importados
                </h2>
                {loadingGames && (
                  <span className="text-xs text-slate-400 animate-pulse">Cargando...</span>
                )}
              </div>
              <Link
                to="/search"
                className="flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir
              </Link>
            </div>

            {importedGames.length === 0 && !loadingGames && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm mt-4">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700">Aún no has importado juegos</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Busca en BGG para añadir tus juegos a tu ludoteca.
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar juegos
                </Link>
              </div>
            )}

            <div className="grid gap-3">
              {sortedImportedGames.map((g) => (
                <GameCard
                  key={g.id}
                  g={g}
                  isFav={favorites.includes(g.id)}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="focus-visible:outline-none">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Juegos Integrados
              </h2>
            </div>
            <div className="grid gap-3">
              {sortedIntegratedGames.map((g) => (
                <GameCard
                  key={g.id}
                  g={g}
                  isFav={favorites.includes(g.id)}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
