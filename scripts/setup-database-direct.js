#!/usr/bin/env node

/**
 * OpenMed Database Setup Script (Direct PostgreSQL)
 * 
 * This script uses direct PostgreSQL connection for reliable SQL execution
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('💡 Make sure your .env.local file is configured.')
  process.exit(1)
}

// Extract database connection info from Supabase URL
const urlParts = supabaseUrl.replace('https://', '').split('.')
const projectRef = urlParts[0]
const host = `db.${urlParts.slice(1).join('.')}`
const connectionString = `postgresql://postgres:[YOUR-PASSWORD]@${host}:5432/postgres`

console.log('🚀 OpenMed Database Setup')
console.log('========================')
console.log('')
console.log('📝 Since direct PostgreSQL connection requires your database password,')
console.log('   we recommend using the Supabase SQL Editor for setup.')
console.log('')
console.log('🔗 Follow these steps:')
console.log('')
console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to SQL Editor → New query')
console.log('4. Copy and paste the SQL from each file in /supabase/ directory:')
console.log('')

const sqlFiles = [
  { name: '01-extensions.sql', description: 'Database extensions' },
  { name: '02-tables.sql', description: 'Tables and indexes' },
  { name: '03-policies.sql', description: 'Row Level Security policies' },
  { name: '04-functions.sql', description: 'Database functions' }
]

sqlFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. Run: supabase/${file.name} (${file.description})`)
})

console.log('')
console.log('💡 Alternatively, run the manual setup script:')
console.log('   node scripts/manual-setup.js')
console.log('')

// Create a combined SQL file for easy execution
const combinedSql = []
sqlFiles.forEach(fileInfo => {
  const sqlPath = path.join(__dirname, '..', 'supabase', fileInfo.name)
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8')
    combinedSql.push(`-- ${fileInfo.description.toUpperCase()}`)
    combinedSql.push(`-- File: ${fileInfo.name}`)
    combinedSql.push('')
    combinedSql.push(sql)
    combinedSql.push('')
    combinedSql.push('-- ' + '='.repeat(50))
    combinedSql.push('')
  }
})

const outputPath = path.join(__dirname, '..', 'complete-setup.sql')
fs.writeFileSync(outputPath, combinedSql.join('\n'))

console.log(`📄 Created combined SQL file: complete-setup.sql`)
console.log('   You can run this entire file in the Supabase SQL Editor')
console.log('')
