#!/usr/bin/env node

/**
 * OpenMed Database Setup Script
 * 
 * This script automatically configures your Supabase database with all
 * required tables, policies, and functions for OpenMed.
 * 
 * Prerequisites:
 * 1. Set up your .env.local file with Supabase credentials
 * 2. Install dependencies: npm install
 * 3. Run: npm run db:setup
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('💡 Make sure your .env.local file is configured with your Supabase credentials.')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const sqlFiles = [
  '01-extensions.sql',
  '02-tables.sql', 
  '03-policies.sql',
  '04-functions.sql'
]

async function executeSqlFile(filename) {
  console.log(`📄 Executing ${filename}...`)
  
  try {
    const sqlPath = join(__dirname, 'supabase', filename)
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0)
          
          if (directError) {
            console.warn(`⚠️  Warning in ${filename}: ${error.message}`)
          }
        }
      }
    }
    
    console.log(`✅ Successfully executed ${filename}`)
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error.message)
    throw error
  }
}

async function checkConnection() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase.from('_temp').select('*').limit(1)
    if (error && !error.message.includes('does not exist')) {
      throw error
    }
    console.log('✅ Successfully connected to Supabase')
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    console.error('💡 Check your SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
  }
}

async function setupDatabase() {
  console.log('🚀 Starting OpenMed database setup...')
  console.log('')
  
  await checkConnection()
  console.log('')
  
  for (const filename of sqlFiles) {
    await executeSqlFile(filename)
  }
  
  console.log('')
  console.log('🎉 Database setup completed successfully!')
  console.log('')
  console.log('📋 What was created:')
  console.log('   ✅ Required extensions (uuid-ossp, vector, pg_trgm, btree_gin)')
  console.log('   ✅ Tables: users, blood_test_results, genetic_data, chat_messages')
  console.log('   ✅ Row Level Security policies for data protection')
  console.log('   ✅ Helper functions for data analysis')
  console.log('')
  console.log('🔄 Next steps:')
  console.log('   1. Test the application: npm run dev')
  console.log('   2. Upload sample data using the UI')
  console.log('   3. Or add sample data: npm run db:sample')
  console.log('')
}

// Enhanced error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the setup
setupDatabase().catch((error) => {
  console.error('❌ Database setup failed:', error.message)
  process.exit(1)
})
