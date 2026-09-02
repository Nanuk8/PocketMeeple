import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RandomNumber() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const generate = () => {
    if (generating || min >= max) return;
    setGenerating(true);
    
    let ticks = 0;
    const maxTicks = 15;
    
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * (max - min + 1)) + min);
      ticks++;
      
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalRes = Math.floor(Math.random() * (max - min + 1)) + min;
        setResult(finalRes);
        setGenerating(false);
        setHistory(prev => [finalRes, ...prev].slice(0, 5));
      }
    }, 40);
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-slate-500 uppercase font-bold">Mínimo</Label>
          <Input 
            type="number" 
            value={min} 
            onChange={e => setMin(parseInt(e.target.value) || 0)} 
            className="text-center font-bold text-lg h-12 bg-slate-50 border-slate-200"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-slate-500 uppercase font-bold">Máximo</Label>
          <Input 
            type="number" 
            value={max} 
            onChange={e => setMax(parseInt(e.target.value) || 0)} 
            className="text-center font-bold text-lg h-12 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <div className="h-32 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
        {result !== null ? (
          <div className={`text-6xl font-black tabular-nums transition-colors ${generating ? 'text-slate-400' : 'text-primary'}`}>
            {result}
          </div>
        ) : (
          <div className="text-slate-400 font-medium">Click en Generar</div>
        )}
      </div>

      <Button 
        onClick={generate} 
        disabled={generating || min >= max}
        size="lg" 
        className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
      >
        Generar Número
      </Button>

      {history.length > 1 && (
        <div className="flex justify-center gap-2">
          {history.slice(1).map((h, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
              {h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
