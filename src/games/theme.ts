import type { GameModule } from "./types";

export type GameTheme = {
  dark: boolean;
  bg: string;
  overlayClass?: string;
  bgPattern?: string;
  fontFamily?: string;
  header: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  inputUnderline: string;
  inputText: string;
  dialog: string;
};

const PIRATE: GameTheme = {
  dark: true,
  bg: "bg-slate-900",
  overlayClass: "bg-slate-900/80 backdrop-blur-3xl",
  header: "bg-slate-900/80 backdrop-blur-md border-slate-800 shadow-sm",
  card: "bg-slate-800/90 backdrop-blur-md border border-slate-700 shadow-xl rounded-2xl",
  text: "text-slate-100",
  textMuted: "text-slate-400",
  accent: "text-red-400",
  accentBg: "bg-red-800 hover:bg-red-700 text-white",
  inputUnderline:
    "bg-transparent border-0 border-b-2 border-slate-600 focus:border-red-400 focus-visible:ring-0 focus:outline-none rounded-none text-right font-bold text-lg p-1 h-auto",
  inputText: "text-white",
  dialog: "bg-slate-900/95 backdrop-blur-xl text-slate-100 border-slate-700",
};

const CHEESE: GameTheme = {
  dark: false,
  bg: "bg-amber-50",
  overlayClass: "bg-amber-50/85 backdrop-blur-2xl",
  header: "bg-white/70 backdrop-blur-md border-amber-100 shadow-sm",
  card: "bg-white/90 backdrop-blur-md shadow-lg rounded-2xl border border-amber-100",
  text: "text-slate-800",
  textMuted: "text-slate-500",
  accent: "text-orange-600",
  accentBg: "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20",
  inputUnderline:
    "bg-transparent border-0 border-b-2 border-slate-300 focus:border-orange-600 focus-visible:ring-0 focus:outline-none rounded-none text-right font-bold text-lg p-1 h-auto",
  inputText: "text-slate-800",
  dialog: "bg-white/95 backdrop-blur-xl text-slate-800 border-amber-100",
};

const GARDEN: GameTheme = {
  dark: false,
  bg: "bg-green-50",
  overlayClass: "bg-green-50/85 backdrop-blur-2xl",
  header: "bg-white/70 backdrop-blur-md border-green-100 shadow-sm",
  card: "bg-white/90 backdrop-blur-md shadow-lg rounded-2xl border border-green-100",
  text: "text-slate-800",
  textMuted: "text-slate-500",
  accent: "text-emerald-600",
  accentBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20",
  inputUnderline:
    "bg-transparent border-0 border-b-2 border-slate-300 focus:border-emerald-600 focus-visible:ring-0 focus:outline-none rounded-none text-right font-bold text-lg p-1 h-auto",
  inputText: "text-slate-800",
  dialog: "bg-white/95 backdrop-blur-xl text-slate-800 border-green-100",
};

const DEFAULT: GameTheme = {
  dark: false,
  bg: "bg-slate-50",
  overlayClass: "bg-slate-100/85 backdrop-blur-2xl",
  header: "bg-white/70 backdrop-blur-md border-slate-200 shadow-sm",
  card: "bg-white/90 backdrop-blur-md shadow-lg rounded-2xl border border-slate-200",
  text: "text-slate-800",
  textMuted: "text-slate-500",
  accent: "text-slate-700",
  accentBg: "bg-slate-800 hover:bg-slate-700 text-white shadow-md shadow-slate-800/20",
  inputUnderline:
    "bg-transparent border-0 border-b-2 border-slate-300 focus:border-slate-700 focus-visible:ring-0 focus:outline-none rounded-none text-right font-bold text-lg p-1 h-auto",
  inputText: "text-slate-800",
  dialog: "bg-white/95 backdrop-blur-xl text-slate-800 border-slate-200",
};

const RACING: GameTheme = {
  dark: true,
  bg: "bg-slate-800",
  overlayClass: "bg-slate-900/80 backdrop-blur-2xl",
  header: "bg-slate-900/80 backdrop-blur-md border-slate-700 shadow-sm",
  card: "bg-slate-800/90 backdrop-blur-md border border-slate-600 shadow-xl rounded-2xl",
  text: "text-slate-100",
  textMuted: "text-slate-400",
  accent: "text-red-500",
  accentBg: "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20",
  inputUnderline:
    "bg-slate-800/50 border-0 border-b-2 border-slate-500 focus:border-red-500 focus-visible:ring-0 focus:outline-none rounded-none text-right font-bold text-lg p-1 h-auto",
  inputText: "text-white",
  dialog: "bg-slate-800/95 backdrop-blur-xl text-slate-100 border-slate-600",
};

export function getGameTheme(game: GameModule): GameTheme {
  switch (game.theme) {
    case "pirate":
      return PIRATE;
    case "cheese":
      return CHEESE;
    case "garden":
      return GARDEN;
    case "racing":
      return RACING;
    default:
      return DEFAULT;
  }
}

