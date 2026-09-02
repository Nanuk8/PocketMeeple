import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Dices } from "lucide-react";

export function PlayerSpinner({ activePlayers = [] }: { activePlayers?: {name: string}[] }) {
  const [customPlayers, setCustomPlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [currentName, setCurrentName] = useState("");
  
  const allNames = [
    ...activePlayers.map(p => p.name), 
    ...customPlayers
  ];

  const addCustom = () => {
    if (inputValue.trim() && !allNames.includes(inputValue.trim())) {
      setCustomPlayers([...customPlayers, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeCustom = (name: string) => {
    setCustomPlayers(customPlayers.filter(n => n !== name));
  };

  const spin = () => {
    if (allNames.length < 2 || spinning) return;
    setSpinning(true);
    setWinner(null);
    
    let ticks = 0;
    const maxTicks = 20;
    
    const interval = setInterval(() => {
      setCurrentName(allNames[Math.floor(Math.random() * allNames.length)]);
      ticks++;
      
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalWinner = allNames[Math.floor(Math.random() * allNames.length)];
        setCurrentName(finalWinner);
        setWinner(finalWinner);
        setSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      {activePlayers.length === 0 && (
        <div className="flex gap-2">
          <Input 
            placeholder="Añadir jugador..." 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            className="bg-white"
          />
          <Button onClick={addCustom} variant="outline" size="icon"><User className="h-4 w-4" /></Button>
        </div>
      )}

      {allNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activePlayers.map(p => (
            <div key={p.name} className="px-3 py-1 bg-primary/10 text-primary font-medium text-sm rounded-full">
              {p.name}
            </div>
          ))}
          {customPlayers.map(p => (
            <button key={p} onClick={() => removeCustom(p)} className="px-3 py-1 bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-700 font-medium text-sm rounded-full transition-colors">
              {p} ×
            </button>
          ))}
        </div>
      )}

      <div className="min-h-32 my-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
        {spinning || winner ? (
          <div className={`text-3xl font-black text-center px-4 ${winner ? 'text-primary scale-110 transition-transform' : 'text-slate-400'}`}>
            {currentName}
            {winner && <div className="text-sm font-medium text-slate-500 mt-2">¡Empieza!</div>}
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <Dices className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <span className="text-sm">Agrega al menos 2 jugadores</span>
          </div>
        )}
      </div>

      <Button 
        onClick={spin} 
        disabled={allNames.length < 2 || spinning}
        size="lg" 
        className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
      >
        ¿Quién empieza?
      </Button>
    </div>
  );
}
