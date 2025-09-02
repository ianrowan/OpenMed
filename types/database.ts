export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          updated_at?: string
        }
      }
      blood_test_results: {
        Row: {
          id: string
          user_id: string
          test_date: string
          lab_name: string | null
          biomarkers: any[]
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_date: string
          lab_name?: string | null
          biomarkers: any[]
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_date?: string
          lab_name?: string | null
          biomarkers?: any[]
        }
      }
      genetic_data: {
        Row: {
          id: string
          user_id: string
          source: string
          snps: any[]
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          snps: any[]
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          snps?: any[]
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          tool_calls: any[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          tool_calls?: any[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          tool_calls?: any[] | null
        }
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
  }
}
