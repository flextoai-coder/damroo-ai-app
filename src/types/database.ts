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
      brand_kits: {
        Row: {
          accent_color: string | null
          brand_keywords: string | null
          created_at: string
          font_style: string | null
          logo_storage_path: string | null
          primary_color: string | null
          secondary_color: string | null
          style_notes: string | null
          tone_of_voice: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          brand_keywords?: string | null
          created_at?: string
          font_style?: string | null
          logo_storage_path?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          style_notes?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          brand_keywords?: string | null
          created_at?: string
          font_style?: string | null
          logo_storage_path?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          style_notes?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      captions: {
        Row: {
          created_at: string
          generation_id: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "captions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          generation_id: string | null
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Insert: {
          attachments?: Json
          content?: string
          conversation_id: string
          created_at?: string
          generation_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          generation_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta: number
          generation_id: string | null
          id: string
          reason: Database["public"]["Enums"]["credit_reason"]
          subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          generation_id?: string | null
          id?: string
          reason: Database["public"]["Enums"]["credit_reason"]
          subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          generation_id?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["credit_reason"]
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_assets: {
        Row: {
          created_at: string
          generation_id: string
          height: number | null
          id: string
          public_url: string | null
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          generation_id: string
          height?: number | null
          id?: string
          public_url?: string | null
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          generation_id?: string
          height?: number | null
          id?: string
          public_url?: string | null
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_assets_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          aspect_ratio: string
          conversation_id: string | null
          created_at: string
          credits_charged: number
          enhanced_prompt: string | null
          error_message: string | null
          id: string
          image_count: number
          prompt: string
          quality: Database["public"]["Enums"]["image_quality"]
          reference_image_paths: string[]
          status: Database["public"]["Enums"]["generation_status"]
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          conversation_id?: string | null
          created_at?: string
          credits_charged?: number
          enhanced_prompt?: string | null
          error_message?: string | null
          id?: string
          image_count?: number
          prompt: string
          quality?: Database["public"]["Enums"]["image_quality"]
          reference_image_paths?: string[]
          status?: Database["public"]["Enums"]["generation_status"]
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          conversation_id?: string | null
          created_at?: string
          credits_charged?: number
          enhanced_prompt?: string | null
          error_message?: string | null
          id?: string
          image_count?: number
          prompt?: string
          quality?: Database["public"]["Enums"]["image_quality"]
          reference_image_paths?: string[]
          status?: Database["public"]["Enums"]["generation_status"]
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_details: string | null
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          instagram_handle: string | null
          linkedin_profile: string | null
          onboarding_completed: boolean
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_details?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          instagram_handle?: string | null
          linkedin_profile?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_details?: string | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          linkedin_profile?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_total: number
          current_period_end: string
          current_period_start: string
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id: string | null
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining: number
          credits_total: number
          current_period_end: string
          current_period_start: string
          id?: string
          plan: Database["public"]["Enums"]["plan_tier"]
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_total?: number
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_subscription_id?: string | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          base_prompt: string
          category: Database["public"]["Enums"]["template_category"]
          created_at: string
          default_aspect_ratio: string
          default_quality: Database["public"]["Enums"]["image_quality"]
          id: string
          industry: string
          is_published: boolean
          preview_storage_path: string
          sort_order: number
          source: Database["public"]["Enums"]["template_source"]
          title: string
          updated_at: string
        }
        Insert: {
          base_prompt: string
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string
          default_aspect_ratio?: string
          default_quality?: Database["public"]["Enums"]["image_quality"]
          id?: string
          industry: string
          is_published?: boolean
          preview_storage_path: string
          sort_order?: number
          source?: Database["public"]["Enums"]["template_source"]
          title: string
          updated_at?: string
        }
        Update: {
          base_prompt?: string
          category?: Database["public"]["Enums"]["template_category"]
          created_at?: string
          default_aspect_ratio?: string
          default_quality?: Database["public"]["Enums"]["image_quality"]
          id?: string
          industry?: string
          is_published?: boolean
          preview_storage_path?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["template_source"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      owns_generation: { Args: { p_generation_id: string }; Returns: boolean }
    }
    Enums: {
      chat_role: "user" | "assistant" | "system"
      credit_reason: "plan_grant" | "generation" | "adjustment" | "expiry"
      generation_status: "pending" | "processing" | "completed" | "failed"
      image_quality: "2K" | "4K"
      payment_provider: "razorpay" | "apple_iap"
      plan_tier: "starter" | "growth" | "scale"
      subscription_status: "active" | "expired" | "cancelled" | "past_due"
      template_category: "festival" | "offers" | "products" | "video"
      template_source: "official" | "creator"
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
      chat_role: ["user", "assistant", "system"],
      credit_reason: ["plan_grant", "generation", "adjustment", "expiry"],
      generation_status: ["pending", "processing", "completed", "failed"],
      image_quality: ["2K", "4K"],
      payment_provider: ["razorpay", "apple_iap"],
      plan_tier: ["starter", "growth", "scale"],
      subscription_status: ["active", "expired", "cancelled", "past_due"],
      template_category: ["festival", "offers", "products", "video"],
      template_source: ["official", "creator"],
    },
  },
} as const
