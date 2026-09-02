import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw } from "lucide-react";

export function TurnTimer() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  
  const presets = [30, 60, 90, 120, 300];

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggle = () => setIsRunning(!isRunning);
  
  const reset = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  };

  const setTime = (sec: number) => {
    setIsRunning(false);
    setTotalSeconds(sec);
    setTimeLeft(sec);
  };

  const format = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / totalSeconds) * 100;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex justify-center gap-2 flex-wrap">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setTime(p)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${totalSeconds === p ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {p < 60 ? `${p}s` : `${p/60}m`}
          </button>
        ))}
      </div>

      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        {/* Circle Progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="96" cy="96" r="88" className="stroke-slate-100" strokeWidth="12" fill="none" />
          <circle 
            cx="96" cy="96" r="88" 
            className={`transition-all duration-1000 ease-linear ${isUrgent ? 'stroke-red-500' : 'stroke-primary'}`} 
            strokeWidth="12" fill="none" 
            strokeDasharray="553" 
            strokeDashoffset={553 - (553 * progress) / 100} 
            strokeLinecap="round" 
          />
        </svg>
        
        <div className={`text-5xl font-black tabular-nums z-10 transition-colors ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
          {format(timeLeft)}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={reset} variant="outline" size="icon" className="h-14 w-14 rounded-2xl shadow-sm">
          <RotateCcw className="h-6 w-6 text-slate-600" />
        </Button>
        <Button onClick={toggle} size="icon" className={`h-14 w-14 rounded-2xl shadow-lg ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary'}`}>
          {isRunning ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ml-1" />}
        </Button>
      </div>
    </div>
  );
}
