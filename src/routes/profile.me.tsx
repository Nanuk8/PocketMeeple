import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Activity, LogOut, Check, Pencil, Medal, Calendar, Mail } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/profile/me")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ played: 0, won: 0, winRate: 0, favoriteGame: "Ninguno", currentStreak: 0 });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // 1. Load Profile
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (pData) {
          setProfile(pData);
          setNewName(pData.display_name || pData.username || "Jugador");
        }

        // 2. Load Stats
        // Get the internal player_id mapped to this user's display name
        const displayName = pData?.display_name || pData?.username || "";
        if (!displayName) return;

        const { data: player } = await supabase.from('players').select('id').ilike('name', displayName).single();
        
        if (player) {
          const { data: scores } = await supabase
            .from('match_scores')
            .select('is_winner, match_id, matches(game_name, date)')
            .eq('player_id', player.id);
            
          if (scores && scores.length > 0) {
            const played = scores.length;
            const won = scores.filter(s => s.is_winner).length;
            const winRate = Math.round((won / played) * 100);
            
            // Calculate favorite game
            const gameCounts = scores.reduce((acc, curr: any) => {
              const gName = curr.matches?.game_name;
              if (gName) acc[gName] = (acc[gName] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            let maxCount = 0;
            let fav = "Ninguno";
            Object.entries(gameCounts).forEach(([name, count]) => {
              if (count > maxCount) {
                maxCount = count;
                fav = name;
              }
            });
            
            // Calculate Streak
            // Sort scores by date desc
            const sortedScores = scores.sort((a: any, b: any) => 
              new Date(b.matches?.date).getTime() - new Date(a.matches?.date).getTime()
            );
            
            let streak = 0;
            for (const s of sortedScores) {
              if (s.is_winner) streak++;
              else break;
            }

            setStats({ played, won, winRate, favoriteGame: fav, currentStreak: streak });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    try {
      await supabase.from('profiles').update({ display_name: newName.trim() }).eq('id', user.id);
      setProfile({ ...profile, display_name: newName.trim() });
      setEditingName(false);
      toast.success("Perfil actualizado");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getInitial = () => {
    const name = profile?.display_name || profile?.username || "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <AppLayout title="Mi Perfil">
      <div className="space-y-6 pb-6">
        {/* Header Profile */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-inner mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitial()
            )}
          </div>
          
          <div className="text-center w-full">
            {editingName ? (
              <div className="flex items-center gap-2 max-w-xs mx-auto">
                <Input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="font-bold text-center"
                  autoFocus
                />
                <Button size="icon" onClick={handleSaveName}><Check className="h-4 w-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setEditingName(true)}>
                <h2 className="text-2xl font-black text-slate-800">
                  {profile?.display_name || profile?.username || "Usuario"}
                </h2>
                <Pencil className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            )}
            
            <div className="mt-4 flex flex-col items-center gap-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Miembro desde {new Date(profile?.created_at || Date.now()).getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Estadísticas de Juego</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="bg-blue-50 p-2 rounded-xl mb-2"><Activity className="h-5 w-5 text-blue-500" /></div>
              <span className="text-2xl font-black text-slate-800">{stats.played}</span>
              <span className="text-xs font-medium text-slate-500 uppercase">Partidas</span>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="bg-amber-50 p-2 rounded-xl mb-2"><Trophy className="h-5 w-5 text-amber-500" /></div>
              <span className="text-2xl font-black text-slate-800">{stats.won}</span>
              <span className="text-xs font-medium text-slate-500 uppercase">Victorias</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="bg-emerald-50 p-2 rounded-xl mb-2"><Medal className="h-5 w-5 text-emerald-500" /></div>
              <span className="text-2xl font-black text-slate-800">{stats.winRate}%</span>
              <span className="text-xs font-medium text-slate-500 uppercase">Win Rate</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="bg-rose-50 p-2 rounded-xl mb-2"><Activity className="h-5 w-5 text-rose-500" /></div>
              <span className="text-2xl font-black text-slate-800">{stats.currentStreak}</span>
              <span className="text-xs font-medium text-slate-500 uppercase">Racha Actual</span>
            </div>
          </div>
        </div>

        {/* Favorite */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Juego Más Jugado</p>
          <p className="font-bold text-slate-800 text-lg truncate">{stats.favoriteGame}</p>
        </div>

        {/* Logout */}
        <Button variant="destructive" className="w-full h-12 rounded-2xl font-bold" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-2" /> Cerrar Sesión
        </Button>

      </div>
    </AppLayout>
  );
}
