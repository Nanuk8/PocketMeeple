import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Skull,
  Plus,
  X,
  UserPlus,
  Loader2,
  Star,
  Users,
  Clock,
  Settings,
  ExternalLink,
  Search,
  ChevronsUpDown,
} from "lucide-react";
import type { GameModule, Player } from "@/games/types";
import { useServerFn } from "@tanstack/react-start";
import { listPlayers, createPlayer } from "@/lib/matches.functions";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { getGameTheme } from "@/games/theme";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Props = {
  game: GameModule;
  onStart: (players: Player[]) => void;
};

export function PlayerSetup({ game, onStart }: Props) {
  const theme = getGameTheme(game);
  const fetchPlayers = useServerFn(listPlayers);
  const addPlayer = useServerFn(createPlayer);
  const [all, setAll] = useState<Player[] | null>(null);
  const [selected, setSelected] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const reload = () => {
    fetchPlayers()
      .then((d) => setAll(d as Player[]))
      // BUG FIX #1: Without .catch() an unhandled rejection would propagate
      // through React and trigger the Error Boundary, crashing the whole page.
      .catch(() => {
        setAll([]);
        toast.error("No se pudieron cargar los jugadores");
      });
  };
  useEffect(reload, [fetchPlayers]);

  /**
   * BUG FIX #2: The original `toggle` called toast.error() INSIDE a setState
   * updater function. React Strict Mode calls updater functions twice, so the
   * toast would fire twice (and it's a side-effect violation in React).
   *
   * Fix: read the current `selected` snapshot (passed explicitly) BEFORE
   * calling setState, then fire the toast and setState independently.
   */
  const toggle = (p: Player, currentSelected: Player[]) => {
    const alreadyIn = currentSelected.some((x) => x.id === p.id);
    if (alreadyIn) {
      setSelected(currentSelected.filter((x) => x.id !== p.id));
      return;
    }
    if (currentSelected.length >= game.maxPlayers) {
      toast.error(`Máximo ${game.maxPlayers} jugadores`);
      return;
    }
    setSelected([...currentSelected, p]);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const p = (await addPlayer({ data: { name } })) as Player;
      setNewName("");
      setAll((cur) => [...(cur ?? []), p].sort((a, b) => a.name.localeCompare(b.name)));
      setSelected((cur) => (cur.length < game.maxPlayers ? [...cur, p] : cur));
    } catch (e: any) {
      toast.error(e.message?.includes("duplicate") ? "Ese nombre ya existe" : "Error al crear");
    } finally {
      setAdding(false);
    }
  };

  const canStart = selected.length >= game.minPlayers;
  const available = (all ?? []).filter((p) => !selected.some((s) => s.id === p.id));
  const favorites = available.filter((p) => p.is_favorite);
  // BUG FIX #3: The Command picker previously listed ALL available players,
  // including those already shown as favorite quick-buttons. This caused
  // duplicates in the UI. The picker now only shows non-favorite players so
  // each player appears in exactly one place.
  const nonFavoriteAvailable = available.filter((p) => !p.is_favorite);
  const Icon = game.Icon ?? Skull;
  const startLabel = game.startLabel ?? "Empezar";
  const coverImage = game.bggImage ?? game.cover;
  const showImage = coverImage && !imgFailed;

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col ${theme.bg}`}>
      {/* Immersive Background */}
      {showImage && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
          />
        </div>
      )}
      {/* Theme Overlay Pattern & Gradient */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${theme.overlayClass || ""} ${theme.bgPattern || ""}`} />

      <div className="relative z-10 flex-1 flex flex-col">
        <AppLayout title={game.name} contentClassName="!p-4 flex-1">
          <div className={`rounded-3xl overflow-hidden shadow-2xl border ${theme.card ? "border-transparent" : "border-slate-200"} ${theme.card || "bg-white"}`}>
            {/* Hero banner */}
            <div className="relative h-48 w-full">
              {showImage ? (
                <img
                  src={coverImage}
                  alt={`Portada de ${game.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${theme.accentBg}`}>
                  <Icon className="h-20 w-20 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">{game.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {game.rating !== undefined && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-md bg-black/40 text-white backdrop-blur-md">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {game.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-md bg-black/40 text-white backdrop-blur-md">
                    <Users className="h-3 w-3" />
                    {game.minPlayers}-{game.maxPlayers}
                    {game.idealPlayers ? ` (Ideal: ${game.idealPlayers})` : ""}
                  </span>
                {game.playTime && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                    <Clock className="h-3 w-3" />
                    {game.playTime}
                  </span>
                )}
                  {game.weight !== undefined && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                      <Settings className="h-3 w-3" />
                      {game.weight.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player selection sheet overlapping banner */}
          <div className="bg-white rounded-t-3xl shadow-lg -mt-6 relative z-10 p-6 space-y-3">
            {game.bggUrl && (
              <a
                href={game.bggUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm py-2.5 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en BoardGameGeek
              </a>
            )}
            <p className="text-xs text-slate-500">
              Selecciona entre {game.minPlayers} y {game.maxPlayers} jugadores
            </p>

            {/* Selected players */}
            <div>
              <Label className="font-bold text-sm text-slate-800">
                Jugadores en la partida ({selected.length})
              </Label>
              <div className="mt-1 min-h-[44px] rounded-lg p-2 flex flex-wrap gap-1 border border-slate-200 bg-slate-50">
                {selected.length === 0 && (
                  <span className="text-xs self-center text-slate-500">Toca para añadir ↓</span>
                )}
                {selected.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggle(p, selected)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${theme.accentBg}`}
                  >
                    {p.name} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Available players */}
            <div>
              <Label className="font-bold text-sm text-slate-800">Disponibles</Label>
              {all === null ? (
                <div className="flex items-center gap-2 text-sm py-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                </div>
              ) : available.length === 0 ? (
                <p className="text-xs py-2 text-slate-500">
                  No hay más jugadores. Crea uno abajo o ve a{" "}
                  <Link to="/players" className="underline">
                    Jugadores
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-1 space-y-2">
                  {/* Favorite quick-add buttons */}
                  {favorites.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {favorites.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => toggle(p, selected)}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                        >
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" /> {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Search picker — shows non-favorite players only (favorites already visible above) */}
                  <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Search className="h-4 w-4" /> Buscar jugador…
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar jugador…" />
                        <CommandList>
                          <CommandEmpty>Sin resultados</CommandEmpty>
                          <CommandGroup>
                            {/* Only list non-favorites here; favorites have their own quick-buttons above */}
                            {nonFavoriteAvailable.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  toggle(p, selected);
                                  setPickerOpen(false);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                <span className="flex-1">{p.name}</span>
                              </CommandItem>
                            ))}
                            {/* If ALL available players are favorites, render them here too so the picker isn't empty */}
                            {nonFavoriteAvailable.length === 0 &&
                              favorites.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => {
                                    toggle(p, selected);
                                    setPickerOpen(false);
                                  }}
                                >
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-500 mr-1" />
                                  <span className="flex-1">{p.name}</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Create new player */}
            <div className="flex gap-2">
              <Input
                placeholder="Nuevo jugador…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="bg-white"
              />
              <Button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
                size="icon"
                className={theme.accentBg}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Start game */}
            <Button
              className={`w-full text-lg font-black tracking-wide h-12 ${theme.accentBg}`}
              disabled={!canStart}
              onClick={() => onStart(selected)}
            >
              {startLabel}
            </Button>
          </div>
        </AppLayout>
      </div>
    </div>
  );
}
