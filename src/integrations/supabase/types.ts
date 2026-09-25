export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      avatar_items: {
        Row: {
          id: string
          name: string
          required_level: number
          slot: Database["public"]["Enums"]["avatar_slot"]
          sort_order: number
          svg_data: string
        }
        Insert: {
          id?: string
          name: string
          required_level?: number
          slot: Database["public"]["Enums"]["avatar_slot"]
          sort_order?: number
          svg_data: string
        }
        Update: {
          id?: string
          name?: string
          required_level?: number
          slot?: Database["public"]["Enums"]["avatar_slot"]
          sort_order?: number
          svg_data?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          category: Database["public"]["Enums"]["org_category"]
          created_at: string
          created_by: string | null
          description: string
          id: string
          logo_svg: string
          name: string
          status: Database["public"]["Enums"]["org_status"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["org_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          logo_svg?: string
          name: string
          status?: Database["public"]["Enums"]["org_status"]
        }
        Update: {
          category?: Database["public"]["Enums"]["org_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          logo_svg?: string
          name?: string
          status?: Database["public"]["Enums"]["org_status"]
        }
        Relationships: []
      }
      places: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          student_only: boolean
          xp_value: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          student_only?: boolean
          xp_value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          student_only?: boolean
          xp_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_config: Json
          created_at: string
          display_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar_config?: Json
          created_at?: string
          display_name?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar_config?: Json
          created_at?: string
          display_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      season_teams: {
        Row: {
          created_at: string
          id: string
          org_id: string
          season_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          season_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          season_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          leaderboard_freeze_at: string
          name: string
          starts_at: string
          team_lock_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          leaderboard_freeze_at: string
          name: string
          starts_at: string
          team_lock_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          leaderboard_freeze_at?: string
          name?: string
          starts_at?: string
          team_lock_at?: string
        }
        Relationships: []
      }
      xp_ledger: {
        Row: {
          amount: number
          counts_for_competition: boolean
          created_at: string
          id: string
          reason: string
          season_id: string | null
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          counts_for_competition?: boolean
          created_at?: string
          id?: string
          reason: string
          season_id?: string | null
          source_id?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          counts_for_competition?: boolean
          created_at?: string
          id?: string
          reason?: string
          season_id?: string | null
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      am_i_admin: { Args: never; Returns: boolean }
      org_members: {
        Args: { p_org: string }
        Returns: {
          created_at: string
          display_name: string
          membership_id: string
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }[]
      }
      org_top_contributors: {
        Args: { p_org: string; p_season: string }
        Returns: {
          display_name: string
          score: number
          user_id: string
        }[]
      }
      season_org_scores: {
        Args: { p_season: string }
        Returns: {
          category: Database["public"]["Enums"]["org_category"]
          logo_svg: string
          member_count: number
          name: string
          org_id: string
          qualified: boolean
          rank: number
          score: number
          team_size: number
        }[]
      }
    }
    Enums: {
      app_role: "student" | "visitor"
      avatar_slot: "body" | "hair" | "outfit" | "accessory" | "background"
      membership_role: "member" | "leader"
      membership_status: "pending" | "approved"
      org_category:
        | "club"
        | "fraternity"
        | "sorority"
        | "cultural"
        | "sports"
        | "other"
      org_status: "pending" | "approved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "visitor"],
      avatar_slot: ["body", "hair", "outfit", "accessory", "background"],
      membership_role: ["member", "leader"],
      membership_status: ["pending", "approved"],
      org_category: [
        "club",
        "fraternity",
        "sorority",
        "cultural",
        "sports",
        "other",
      ],
      org_status: ["pending", "approved"],
    },
  },
} as const
