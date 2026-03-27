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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      exercise_notes: {
        Row: {
          content: string
          exercise_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          exercise_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          exercise_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_notes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"] | null
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["exercise_category"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_memberships: {
        Row: {
          gym_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["gym_membership_role"]
          user_id: string
        }
        Insert: {
          gym_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["gym_membership_role"]
          user_id: string
        }
        Update: {
          gym_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["gym_membership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_memberships_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_subscriptions: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          max_athletes: number
          max_coaches: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          max_athletes?: number
          max_coaches?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          max_athletes?: number
          max_coaches?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscriptions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          invite_token: string
          logo_url: string | null
          name: string
          owner_id: string
          temp_code_expires: string | null
          temp_invite_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_token?: string
          logo_url?: string | null
          name: string
          owner_id: string
          temp_code_expires?: string | null
          temp_invite_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_token?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          temp_code_expires?: string | null
          temp_invite_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gyms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maxes: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          recorded_at: string
          source: Database["public"]["Enums"]["max_source"]
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
          source?: Database["public"]["Enums"]["max_source"]
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          source?: Database["public"]["Enums"]["max_source"]
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "maxes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          allow_coach_edit: boolean
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          rounding_increment_kg: number
          unit_preference: Database["public"]["Enums"]["unit_preference"]
          updated_at: string
        }
        Insert: {
          allow_coach_edit?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email: string
          id: string
          rounding_increment_kg?: number
          unit_preference?: Database["public"]["Enums"]["unit_preference"]
          updated_at?: string
        }
        Update: {
          allow_coach_edit?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          rounding_increment_kg?: number
          unit_preference?: Database["public"]["Enums"]["unit_preference"]
          updated_at?: string
        }
        Relationships: []
      }
      workout_items: {
        Row: {
          content: string | null
          exercise_id: string | null
          id: string
          item_type: Database["public"]["Enums"]["workout_item_type"]
          max_type_reference: string | null
          notes: string | null
          order_index: number
          percentage: number | null
          reps: number | null
          section_id: string
          sets: number | null
          weight_kg: number | null
        }
        Insert: {
          content?: string | null
          exercise_id?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["workout_item_type"]
          max_type_reference?: string | null
          notes?: string | null
          order_index: number
          percentage?: number | null
          reps?: number | null
          section_id: string
          sets?: number | null
          weight_kg?: number | null
        }
        Update: {
          content?: string | null
          exercise_id?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["workout_item_type"]
          max_type_reference?: string | null
          notes?: string | null
          order_index?: number
          percentage?: number | null
          reps?: number | null
          section_id?: string
          sets?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "workout_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sections: {
        Row: {
          id: string
          order_index: number
          title: string
          workout_id: string
        }
        Insert: {
          id?: string
          order_index: number
          title: string
          workout_id: string
        }
        Update: {
          id?: string
          order_index?: number
          title?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sections_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          created_by: string
          gym_id: string
          id: string
          notes: string | null
          published: boolean
          scheduled_date: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          gym_id: string
          id?: string
          notes?: string | null
          published?: boolean
          scheduled_date: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          gym_id?: string
          id?: string
          notes?: string | null
          published?: boolean
          scheduled_date?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_temp_invite_code: { Args: { p_gym_id: string }; Returns: string }
      join_gym_by_temp_code: { Args: { p_code: string }; Returns: string }
      join_gym_by_token: { Args: { p_token: string }; Returns: string }
      leave_gym: { Args: { p_membership_id: string }; Returns: undefined }
      regenerate_invite_token: {
        Args: { p_gym_id: string }
        Returns: string
      }
      preview_gym_by_token: {
        Args: { p_token: string }
        Returns: { id: string; name: string; description: string | null; member_count: number }[]
      }
      preview_gym_by_temp_code: {
        Args: { p_code: string }
        Returns: { id: string; name: string; description: string | null; member_count: number }[]
      }
      update_member_role: {
        Args: {
          p_membership_id: string
          p_new_role: Database["public"]["Enums"]["gym_membership_role"]
        }
        Returns: undefined
      }
    }
    Enums: {
      exercise_category: "squat" | "press" | "pull" | "olympic" | "accessory"
      gym_membership_role: "athlete" | "coach" | "admin"
      max_source: "manual" | "workout_log" | "coach"
      subscription_plan: "free" | "trial" | "pro"
      subscription_status: "active" | "trial" | "trial_expired" | "cancelled"
      unit_preference: "kg" | "lbs"
      workout_item_type: "structured" | "free_text"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      exercise_category: ["squat", "press", "pull", "olympic", "accessory"],
      gym_membership_role: ["athlete", "coach", "admin"],
      max_source: ["manual", "workout_log", "coach"],
      subscription_plan: ["free", "trial", "pro"],
      subscription_status: ["active", "trial", "trial_expired", "cancelled"],
      unit_preference: ["kg", "lbs"],
      workout_item_type: ["structured", "free_text"],
    },
  },
} as const
