import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import type { RoundEntry, GameModule } from "@/games/types";
import { getGameTheme } from "@/games/theme";

type Props = {
  game: GameModule;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  playerName: string;
  roundNumber: number;
  entry: RoundEntry;
  onSave: (e: RoundEntry) => void;
};

export function RoundCellEditor({
  game,
  open,
  onOpenChange,
  playerName,
  roundNumber,
  entry,
  onSave,
}: Props) {
  const theme = getGameTheme(game);
  const [bid, setBid] = useState<string>("");
  const [tricks, setTricks] = useState<string>("");
  const [bonus, setBonus] = useState<string>("0");

  useEffect(() => {
    if (open) {
      setBid(entry.bid?.toString() ?? "");
      setTricks(entry.tricks?.toString() ?? "");
      setBonus(entry.bonus?.toString() ?? "0");
    }
  }, [open, entry]);

  const preview = game.calcRoundScore!(
    {
      bid: bid === "" ? null : Number(bid),
      tricks: tricks === "" ? null : Number(tricks),
      bonus: Number(bonus) || 0,
    },
    roundNumber,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-sm ${theme.dialog}`}>
        <DialogHeader>
          <DialogTitle className={theme.accent}>
            Ronda {roundNumber} · {playerName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className={`text-xs ${theme.textMuted}`}>Apuesta</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={roundNumber}
              value={bid}
              onChange={(e) => setBid(e.target.value)}
              className={`text-center ${theme.inputUnderline} ${theme.inputText}`}
            />
          </div>
          <div>
            <Label className={`text-xs ${theme.textMuted}`}>Bazas</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={roundNumber}
              value={tricks}
              onChange={(e) => setTricks(e.target.value)}
              className={`text-center ${theme.inputUnderline} ${theme.inputText}`}
            />
          </div>
          <div>
            <Label className={`text-xs ${theme.textMuted}`}>Bonif.</Label>
            <Input
              type="number"
              inputMode="numeric"
              step={10}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              className={`text-center ${theme.inputUnderline} ${theme.inputText}`}
            />
          </div>
        </div>
        <div className="text-center py-2">
          <div className={`text-xs ${theme.textMuted}`}>Puntaje de ronda</div>
          <div
            className={`text-4xl font-black ${
              preview === null
                ? theme.textMuted
                : preview >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
            }`}
          >
            {preview === null ? "—" : preview > 0 ? `+${preview}` : preview}
          </div>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className={`flex-1 ${theme.dark ? "bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800" : ""}`}
            onClick={() => {
              onSave({ bid: null, tricks: null, bonus: 0 });
              onOpenChange(false);
            }}
          >
            Limpiar
          </Button>
          <Button
            className={`flex-1 ${theme.accentBg}`}
            onClick={() => {
              onSave({
                bid: bid === "" ? null : Number(bid),
                tricks: tricks === "" ? null : Number(tricks),
                bonus: Number(bonus) || 0,
              });
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
