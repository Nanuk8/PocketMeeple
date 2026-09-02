import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GameCard } from "./GameCard";
import type { GameModule } from "@/games/types";
import { Star } from "lucide-react";

interface FavoritesSectionProps {
  favoriteIds: string[];
  gamesMap: Map<string, GameModule>;
  onReorder: (newFavorites: string[]) => void;
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
}

function SortableGameItem({
  id,
  g,
  toggleFavorite,
}: {
  id: string;
  g: GameModule;
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <GameCard
      ref={setNodeRef}
      style={style}
      g={g}
      isFav={true}
      toggleFavorite={toggleFavorite}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
    />
  );
}

export function FavoritesSection({
  favoriteIds,
  gamesMap,
  onReorder,
  toggleFavorite,
}: FavoritesSectionProps) {
  const [items, setItems] = useState(favoriteIds);

  useEffect(() => {
    setItems(favoriteIds);
  }, [favoriteIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorder(newItems);
    }
  };

  // Filtrar por si hay IDs de favoritos que ya no existen en los juegos cargados
  const validItems = items.filter((id) => gamesMap.has(id));

  if (validItems.length === 0) {
    return (
      <div className="bg-amber-50/50 border border-amber-200/50 rounded-3xl p-6 sm:p-8 text-center mt-4">
        <Star className="h-10 w-10 text-amber-300 mx-auto mb-3" />
        <h3 className="font-bold text-amber-900">Sin favoritos</h3>
        <p className="text-sm text-amber-700/70 mt-1">
          Marca juegos con la estrella para tenerlos siempre a mano aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={validItems} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {validItems.map((id) => {
              const game = gamesMap.get(id);
              if (!game) return null;
              return <SortableGameItem key={id} id={id} g={game} toggleFavorite={toggleFavorite} />;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
