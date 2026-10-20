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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          codigo_atividade: string
          created_at: string
          id: number
          pasta_id: number | null
          professor_id: number
          subtitulo: string | null
          titulo: string
          turma_id: number
          updated_at: string
        }
        Insert: {
          codigo_atividade: string
          created_at?: string
          id?: number
          pasta_id?: number | null
          professor_id: number
          subtitulo?: string | null
          titulo: string
          turma_id: number
          updated_at?: string
        }
        Update: {
          codigo_atividade?: string
          created_at?: string
          id?: number
          pasta_id?: number | null
          professor_id?: number
          subtitulo?: string | null
          titulo?: string
          turma_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_turma_same_professor_fk"
            columns: ["turma_id", "professor_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id", "professor_id"]
          },
        ]
      }
      estudantes: {
        Row: {
          codigo_aluno: string
          created_at: string
          horario_inicio_atividade: string | null
          horario_termino_atividade: string | null
          id: number
          nome: string
          turma_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_aluno: string
          created_at?: string
          horario_inicio_atividade?: string | null
          horario_termino_atividade?: string | null
          id?: number
          nome: string
          turma_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_aluno?: string
          created_at?: string
          horario_inicio_atividade?: string | null
          horario_termino_atividade?: string | null
          id?: number
          nome?: string
          turma_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudantes_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          atividade_id: number
          created_at: string
          descricao: string | null
          href: string
          id: number
          ordem: number
          titulo: string
        }
        Insert: {
          atividade_id: number
          created_at?: string
          descricao?: string | null
          href: string
          id?: number
          ordem: number
          titulo: string
        }
        Update: {
          atividade_id?: number
          created_at?: string
          descricao?: string | null
          href?: string
          id?: number
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      pastas: {
        Row: {
          created_at: string
          id: number
          nome: string
          parent_id: number | null
          professor_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          nome: string
          parent_id?: number | null
          professor_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string
          parent_id?: number | null
          professor_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastas_parent_same_professor_fk"
            columns: ["parent_id", "professor_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id", "professor_id"]
          },
          {
            foreignKeyName: "pastas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          created_at: string
          id: number
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progresso_estudante: {
        Row: {
          created_at: string
          estudante_id: number
          link_id: number
          pontuacao: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estudante_id: number
          link_id: number
          pontuacao?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estudante_id?: number
          link_id?: number
          pontuacao?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_estudante_estudante_id_fkey"
            columns: ["estudante_id"]
            isOneToOne: false
            referencedRelation: "estudantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_estudante_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          created_at: string
          data_realizacao_atividade: string | null
          id: number
          nome: string
          professor_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_realizacao_atividade?: string | null
          id?: number
          nome: string
          professor_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_realizacao_atividade?: string | null
          id?: number
          nome?: string
          professor_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_activity: {
        Args: { p_codigo: string; p_nome: string }
        Returns: Json
      }
      update_my_progress: {
        Args: { p_link_id: number; p_status: string }
        Returns: undefined
      }
      validate_activity_code: { Args: { p_codigo: string }; Returns: boolean }
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
