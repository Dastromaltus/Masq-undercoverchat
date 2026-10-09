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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          justification: string | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          target?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          source_message_id: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          source_message_id?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          source_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_settings: {
        Row: {
          accepting: boolean
          allow_reveal_requests: boolean
          updated_at: string
          user_id: string
          welcome_question: string
        }
        Insert: {
          accepting?: boolean
          allow_reveal_requests?: boolean
          updated_at?: string
          user_id: string
          welcome_question?: string
        }
        Update: {
          accepting?: boolean
          allow_reveal_requests?: boolean
          updated_at?: string
          user_id?: string
          welcome_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          message_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          message_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_sender_links: {
        Row: {
          created_at: string
          message_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_sender_links_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          allow_reveal: boolean
          archived: boolean
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["content_status"]
        }
        Insert: {
          allow_reveal?: boolean
          archived?: boolean
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["content_status"]
        }
        Update: {
          allow_reveal?: boolean
          archived?: boolean
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          status?: Database["public"]["Enums"]["content_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          message_id: string | null
          moderator_id: string
          note: string | null
          report_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          message_id?: string | null
          moderator_id: string
          note?: string | null
          report_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          message_id?: string | null
          moderator_id?: string
          note?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_declared_at: string
          age_verification_status: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          instagram_url: string | null
          suspended: boolean
          username: string
        }
        Insert: {
          age_declared_at: string
          age_verification_status?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          instagram_url?: string | null
          suspended?: boolean
          username: string
        }
        Update: {
          age_declared_at?: string
          age_verification_status?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instagram_url?: string | null
          suspended?: boolean
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          message_id: string | null
          reason: string
          reporter_id: string
          status: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reporter_id: string
          status?: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_actions: {
        Args: never
        Returns: {
          action: string
          created_at: string
          id: string
          note: string
          report_id: string
        }[]
      }
      admin_list_pending: {
        Args: never
        Returns: {
          body: string
          created_at: string
          id: string
        }[]
      }
      admin_list_reports: {
        Args: { _status?: string }
        Returns: {
          created_at: string
          details: string
          id: string
          message_body: string
          message_id: string
          message_status: Database["public"]["Enums"]["content_status"]
          reason: string
          status: string
        }[]
      }
      admin_resolve_report: {
        Args: { _action: string; _note: string; _report_id: string }
        Returns: undefined
      }
      admin_set_message_status: {
        Args: {
          _message_id: string
          _note: string
          _status: Database["public"]["Enums"]["content_status"]
        }
        Returns: undefined
      }
      block_message_sender: {
        Args: { _message_id: string }
        Returns: undefined
      }
      cfg_int: { Args: { _default: number; _key: string }; Returns: number }
      export_my_data: { Args: never; Returns: Json }
      get_public_profile: {
        Args: { _username: string }
        Returns: {
          accepting: boolean
          avatar_url: string
          bio: string
          display_name: string
          username: string
          welcome_question: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purge_my_data: { Args: never; Returns: undefined }
      report_message: {
        Args: { _details: string; _message_id: string; _reason: string }
        Returns: undefined
      }
      send_message: {
        Args: { _allow_reveal?: boolean; _body: string; _username: string }
        Returns: string
      }
      username_available: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_status: "published" | "pending" | "hidden" | "deleted"
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
      app_role: ["admin", "moderator", "user"],
      content_status: ["published", "pending", "hidden", "deleted"],
    },
  },
} as const
