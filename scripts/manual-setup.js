#!/usr/bin/env node

/**
 * Manual Database Setup for OpenMed
 * Creates a combined SQL file for easy execution in Supabase SQL Editor
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const sqlFiles = [
  { name: '01-extensions.sql', description: 'Database extensions' },
  { name: '02-tables.sql', description: 'Tables and indexes' },
  { name: '03-policies.sql', description: 'Row Level Security policies' },
  { name: '04-functions.sql', description: 'Database functions' }
]

console.log('🚀 OpenMed Manual Database Setup')
console.log('=================================')
console.log('')

// Check if all SQL files exist
let allFilesExist = true
sqlFiles.forEach(fileInfo => {
  const sqlPath = path.join(__dirname, '..', 'supabase', fileInfo.name)
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Missing SQL file: ${fileInfo.name}`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.error('')
  console.error('Some SQL files are missing. Please check the /supabase directory.')
  process.exit(1)
}

// Create combined SQL file
console.log('📄 Creating combined SQL file...')
const combinedSql = []

// Add header
combinedSql.push('-- OpenMed Database Setup')
combinedSql.push('-- Generated automatically - run this in Supabase SQL Editor')
combinedSql.push('-- ' + '='.repeat(60))
combinedSql.push('')

sqlFiles.forEach((fileInfo, index) => {
  const sqlPath = path.join(__dirname, '..', 'supabase', fileInfo.name)
  const sql = fs.readFileSync(sqlPath, 'utf8')
  
  combinedSql.push(`-- STEP ${index + 1}: ${fileInfo.description.toUpperCase()}`)
  combinedSql.push(`-- Source: ${fileInfo.name}`)
  combinedSql.push('-- ' + '-'.repeat(40))
  combinedSql.push('')
  combinedSql.push(sql.trim())
  combinedSql.push('')
  combinedSql.push('-- ' + '='.repeat(60))
  combinedSql.push('')
})

const outputPath = path.join(__dirname, '..', 'complete-database-setup.sql')
fs.writeFileSync(outputPath, combinedSql.join('\n'))

console.log('✅ Combined SQL file created: complete-database-setup.sql')
console.log('')
console.log('🔗 Next steps:')
console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard')
console.log('2. Go to your project → SQL Editor')
console.log('3. Click "New query"')
console.log('4. Copy and paste the contents of complete-database-setup.sql')
console.log('5. Click "Run" to execute all statements')
console.log('')
console.log('📋 This will create:')
sqlFiles.forEach((fileInfo, index) => {
  console.log(`   ${index + 1}. ${fileInfo.description}`)
})
console.log('')
console.log('💡 After running the SQL, your authentication system will be ready!')
console.log('')

// Also show the SQL content for easy copy-paste
console.log('📄 SQL Content Preview:')
console.log('========================')
console.log('')
console.log('-- Preview of first 20 lines:')
const previewLines = combinedSql.slice(0, 20)
previewLines.forEach(line => console.log(line))
if (combinedSql.length > 20) {
  console.log('-- ... (full content in complete-database-setup.sql)')
}
console.log('')
