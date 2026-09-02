import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ??? Groups ??????????????????????????????????????????????????????????????????

export const listGroups = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ owner_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("groups")
      .select("id, name, created_at, group_members(id, name, player_id, players(id, name))")
      .eq("owner_id", data.owner_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createGroup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      owner_id: z.string().uuid(),
      name: z.string().trim().min(1).max(40),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("groups")
      .insert({ owner_id: data.owner_id, name: data.name })
      .select("id, name, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteGroup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addGroupMember = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      group_id: z.string().uuid(),
      player_id: z.string().uuid().optional(),
      name: z.string().trim().min(1).max(40).optional(),
    }).refine(d => d.player_id || d.name, {
      message: "Se requiere player_id o name",
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: data.group_id,
        player_id: data.player_id ?? null,
        name: data.name ?? null,
      })
      .select("id, name, player_id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const removeGroupMember = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("group_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
