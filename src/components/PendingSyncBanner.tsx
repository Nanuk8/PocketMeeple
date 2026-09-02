import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushQueue, readQueue } from "@/lib/offline-queue";
import { toast } from "sonner";

export function PendingSyncBanner() {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = () => setCount(readQueue().length);

  const trySync = async (silent = false) => {
    if (syncing) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setSyncing(true);
    try {
      const n = await flushQueue();
      if (n > 0 && !silent) toast.success(`Se sincronizaron ${n} partida(s) pendientes`);
    } finally {
      setSyncing(false);
      refresh();
    }
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    const onOnline = () => trySync(true);
    window.addEventListener("pending-matches-changed", onChange);
    window.addEventListener("online", onOnline);
    // Attempt sync on mount in case we came back online while closed
    trySync(true);
    return () => {
      window.removeEventListener("pending-matches-changed", onChange);
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-40 bg-amber-500/95 text-amber-950 px-3 py-2 text-sm flex items-center gap-2 shadow">
      <CloudOff className="h-4 w-4 shrink-0" />
      <span className="flex-1 font-medium">
        {count} partida{count === 1 ? "" : "s"} pendiente{count === 1 ? "" : "s"} de sincronizar
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 bg-white/80 border-amber-700 text-amber-950 hover:bg-white"
        onClick={() => trySync(false)}
        disabled={syncing}
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
        Reintentar
      </Button>
    </div>
  );
}
