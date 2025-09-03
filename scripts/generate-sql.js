#!/usr/bin/env node

/**
 * OpenMed Database SQL Generator
 * 
 * Outputs SQL commands for manual execution in Supabase dashboard
 */

const fs = require('fs')
const path = require('path')

const sqlFiles = [
  { name: '01-extensions.sql', description: 'Extensions' },
  { name: '02-tables.sql', description: 'Tables and Indexes' },
  { name: '03-policies.sql', description: 'Row Level Security' },
  { name: '04-functions.sql', description: 'Database Functions' }
]

function generateSetupSQL() {
  console.log('-- OpenMed Database Setup SQL')
  console.log('-- Copy and paste these commands into Supabase SQL Editor')
  console.log('-- Execute each section one at a time')
  console.log('')

  for (const fileInfo of sqlFiles) {
    const sqlPath = path.join(__dirname, '..', 'supabase', fileInfo.name)
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8')
      
      console.log(`-- ====================================`)
      console.log(`-- ${fileInfo.description.toUpperCase()}`)
      console.log(`-- ====================================`)
      console.log('')
      console.log(sql)
      console.log('')
    } else {
      console.log(`-- ERROR: File not found: ${fileInfo.name}`)
    }
  }

  console.log('-- ====================================')
  console.log('-- SETUP COMPLETE')
  console.log('-- ====================================')
}

generateSetupSQL()
