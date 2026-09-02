import { useState } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { DiceRoller } from "./DiceRoller";
import { PlayerSpinner } from "./PlayerSpinner";
import { TurnTimer } from "./TurnTimer";
import { RandomNumber } from "./RandomNumber";
import { ClickCounter } from "./ClickCounter";
import { Wrench, Dices, User, Timer, Hash, MousePointerClick } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

export function ToolsOverlay() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dice"|"spinner"|"timer"|"random"|"counter">("dice");
  const path = useRouterState({ select: (s) => s.location.pathname });
  
  // Position the FAB differently based on if we are in game mode or not
  const isPlayRoute = path.startsWith("/play/");
  const bottomClass = isPlayRoute ? "bottom-4 right-4" : "bottom-24 right-4";

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          size="icon" 
          className={`fixed z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${bottomClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300`}
        >
          <Wrench className="h-6 w-6 text-white" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="bg-slate-50 border-t-0 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-8 px-2">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-slate-300 mb-6 mt-2" />
        
        <div className="max-w-md mx-auto w-full">
          <DrawerHeader className="text-left pb-4 px-4">
            <DrawerTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Wrench className="h-5 w-5 text-indigo-500" />
              Herramientas de Mesa
            </DrawerTitle>
          </DrawerHeader>

          {/* Custom Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-4 px-4 scrollbar-hide">
            {[
              { id: "dice", icon: Dices, label: "Dados" },
              { id: "spinner", icon: User, label: "Ruleta" },
              { id: "timer", icon: Timer, label: "Timer" },
              { id: "random", icon: Hash, label: "Número" },
              { id: "counter", icon: MousePointerClick, label: "Contador" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-2xl transition-colors ${
                  activeTab === t.id 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-white text-slate-500 border border-slate-100"
                }`}
              >
                <t.icon className={`h-5 w-5 mb-1 ${activeTab === t.id ? "text-indigo-200" : "text-slate-400"}`} />
                <span className="text-[10px] font-bold tracking-wide uppercase">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-4 min-h-[400px] border border-slate-100 shadow-sm mx-4 mb-4">
            {activeTab === "dice" && <DiceRoller />}
            {activeTab === "spinner" && <PlayerSpinner />}
            {activeTab === "timer" && <TurnTimer />}
            {activeTab === "random" && <RandomNumber />}
            {activeTab === "counter" && <ClickCounter />}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
