/**
 * Vazifalar — baza tiplari
 *
 * Bu fayl `supabase gen types typescript` natijasining aynan shakliga
 * mos qilib yozilgan. Sxemani o'zgartirgandan keyin qayta generatsiya qiling:
 *
 *   supabase gen types typescript --local > types/database.ts
 *   # yoki masofaviy loyihadan:
 *   supabase gen types typescript --project-id <PROJECT_REF> > types/database.ts
 *
 * Ilova uchun qo'shimcha yordamchi tiplar (TaskStatus, ReportResult va h.k.)
 * `types/vazifalar.ts` faylida — u qayta generatsiyada o'chib ketmaydi.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "labels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "pomodoro_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "sections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          {
            foreignKeyName: "task_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          {
            foreignKeyName: "task_labels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          parent_id: string | null
          priority: number
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
          parent_id?: string | null
          priority?: number
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
          parent_id?: string | null
          priority?: number
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
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_task: {
        Args: {
          task_id: string
          include_subtasks?: boolean
        }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          parent_id: string | null
          priority: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
      }
      folder_health: {
        Args: {
          p_open: number
          p_completed: number
          p_overdue: number
          p_last_activity: string
        }
        Returns: Json
      }
      get_report: {
        Args: {
          p_from: string
          p_to: string
        }
        Returns: Json
      }
      move_back: {
        Args: {
          task_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          parent_id: string | null
          priority: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
      }
      next_occurrence: {
        Args: {
          p_base: string
          p_recurrence: string
          p_today: string
        }
        Returns: string
      }
      start_task: {
        Args: {
          task_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          parent_id: string | null
          priority: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
      }
      uncomplete_task: {
        Args: {
          task_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          folder_id: string
          id: string
          parent_id: string | null
          priority: number
          recurrence: string | null
          section_id: string | null
          sort_order: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
      }
      user_timezone: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

export type Functions<T extends keyof PublicSchema['Functions']> =
  PublicSchema['Functions'][T]
