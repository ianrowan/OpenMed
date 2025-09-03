// Auto-generated types from Supabase
// Run `npm run db:generate` to update these types

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      medical_profiles: {
        Row: {
          id: string
          user_id: string
          age: number | null
          gender: string | null
          height: number | null
          weight: number | null
          conditions: string[] | null
          medications: string[] | null
          allergies: string[] | null
          family_history: string[] | null
          lifestyle: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          conditions?: string[] | null
          medications?: string[] | null
          allergies?: string[] | null
          family_history?: string[] | null
          lifestyle?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          conditions?: string[] | null
          medications?: string[] | null
          allergies?: string[] | null
          family_history?: string[] | null
          lifestyle?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      blood_test_results: {
        Row: {
          id: string
          user_id: string
          test_date: string
          lab_name: string | null
          biomarkers: any
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_date: string
          lab_name?: string | null
          biomarkers: any
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_date?: string
          lab_name?: string | null
          biomarkers?: any
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      genetic_data: {
        Row: {
          id: string
          user_id: string
          source: string
          snps: any
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          snps: any
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          snps?: any
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      medical_data: {
        Row: {
          id: string
          user_id: string
          data_type: string
          data: any
          uploaded_at: string
          embedding: number[] | null
        }
        Insert: {
          id?: string
          user_id: string
          data_type: string
          data: any
          uploaded_at?: string
          embedding?: number[] | null
        }
        Update: {
          id?: string
          user_id?: string
          data_type?: string
          data?: any
          uploaded_at?: string
          embedding?: number[] | null
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          messages: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          messages: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          messages?: any
          created_at?: string
          updated_at?: string
        }
      }
      file_uploads: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          processing_status: string
          parsed_data: any | null
          error_message: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          processing_status?: string
          parsed_data?: any | null
          error_message?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          processing_status?: string
          parsed_data?: any | null
          error_message?: string | null
          uploaded_at?: string
        }
      }
    }
  }
}
