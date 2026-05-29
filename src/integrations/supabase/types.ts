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
      copilot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          code: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      demand_forecasts: {
        Row: {
          created_at: string
          customer_segment_id: string
          fiscal_period_id: string
          forecast_confidence: number
          forecast_units: number
          id: string
          memory_technology_id: string
          planning_version_id: string
          product_family_id: string
          region_id: string
        }
        Insert: {
          created_at?: string
          customer_segment_id: string
          fiscal_period_id: string
          forecast_confidence?: number
          forecast_units?: number
          id?: string
          memory_technology_id: string
          planning_version_id: string
          product_family_id: string
          region_id: string
        }
        Update: {
          created_at?: string
          customer_segment_id?: string
          fiscal_period_id?: string
          forecast_confidence?: number
          forecast_units?: number
          id?: string
          memory_technology_id?: string
          planning_version_id?: string
          product_family_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_customer_segment_id_fkey"
            columns: ["customer_segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_planning_version_id_fkey"
            columns: ["planning_version_id"]
            isOneToOne: false
            referencedRelation: "planning_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_summaries: {
        Row: {
          created_at: string
          id: string
          period: string
          revenue_at_risk: number
          summary: string
          top_action: string
          top_risk: string
        }
        Insert: {
          created_at?: string
          id?: string
          period: string
          revenue_at_risk?: number
          summary: string
          top_action: string
          top_risk: string
        }
        Update: {
          created_at?: string
          id?: string
          period?: string
          revenue_at_risk?: number
          summary?: string
          top_action?: string
          top_risk?: string
        }
        Relationships: []
      }
      fiscal_periods: {
        Row: {
          end_date: string
          fiscal_quarter: number | null
          fiscal_year: number
          id: string
          period_code: string
          period_type: string
          sort_order: number
          start_date: string
        }
        Insert: {
          end_date: string
          fiscal_quarter?: number | null
          fiscal_year: number
          id?: string
          period_code: string
          period_type: string
          sort_order?: number
          start_date: string
        }
        Update: {
          end_date?: string
          fiscal_quarter?: number | null
          fiscal_year?: number
          id?: string
          period_code?: string
          period_type?: string
          sort_order?: number
          start_date?: string
        }
        Relationships: []
      }
      forecast_variance: {
        Row: {
          actual_units: number
          fiscal_period_id: string
          forecast_units: number
          id: string
          planning_version_id: string
          product_family_id: string
          variance_percent: number
        }
        Insert: {
          actual_units: number
          fiscal_period_id: string
          forecast_units: number
          id?: string
          planning_version_id: string
          product_family_id: string
          variance_percent: number
        }
        Update: {
          actual_units?: number
          fiscal_period_id?: string
          forecast_units?: number
          id?: string
          planning_version_id?: string
          product_family_id?: string
          variance_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "forecast_variance_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecast_variance_planning_version_id_fkey"
            columns: ["planning_version_id"]
            isOneToOne: false
            referencedRelation: "planning_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecast_variance_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          as_of_date: string
          id: string
          inventory_units: number
          memory_technology_id: string
          product_family_id: string
          region_id: string
          safety_stock_units: number
        }
        Insert: {
          as_of_date?: string
          id?: string
          inventory_units?: number
          memory_technology_id: string
          product_family_id: string
          region_id: string
          safety_stock_units?: number
        }
        Update: {
          as_of_date?: string
          id?: string
          inventory_units?: number
          memory_technology_id?: string
          product_family_id?: string
          region_id?: string
          safety_stock_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_technologies: {
        Row: {
          code: string
          generation: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          generation: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          generation?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      planning_versions: {
        Row: {
          code: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_families: {
        Row: {
          code: string
          id: string
          name: string
          revenue_per_unit: number
          segment: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          revenue_per_unit?: number
          segment: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          revenue_per_unit?: number
          segment?: string
          sort_order?: number
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          expected_arrival_date: string
          expedite_cost: number
          id: string
          memory_technology_id: string
          product_family_id: string | null
          quantity: number
          status: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          expected_arrival_date: string
          expedite_cost?: number
          id?: string
          memory_technology_id: string
          product_family_id?: string | null
          quantity?: number
          status?: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          expected_arrival_date?: string
          expedite_cost?: number
          id?: string
          memory_technology_id?: string
          product_family_id?: string | null
          quantity?: number
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          code: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          category: string
          description: string
          event_date: string
          id: string
          impact_units: number
          memory_technology_id: string | null
          product_family_id: string | null
          revenue_at_risk: number
          severity: string
          status: string
          supplier_id: string | null
        }
        Insert: {
          category: string
          description: string
          event_date?: string
          id?: string
          impact_units?: number
          memory_technology_id?: string | null
          product_family_id?: string | null
          revenue_at_risk?: number
          severity: string
          status?: string
          supplier_id?: string | null
        }
        Update: {
          category?: string
          description?: string
          event_date?: string
          id?: string
          impact_units?: number
          memory_technology_id?: string | null
          product_family_id?: string | null
          revenue_at_risk?: number
          severity?: string
          status?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_simulations: {
        Row: {
          causality_chain: Json
          created_at: string
          duration_weeks: number
          id: string
          lever: string
          magnitude: number
          name: string
          recovery_weeks: number
          revenue_at_risk: number
          risk_score_delta: number
          scope: Json
          shortage_impact_units: number
          summary: string
          template_id: string | null
        }
        Insert: {
          causality_chain?: Json
          created_at?: string
          duration_weeks?: number
          id?: string
          lever: string
          magnitude: number
          name: string
          recovery_weeks?: number
          revenue_at_risk?: number
          risk_score_delta?: number
          scope?: Json
          shortage_impact_units?: number
          summary?: string
          template_id?: string | null
        }
        Update: {
          causality_chain?: Json
          created_at?: string
          duration_weeks?: number
          id?: string
          lever?: string
          magnitude?: number
          name?: string
          recovery_weeks?: number
          revenue_at_risk?: number
          risk_score_delta?: number
          scope?: Json
          shortage_impact_units?: number
          summary?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_simulations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "scenario_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_templates: {
        Row: {
          code: string
          description: string
          duration_weeks: number
          id: string
          lever: string
          magnitude: number
          name: string
          narrative: string
          scope: Json
          sort_order: number
        }
        Insert: {
          code: string
          description: string
          duration_weeks?: number
          id?: string
          lever: string
          magnitude: number
          name: string
          narrative: string
          scope?: Json
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string
          duration_weeks?: number
          id?: string
          lever?: string
          magnitude?: number
          name?: string
          narrative?: string
          scope?: Json
          sort_order?: number
        }
        Relationships: []
      }
      scenario_timeline_points: {
        Row: {
          day_offset: number
          headline: string
          id: string
          label: string
          metric_delta_pct: number
          narrative: string
          simulation_id: string
          sort_order: number
        }
        Insert: {
          day_offset: number
          headline: string
          id?: string
          label: string
          metric_delta_pct?: number
          narrative: string
          simulation_id: string
          sort_order?: number
        }
        Update: {
          day_offset?: number
          headline?: string
          id?: string
          label?: string
          metric_delta_pct?: number
          narrative?: string
          simulation_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenario_timeline_points_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "scenario_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      shortage_events: {
        Row: {
          detected_date: string
          fiscal_period_id: string
          id: string
          memory_technology_id: string
          product_family_id: string
          severity: string
          shortage_units: number
          status: string
        }
        Insert: {
          detected_date?: string
          fiscal_period_id: string
          id?: string
          memory_technology_id: string
          product_family_id: string
          severity: string
          shortage_units: number
          status?: string
        }
        Update: {
          detected_date?: string
          fiscal_period_id?: string
          id?: string
          memory_technology_id?: string
          product_family_id?: string
          severity?: string
          shortage_units?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortage_events_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_events_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortage_events_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_allocations: {
        Row: {
          allocation_percent: number
          fiscal_period_id: string
          id: string
          memory_technology_id: string
          product_family_id: string
          supplier_id: string
        }
        Insert: {
          allocation_percent?: number
          fiscal_period_id: string
          id?: string
          memory_technology_id: string
          product_family_id: string
          supplier_id: string
        }
        Update: {
          allocation_percent?: number
          fiscal_period_id?: string
          id?: string
          memory_technology_id?: string
          product_family_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_allocations_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_allocations_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_allocations_product_family_id_fkey"
            columns: ["product_family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_allocations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_capacity: {
        Row: {
          available_capacity_units: number
          committed_capacity_units: number
          fiscal_period_id: string
          id: string
          lead_time_weeks: number
          memory_technology_id: string
          moq: number
          supplier_id: string
          yield_risk_percent: number
        }
        Insert: {
          available_capacity_units?: number
          committed_capacity_units?: number
          fiscal_period_id: string
          id?: string
          lead_time_weeks?: number
          memory_technology_id: string
          moq?: number
          supplier_id: string
          yield_risk_percent?: number
        }
        Update: {
          available_capacity_units?: number
          committed_capacity_units?: number
          fiscal_period_id?: string
          id?: string
          lead_time_weeks?: number
          memory_technology_id?: string
          moq?: number
          supplier_id?: string
          yield_risk_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_capacity_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_capacity_memory_technology_id_fkey"
            columns: ["memory_technology_id"]
            isOneToOne: false
            referencedRelation: "memory_technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_capacity_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          code: string
          id: string
          name: string
          region: string
          risk_baseline: number
          sort_order: number
          supplier_type: string
        }
        Insert: {
          code: string
          id?: string
          name: string
          region: string
          risk_baseline?: number
          sort_order?: number
          supplier_type: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
          region?: string
          risk_baseline?: number
          sort_order?: number
          supplier_type?: string
        }
        Relationships: []
      }
      test_runs: {
        Row: {
          failed: number
          id: string
          passed: number
          ran_at: string
          results: Json
        }
        Insert: {
          failed?: number
          id?: string
          passed?: number
          ran_at?: string
          results?: Json
        }
        Update: {
          failed?: number
          id?: string
          passed?: number
          ran_at?: string
          results?: Json
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
    Enums: {},
  },
} as const
