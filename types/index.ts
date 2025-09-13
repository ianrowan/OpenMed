import { z } from 'zod'

// User and Authentication Types
export interface User {
  id: string
  email: string
  created_at: string
  medical_profile?: MedicalProfile
}

export interface MedicalProfile {
  id: string
  user_id: string
  age?: number
  gender?: string
  height?: number // cm
  weight?: number // kg
  conditions?: string[]
  medications?: string[]
  allergies?: string[]
  family_history?: string[]
  lifestyle?: Record<string, any>
  created_at: string
  updated_at: string
}

// Form data interface for onboarding (includes birth_date for form input)
export interface MedicalProfileFormData {
  birth_date?: string
  sex?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  conditions?: string[]
  medications?: string[]
  allergies?: string[]
  family_history?: string[]
  lifestyle?: Record<string, any>
}

// Medical Data Types
export interface BloodTestResult {
  id: string
  user_id: string
  test_date: string
  lab_name?: string
  biomarkers: Biomarker[]
  uploaded_at: string
}

export interface Biomarker {
  name: string
  value: number
  unit: string
  reference_range: {
    min: number
    max: number
    optimal?: {
      min: number
      max: number
    }
  }
  status: 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low'
  notes?: string
}

// Genetic Data Types
export interface GeneticData {
  id: string
  user_id: string
  source: '23andme' | 'ancestry' | 'other'
  snps: SNP[]
  uploaded_at: string
}

export interface SNP {
  rsid: string
  chromosome: string
  position: number
  genotype: string
  gene?: string
  annotation?: SNPAnnotation
}

export interface SNPAnnotation {
  phenotype?: string
  clinical_significance?: string
  disease_association?: string
  drug_response?: string
  risk_level?: 'low' | 'moderate' | 'high'
}

// Chat and AI Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls?: ToolCall[]
  created_at: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: ToolResult
}

export interface ToolResult {
  data: any
  visualization?: {
    type: 'chart' | 'table' | 'metric' | 'timeline' | 'genetic_report'
    config: VisualizationConfig
  }
  summary: string
  references?: Reference[]
}

export interface VisualizationConfig {
  title?: string
  description?: string
  chart_type?: 'line' | 'bar' | 'scatter' | 'area'
  x_axis?: string
  y_axis?: string
  data_keys?: string[]
  color_scheme?: string[]
}

export interface Reference {
  title: string
  url?: string
  source: string
  type: 'research_paper' | 'clinical_guideline' | 'database' | 'other'
}

// Tool Schemas
export const BloodWorkQuerySchema = z.object({
  markers: z.array(z.string()).optional(),
  date_range: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  out_of_range_only: z.boolean().optional(),
  test_id: z.string().optional()
})

export const GeneticQuerySchema = z.object({
  genes: z.array(z.string()).optional(),
  rsids: z.array(z.string()).optional(),
  phenotype: z.string().optional(),
  clinical_significance: z.array(z.string()).optional()
})

export const MedicalSearchSchema = z.object({
  query: z.string(),
  max_results: z.number().max(20).default(5),
  include_user_data: z.boolean().default(true),
  search_type: z.enum(['literature', 'guidelines', 'drug_interactions', 'all']).default('all')
})

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Medical Analysis Types
export interface HealthInsight {
  id: string
  user_id: string
  type: 'biomarker_trend' | 'genetic_risk' | 'drug_interaction' | 'lifestyle_recommendation'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  data_sources: string[]
  recommendations?: string[]
  created_at: string
}

// File Upload Types
export interface FileUpload {
  id: string
  user_id: string
  file_name: string
  file_type: 'blood_test' | 'genetic_data' | 'medical_report'
  file_size: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  parsed_data?: any
  error_message?: string
  uploaded_at: string
}

// Conversation Types
export interface Conversation {
  id: string
  user_id: string
  title?: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export type MedicalDataType = 'blood_work' | 'genetics' | 'lifestyle' | 'medications' | 'conditions'
