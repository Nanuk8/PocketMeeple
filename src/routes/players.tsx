import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listPlayers,
  createPlayer,
  deletePlayer,
  togglePlayerFavorite,
} from "@/lib/matches.functions";
import {
  listGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
} from "@/lib/groups.functions";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  UserPlus,
  Star,
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/games/types";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Jugadores y Grupos · PocketMeeple" }] }),
  component: PlayersPage,
});

// ??? Types ???????????????????????????????????????????????????????????????????

type GroupMember = {
  id: string;
  name: string | null;
  player_id: string | null;
  players?: { id: string; name: string } | null;
};

type Group = {
  id: string;
  name: string;
  created_at: string;
  group_members: GroupMember[];
};

// ??? Players Tab ?????????????????????????????????????????????????????????????

function PlayersTab() {
  const fetchAll = useServerFn(listPlayers);
  const add = useServerFn(createPlayer);
  const del = useServerFn(deletePlayer);
  const toggleFav = useServerFn(togglePlayerFavorite);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => {
    fetchAll()
      .then((d) => setPlayers(d as Player[]))
      .catch((e: unknown) => {
        setPlayers([]);
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg.length > 120 ? msg.slice(0, 120) + "?" : msg);
      });
  };
  useEffect(reload, [fetchAll]);

  const handleAdd = async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    try {
      await add({ data: { name: n } });
      setName("");
      reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("Ese nombre ya existe");
      } else {
        toast.error(msg.length > 160 ? msg.slice(0, 160) + "?" : msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("?Eliminar jugador? Sus puntajes hist?ricos tambi?n se borrar?n.")) return;
    try {
      await del({ data: { id } });
      reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.length > 120 ? msg.slice(0, 120) + "?" : msg);
    }
  };

  const handleToggleFav = async (p: Player) => {
    const next = !p.is_favorite;
    setPlayers((cur) =>
      cur ? cur.map((x) => (x.id === p.id ? { ...x, is_favorite: next } : x)) : cur,
    );
    try {
      await toggleFav({ data: { id: p.id, is_favorite: next } });
    } catch {
      toast.error("No se pudo actualizar");
      reload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nombre del jugador?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="bg-white"
          />
          <Button onClick={handleAdd} disabled={busy || !name.trim()} size="icon">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {players === null && <p className="text-slate-500 text-sm">Cargando?</p>}
      {players && players.length === 0 && (
        <p className="text-slate-500 text-sm">A?n no hay jugadores. A?ade uno arriba.</p>
      )}
      {players && players.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <ul>
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between bg-white border-b border-slate-100 last:border-b-0 py-3 px-4"
              >
                <span className="font-medium text-slate-800 truncate">{p.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleToggleFav(p)}
                    aria-label={p.is_favorite ? "Quitar favorito" : "Marcar favorito"}
                  >
                    <Star
                      className={
                        p.is_favorite
                          ? "h-4 w-4 fill-amber-400 text-amber-500"
                          : "h-4 w-4 text-slate-400"
                      }
                    />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ??? Groups Tab ???????????????????????????????????????????????????????????????

function GroupsTab() {
  const { user } = useAuth();
  const fetchGroups = useServerFn(listGroups);
  const addGroup = useServerFn(createGroup);
  const delGroup = useServerFn(deleteGroup);
  const addMember = useServerFn(addGroupMember);
  const removeMember = useServerFn(removeGroupMember);
  const fetchPlayers = useServerFn(listPlayers);

  const [groups, setGroups] = useState<Group[] | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<Record<string, string>>({});

  const reload = () => {
    if (!user) return;
    fetchGroups({ data: { owner_id: user.id } })
      .then((d) => setGroups(d as Group[]))
      .catch(() => {
        setGroups([]);
        toast.error("No se pudieron cargar los grupos");
      });
  };

  useEffect(() => {
    reload();
    fetchPlayers()
      .then((d) => setPlayers(d as Player[]))
      .catch(() => {});
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    setBusy(true);
    try {
      await addGroup({ data: { owner_id: user.id, name: newGroupName.trim() } });
      setNewGroupName("");
      reload();
      toast.success("Grupo creado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear grupo");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("?Eliminar grupo?")) return;
    try {
      await delGroup({ data: { id } });
      reload();
    } catch {
      toast.error("Error al eliminar grupo");
    }
  };

  const handleAddMember = async (groupId: string, playerId?: string, name?: string) => {
    try {
      await addMember({ data: { group_id: groupId, player_id: playerId, name } });
      setMemberName((prev) => ({ ...prev, [groupId]: "" }));
      reload();
    } catch {
      toast.error("Error al agregar miembro");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember({ data: { id: memberId } });
      reload();
    } catch {
      toast.error("Error al quitar miembro");
    }
  };

  return (
    <div className="space-y-4">
      {/* Create group */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Nuevo grupo
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Nombre del grupo?"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            className="bg-white"
          />
          <Button
            onClick={handleCreateGroup}
            disabled={busy || !newGroupName.trim()}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {groups === null && <p className="text-slate-500 text-sm">Cargando?</p>}
      {groups && groups.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Sin grupos a?n</p>
          <p className="text-sm text-slate-500 mt-1">
            Crea un grupo para guardar tus equipos favoritos.
          </p>
        </div>
      )}

      {groups && groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((g) => {
            const isExpanded = expandedGroup === g.id;
            const memberCount = g.group_members?.length ?? 0;
            return (
              <div
                key={g.id}
                className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Group header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{g.name}</p>
                      <p className="text-xs text-slate-500">{memberCount} miembro{memberCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(g.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Members list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {g.group_members && g.group_members.length > 0 && (
                      <ul className="space-y-1">
                        {g.group_members.map((m) => {
                          const displayName = m.players?.name ?? m.name ?? "?";
                          return (
                            <li
                              key={m.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                {displayName}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleRemoveMember(m.id)}
                              >
                                <X className="h-3.5 w-3.5 text-slate-400" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Add member: select from existing players */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Agregar jugador
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {players
                          .filter(
                            (p) =>
                              !g.group_members?.some(
                                (m) => m.player_id === p.id || m.name === p.name,
                              ),
                          )
                          .slice(0, 8)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleAddMember(g.id, p.id)}
                              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-primary/10 hover:text-primary font-medium text-slate-600 transition-colors"
                            >
                              + {p.name}
                            </button>
                          ))}
                      </div>
                      {/* Or add by name */}
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Nombre personalizado?"
                          value={memberName[g.id] ?? ""}
                          onChange={(e) =>
                            setMemberName((prev) => ({ ...prev, [g.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && memberName[g.id]?.trim()) {
                              handleAddMember(g.id, undefined, memberName[g.id].trim());
                            }
                          }}
                          className="bg-white h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={!memberName[g.id]?.trim()}
                          onClick={() => {
                            if (memberName[g.id]?.trim()) {
                              handleAddMember(g.id, undefined, memberName[g.id].trim());
                            }
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ??? Page ?????????????????????????????????????????????????????????????????????

function PlayersPage() {
  return (
    <AppLayout title="Jugadores y Grupos">
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-200/50 p-1 rounded-2xl">
          <TabsTrigger
            value="players"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Grupos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="players" className="focus-visible:outline-none">
          <PlayersTab />
        </TabsContent>
        <TabsContent value="groups" className="focus-visible:outline-none">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
