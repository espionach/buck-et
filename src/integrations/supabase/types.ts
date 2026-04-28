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
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          parent_comment_id: string | null
          sidequest_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          sidequest_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          sidequest_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: string
          to_user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      group_invitations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invited_by: string
          invited_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invited_by: string
          invited_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_notification_mutes: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_notification_mutes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          color: string
          created_at: string
          description: string | null
          emoji: string
          icon_color: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          icon_color?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          icon_color?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          notify_comment_reply: boolean
          notify_friend_accepted: boolean
          notify_friend_new_quest: boolean
          notify_group_invitation: boolean
          notify_new_contribution: boolean
          notify_new_quest_from_friend: boolean
          notify_new_quest_in_group: boolean
          notify_ownership_transfer: boolean
          notify_photo_added: boolean
          notify_quest_canceled: boolean
          notify_quest_join: boolean
          notify_quest_reminder: boolean
          notify_quest_updated: boolean
          notify_removed_from_group_or_quest: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_comment_reply?: boolean
          notify_friend_accepted?: boolean
          notify_friend_new_quest?: boolean
          notify_group_invitation?: boolean
          notify_new_contribution?: boolean
          notify_new_quest_from_friend?: boolean
          notify_new_quest_in_group?: boolean
          notify_ownership_transfer?: boolean
          notify_photo_added?: boolean
          notify_quest_canceled?: boolean
          notify_quest_join?: boolean
          notify_quest_reminder?: boolean
          notify_quest_updated?: boolean
          notify_removed_from_group_or_quest?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_comment_reply?: boolean
          notify_friend_accepted?: boolean
          notify_friend_new_quest?: boolean
          notify_group_invitation?: boolean
          notify_new_contribution?: boolean
          notify_new_quest_from_friend?: boolean
          notify_new_quest_in_group?: boolean
          notify_ownership_transfer?: boolean
          notify_photo_added?: boolean
          notify_quest_canceled?: boolean
          notify_quest_join?: boolean
          notify_quest_reminder?: boolean
          notify_quest_updated?: boolean
          notify_removed_from_group_or_quest?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          comment_id: string | null
          created_at: string
          entity_id: string | null
          from_user_id: string | null
          group_id: string | null
          group_name: string | null
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          entity_id?: string | null
          from_user_id?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          entity_id?: string | null
          from_user_id?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarded_at: string | null
          onboarding_step: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded_at?: string | null
          onboarding_step?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded_at?: string | null
          onboarding_step?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      quest_reminders_sent: {
        Row: {
          id: string
          kind: string
          sent_at: string
          sidequest_id: string
          user_id: string
        }
        Insert: {
          id?: string
          kind: string
          sent_at?: string
          sidequest_id: string
          user_id: string
        }
        Update: {
          id?: string
          kind?: string
          sent_at?: string
          sidequest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_reminders_sent_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequest_completions: {
        Row: {
          completed_at: string
          id: string
          sidequest_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          sidequest_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          sidequest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidequest_completions_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequest_participants: {
        Row: {
          created_at: string
          id: string
          sidequest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sidequest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sidequest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidequest_participants_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequest_volunteers: {
        Row: {
          created_at: string
          id: string
          role: string
          sidequest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          sidequest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          sidequest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidequest_volunteers_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequests: {
        Row: {
          completed_at: string | null
          contribution_roles: string[]
          created_at: string
          created_by: string
          description: string | null
          group_id: string | null
          id: string
          is_friends_only: boolean
          links: string[] | null
          logistics_carpool_slots: number | null
          logistics_custom_notes: string | null
          logistics_date: string | null
          logistics_location: string | null
          logistics_meetup_spot: string | null
          logistics_time: string | null
          logistics_transportation: string | null
          notes: string | null
          photos: string[] | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          contribution_roles?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_friends_only?: boolean
          links?: string[] | null
          logistics_carpool_slots?: number | null
          logistics_custom_notes?: string | null
          logistics_date?: string | null
          logistics_location?: string | null
          logistics_meetup_spot?: string | null
          logistics_time?: string | null
          logistics_transportation?: string | null
          notes?: string | null
          photos?: string[] | null
          title: string
        }
        Update: {
          completed_at?: string | null
          contribution_roles?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_friends_only?: boolean
          links?: string[] | null
          logistics_carpool_slots?: number | null
          logistics_custom_notes?: string | null
          logistics_date?: string | null
          logistics_location?: string | null
          logistics_meetup_spot?: string | null
          logistics_time?: string | null
          logistics_transportation?: string | null
          notes?: string | null
          photos?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidequests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_requests: {
        Row: {
          created_at: string
          entity_id: string
          from_user_id: string
          id: string
          status: string
          to_user_id: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          from_user_id: string
          id?: string
          status?: string
          to_user_id: string
          type: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          from_user_id?: string
          id?: string
          status?: string
          to_user_id?: string
          type?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
          target_id?: string | null
          target_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      can_view_sidequest: {
        Args: { _sidequest_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_friend_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_sidequest_owner: {
        Args: { _sidequest_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
