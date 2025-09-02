import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if environment variables are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Server-side client with service role
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey)
  : null
