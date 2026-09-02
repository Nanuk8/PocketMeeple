import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

type Props = {
  title: string;
  children: ReactNode;
  onBack?: () => void;
  backTo?: string;
  rightSlot?: ReactNode;
  contentClassName?: string;
};

export function AppLayout({
  title,
  children,
  onBack,
  backTo = "/",
  rightSlot,
  contentClassName,
}: Props) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate({ to: backTo });
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="max-w-md mx-auto h-14 px-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 -ml-2 px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium text-sm"
          >
            <ChevronLeft className="h-5 w-5" />
            Volver
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-slate-800 truncate">
            {title}
          </h1>
          <div className="min-w-[72px] flex justify-end items-center gap-1">{rightSlot}</div>
        </div>
      </header>
      <main className={`max-w-md mx-auto p-4 animate-fade-in ${contentClassName ?? ""}`}>
        {children}
      </main>
    </div>
  );
}
