import { Link } from "@tanstack/react-router";
import {
  Users,
  Clock,
  Star,
  Skull,
  Cake,
  Flower2,
  Car,
  Dice5,
  Pickaxe,
  Cat,
  Guitar,
  GripVertical,
} from "lucide-react";
import type { GameModule } from "@/games/types";
import { forwardRef } from "react";

const ICONS: Record<string, typeof Skull> = {
  Skull,
  Cake,
  Flower2,
  Car,
  Users,
  Dice5,
  Pickaxe,
  Cat,
  Guitar,
};

interface GameCardProps {
  g: GameModule;
  isFav?: boolean;
  toggleFavorite?: (id: string, e: React.MouseEvent) => void;
  // Drag and drop props
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ g, isFav, toggleFavorite, dragHandleProps, isDragging, style }, ref) => {
    const Icon = ICONS[g.icon] ?? Skull;

    return (
      <div
        ref={ref}
        style={style}
        className={`relative bg-white rounded-3xl p-4 sm:p-6 border ${
          isDragging ? "border-primary shadow-xl z-50 scale-105" : "border-slate-100 shadow-sm"
        } transition-all duration-300 ease-out flex items-center gap-4 will-change-transform group`}
      >
        {/* Drag Handle - solo visible si se pasan las props */}
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            className="p-2 -ml-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Reordenar"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        {/* Link principal */}
        <Link
          to="/play/$gameId"
          params={{ gameId: g.id }}
          className="flex-1 flex items-center gap-4 min-w-0"
        >
          {(g.bggImage ?? g.cover) ? (
            <img
              src={g.bggImage ?? g.cover}
              alt={`Portada de ${g.name}`}
              width={72}
              height={72}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-18 sm:h-18 aspect-square object-cover rounded-2xl shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100">
              <Icon className="h-7 w-7 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-lg sm:text-xl font-bold text-slate-800 truncate">{g.name}</div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
              {g.rating !== undefined && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/50">
                  <Star className="h-3 w-3 font-bold fill-amber-500" />
                  {g.rating.toFixed(1)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200/50">
                <Users className="h-3 w-3" />
                {g.minPlayers}-{g.maxPlayers}
              </span>
              {g.playTime && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200/50">
                  <Clock className="h-3 w-3" />
                  {g.playTime}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Favorite Button */}
        {toggleFavorite && (
          <button
            type="button"
            onClick={(e) => toggleFavorite(g.id, e)}
            className="absolute top-2 right-2 p-2.5 rounded-full hover:bg-slate-50 transition-colors"
            aria-label={isFav ? "Quitar de favoritos" : "Marcar como favorito"}
            aria-pressed={isFav}
          >
            <Star
              className={`h-5 w-5 sm:h-6 sm:w-6 ${
                isFav ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-slate-200"
              }`}
            />
          </button>
        )}
      </div>
    );
  },
);
GameCard.displayName = "GameCard";
