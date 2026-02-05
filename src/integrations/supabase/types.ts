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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          creditor_name: string
          current_installment: number | null
          description: string | null
          due_date: string | null
          id: string
          installment_amount: number | null
          is_installment: boolean
          notes: string | null
          paid_amount: number
          status: Database["public"]["Enums"]["debt_status"]
          total_amount: number
          total_installments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creditor_name: string
          current_installment?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          installment_amount?: number | null
          is_installment?: boolean
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["debt_status"]
          total_amount: number
          total_installments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creditor_name?: string
          current_installment?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          installment_amount?: number | null
          is_installment?: boolean
          notes?: string | null
          paid_amount?: number
          status?: Database["public"]["Enums"]["debt_status"]
          total_amount?: number
          total_installments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          emotion: Database["public"]["Enums"]["expense_emotion"] | null
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_installment: boolean
          notes: string | null
          source: Database["public"]["Enums"]["expense_source"]
          status: Database["public"]["Enums"]["expense_status"]
          total_installments: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          description: string
          emotion?: Database["public"]["Enums"]["expense_emotion"] | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean
          notes?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          status?: Database["public"]["Enums"]["expense_status"]
          total_installments?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          emotion?: Database["public"]["Enums"]["expense_emotion"] | null
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean
          notes?: string | null
          source?: Database["public"]["Enums"]["expense_source"]
          status?: Database["public"]["Enums"]["expense_status"]
          total_installments?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean
          notes: string | null
          type: Database["public"]["Enums"]["income_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          type?: Database["public"]["Enums"]["income_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          type?: Database["public"]["Enums"]["income_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_name: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_name?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_name?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          amount: number
          created_at: string
          debtor_name: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          received_at: string | null
          status: Database["public"]["Enums"]["receivable_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debtor_name: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debtor_name?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: Database["public"]["Enums"]["receivable_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      debt_status: "active" | "paid" | "cancelled"
      expense_emotion: "pilar" | "essencial" | "impulso"
      expense_source: "manual" | "whatsapp" | "integration"
      expense_status: "pending" | "confirmed" | "deleted"
      income_type: "salary" | "freelance" | "investment" | "gift" | "other"
      receivable_status: "pending" | "received" | "cancelled"
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
      debt_status: ["active", "paid", "cancelled"],
      expense_emotion: ["pilar", "essencial", "impulso"],
      expense_source: ["manual", "whatsapp", "integration"],
      expense_status: ["pending", "confirmed", "deleted"],
      income_type: ["salary", "freelance", "investment", "gift", "other"],
      receivable_status: ["pending", "received", "cancelled"],
    },
  },
} as const
