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
      folders: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          is_inbox: boolean
          is_projects: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_inbox?: boolean
          is_projects?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_inbox?: boolean
          is_projects?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed: boolean
          ended_at: string | null
          id: string
          kind: string
          planned_minutes: number
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          ended_at?: string | null
          id?: string
          kind: string
          planned_minutes: number
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          ended_at?: string | null
          id?: string
          kind?: string
          planned_minutes?: number
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_task_fk"
            columns: ["task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_start_break: boolean
          avatar_url: string | null
          created_at: string
          daily_goal: number
          days_off: number[]
          evening_review_time: string
          full_name: string | null
          id: string
          pomodoro_cycles_before_long: number
          pomodoro_focus_min: number
          pomodoro_long_break_min: number
          pomodoro_short_break_min: number
          theme: string
          timezone: string
        }
        Insert: {
          auto_start_break?: boolean
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          days_off?: number[]
          evening_review_time?: string
          full_name?: string | null
          id: string
          pomodoro_cycles_before_long?: number
          pomodoro_focus_min?: number
          pomodoro_long_break_min?: number
          pomodoro_short_break_min?: number
          theme?: string
          timezone?: string
        }
        Update: {
          auto_start_break?: boolean
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          days_off?: number[]
          evening_review_time?: string
          full_name?: string | null
          id?: string
          pomodoro_cycles_before_long?: number
          pomodoro_focus_min?: number
          pomodoro_long_break_min?: number
          pomodoro_short_break_min?: number
          theme?: string
          timezone?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          is_collapsed: boolean
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          is_collapsed?: boolean
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          is_collapsed?: boolean
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_folder_fk"
            columns: ["folder_id", "user_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      task_events: {
        Row: {
          created_at: string
          event: string
          folder_id: string | null
          id: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          folder_id?: string | null
          id?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          folder_id?: string | null
          id?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_folder_fk"
            columns: ["folder_id", "user_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "task_events_task_fk"
            columns: ["task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      task_labels: {
        Row: {
          created_at: string
          label_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          label_id: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          label_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_labels_label_fk"
            columns: ["label_id", "user_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "task_labels_task_fk"
            columns: ["task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      task_progress_log: {
        Row: {
          created_at: string
          id: string
          oldingi: number
          task_id: string
          user_id: string
          yangi: number
        }
        Insert: {
          created_at?: string
          id?: string
          oldingi: number
          task_id: string
          user_id: string
          yangi: number
        }
        Update: {
          created_at?: string
          id?: string
          oldingi?: number
          task_id?: string
          user_id?: string
          yangi?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          notified_at: string | null
          parent_id: string | null
          priority: number
          progress: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          folder_id: string
          id?: string
          notified_at?: string | null
          parent_id?: string | null
          priority?: number
          progress?: number
          recurrence?: string | null
          section_id?: string | null
          sort_order?: number
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          folder_id?: string
          id?: string
          notified_at?: string | null
          parent_id?: string | null
          priority?: number
          progress?: number
          recurrence?: string | null
          section_id?: string | null
          sort_order?: number
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_folder_fk"
            columns: ["folder_id", "user_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_parent_fk"
            columns: ["parent_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_section_fk"
            columns: ["section_id", "folder_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id", "folder_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_task: {
        Args: { include_subtasks?: boolean; task_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          notified_at: string | null
          parent_id: string | null
          priority: number
          progress: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      eslatma_yuborildi: { Args: { vazifalar: string[] }; Returns: undefined }
      events_suppressed: { Args: never; Returns: boolean }
      folder_health: {
        Args: {
          p_completed: number
          p_last_activity: string
          p_open: number
          p_overdue: number
        }
        Returns: Json
      }
      get_report: { Args: { p_from: string; p_to: string }; Returns: Json }
      kutilayotgan_eslatmalar: {
        Args: never
        Returns: {
          auth: string
          endpoint: string
          p256dh: string
          sarlavha: string
          task_id: string
          user_id: string
        }[]
      }
      local_date: { Args: { p_ts: string; p_tz: string }; Returns: string }
      move_back: {
        Args: { task_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          notified_at: string | null
          parent_id: string | null
          priority: number
          progress: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      next_occurrence: {
        Args: { p_base: string; p_recurrence: string; p_today: string }
        Returns: string
      }
      start_task: {
        Args: { task_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          notified_at: string | null
          parent_id: string | null
          priority: number
          progress: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      uncomplete_task: {
        Args: { task_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          notified_at: string | null
          parent_id: string | null
          priority: number
          progress: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_timezone: { Args: { p_user_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
