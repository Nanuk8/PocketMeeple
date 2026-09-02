export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      match_scores: {
        Row: {
          created_at: string;
          id: string;
          is_winner: boolean;
          match_id: string;
          player_id: string;
          score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_winner?: boolean;
          match_id: string;
          player_id: string;
          score: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_winner?: boolean;
          match_id?: string;
          player_id?: string;
          score?: number;
        };
        Relationships: [
          {
            foreignKeyName: "match_scores_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_scores_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "player_rankings";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "match_scores_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          created_at: string;
          date: string;
          game_modifiers: Json;
          game_name: string;
          id: string;
          is_coop: boolean;
          rounds: Json | null;
          winner_id: string | null;
        };
        Insert: {
          created_at?: string;
          date?: string;
          game_modifiers?: Json;
          game_name: string;
          id?: string;
          is_coop?: boolean;
          rounds?: Json | null;
          winner_id?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          game_modifiers?: Json;
          game_name?: string;
          id?: string;
          is_coop?: boolean;
          rounds?: Json | null;
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "player_rankings";
            referencedColumns: ["player_id"];
          },
          {
            foreignKeyName: "matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      paused_matches: {
        Row: {
          created_at: string;
          game_id: string;
          id: string;
          players: Json;
          state: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          id?: string;
          players?: Json;
          state: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          id?: string;
          players?: Json;
          state?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          created_at: string;
          id: string;
          is_favorite: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_favorite?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_favorite?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_games: {
        Row: {
          id: string;
          user_id: string;
          bgg_id: string;
          name: string;
          image_url: string | null;
          year: number | null;
          min_players: number | null;
          max_players: number | null;
          is_curated: boolean;
          added_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bgg_id: string;
          name: string;
          image_url?: string | null;
          year?: number | null;
          min_players?: number | null;
          max_players?: number | null;
          is_curated?: boolean;
          added_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bgg_id?: string;
          name?: string;
          image_url?: string | null;
          year?: number | null;
          min_players?: number | null;
          max_players?: number | null;
          is_curated?: boolean;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          player_id: string | null;
          name: string | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          player_id?: string | null;
          name?: string | null;
          added_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          player_id?: string | null;
          name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          }
        ];
      };
      game_templates: {
        Row: {
          id: string;
          user_id: string;
          bgg_id: string | null;
          name: string;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bgg_id?: string | null;
          name: string;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bgg_id?: string | null;
          name?: string;
          config?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          tier: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon?: string;
          tier?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          tier?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      player_rankings: {
        Row: {
          game_name: string | null;
          games_played: number | null;
          games_won: number | null;
          max_score: number | null;
          player_id: string | null;
          player_name: string | null;
          win_rate: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
