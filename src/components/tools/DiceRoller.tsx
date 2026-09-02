import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

export function DiceRoller() {
  const [faces, setFaces] = useState(6);
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{res: number[], total: number}[]>([]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    
    let ticks = 0;
    const maxTicks = 10;
    const interval = setInterval(() => {
      setResults(Array.from({ length: count }, () => Math.floor(Math.random() * faces) + 1));
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalResults = Array.from({ length: count }, () => Math.floor(Math.random() * faces) + 1);
        setResults(finalResults);
        setRolling(false);
        setHistory(prev => [{ res: finalResults, total: finalResults.reduce((a, b) => a + b, 0) }, ...prev].slice(0, 3));
      }
    }, 50);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
        {[4, 6, 8, 10, 12, 20].map(f => (
          <button
            key={f}
            onClick={() => setFaces(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${faces === f ? "bg-white shadow-sm text-primary" : "text-slate-600"}`}
          >
            d{f}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
        <span className="text-sm font-medium text-slate-500">Cantidad</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(c => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${count === c ? "bg-primary text-white shadow-md" : "bg-white text-slate-700 border border-slate-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-32 flex flex-col items-center justify-center w-full">
        {results.length > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-3">
              {results.map((r, i) => (
                <div key={i} className={`w-16 h-16 bg-white border-2 border-slate-200 shadow-sm rounded-xl flex items-center justify-center text-3xl font-black ${rolling ? 'text-slate-400' : 'text-slate-800'}`}>
                  {r}
                </div>
              ))}
            </div>
            {count > 1 && !rolling && (
              <div className="text-xl font-bold text-slate-500">
                Total: <span className="text-primary">{results.reduce((a, b) => a + b, 0)}</span>
              </div>
            )}
          </div>
        ) : (
          <Dices className="w-16 h-16 text-slate-200" />
        )}
      </div>

      <Button onClick={roll} size="lg" className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-transform" disabled={rolling}>
        Lanzar Dados
      </Button>

      {history.length > 1 && (
        <div className="w-full mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase">Historial</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.slice(1).map((h, i) => (
              <div key={i} className="flex-shrink-0 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-xs text-slate-500">{h.res.join(', ')}</span>
                {h.res.length > 1 && <span className="font-bold text-sm text-slate-700">={h.total}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
