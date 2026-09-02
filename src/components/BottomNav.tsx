import { Link, useRouterState } from "@tanstack/react-router";
import { Home, History, Trophy, Users, Menu, Settings, User } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";

const mainItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/players", label: "Jugadores", icon: Users },
  { to: "/history", label: "Historial", icon: History },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Hide during an active match (route /play/...)
  if (path.startsWith("/play/")) return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-sm">
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {mainItems.map((it) => {
          const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors ${
                  active ? "text-violet-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {it.label}
              </Link>
            </li>
          );
        })}

        {/* Drawer for More options */}
        <li>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <button className="w-full flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors text-slate-500 hover:text-slate-800">
                <Menu className="h-5 w-5" />
                Más
              </button>
            </DrawerTrigger>
            <DrawerContent className="bg-slate-50 border-t-0 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-6">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-slate-300 mb-6 mt-2" />
              <div className="px-6 max-w-md mx-auto w-full">
                <DrawerHeader className="px-0 pt-0 text-left">
                  <DrawerTitle className="text-xl font-bold text-slate-800">Menú</DrawerTitle>
                  <DrawerDescription className="text-slate-500">
                    Otras porciones de la aplicación.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-3 py-4">
                  <Link
                    to="/rankings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                  >
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700">Ranking Global</span>
                  </Link>
                  <Link
                    to="/profile/me"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform"
                  >
                    <div className="bg-violet-100 text-violet-600 p-2 rounded-xl">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700">Mi Perfil</span>
                  </Link>
                  {/* Espacio para futuros enlaces (Ajustes, etc.) */}
                  <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-slate-100/50 shadow-sm opacity-60">
                    <div className="bg-slate-200 text-slate-500 p-2 rounded-xl">
                      <Settings className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-500">Ajustes (Próximamente)</span>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </li>
      </ul>
    </nav>
  );
}
