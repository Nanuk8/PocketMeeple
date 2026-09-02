import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

export function ClickCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="text-[120px] leading-none font-black text-slate-800 tabular-nums tracking-tighter">
        {count}
      </div>

      <div className="flex items-center gap-6 w-full justify-center">
        <Button 
          variant="outline" 
          onClick={() => setCount(c => c - 1)}
          className="h-20 w-20 rounded-3xl shadow-sm hover:bg-slate-100 border-2 active:scale-95 transition-all"
        >
          <Minus className="h-10 w-10 text-slate-500" />
        </Button>

        <Button 
          onClick={() => setCount(c => c + 1)}
          className="h-24 w-24 rounded-[32px] shadow-xl hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="h-12 w-12" />
        </Button>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setCount(0)}
        className="text-slate-400 hover:text-slate-600 gap-2 mt-4"
      >
        <RotateCcw className="h-4 w-4" /> Reset
      </Button>
    </div>
  );
}
