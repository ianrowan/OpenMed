#!/usr/bin/env node

/**
 * OpenMed Sample Data Script
 * 
 * Adds sample blood work and genetic data for testing
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleBloodWork = {
  test_date: '2024-01-15',
  lab_name: 'Quest Diagnostics',
  biomarkers: [
    {
      name: 'Total Cholesterol',
      value: 245,
      unit: 'mg/dL',
      reference_range: { min: 0, max: 200 },
      status: 'high'
    },
    {
      name: 'HDL Cholesterol',
      value: 38,
      unit: 'mg/dL',
      reference_range: { min: 40, max: 100 },
      status: 'low'
    },
    {
      name: 'LDL Cholesterol',
      value: 165,
      unit: 'mg/dL',
      reference_range: { min: 0, max: 100 },
      status: 'high'
    },
    {
      name: 'Triglycerides',
      value: 210,
      unit: 'mg/dL',
      reference_range: { min: 0, max: 150 },
      status: 'high'
    },
    {
      name: 'Glucose',
      value: 95,
      unit: 'mg/dL',
      reference_range: { min: 70, max: 99 },
      status: 'normal'
    },
    {
      name: 'Hemoglobin A1C',
      value: 5.4,
      unit: '%',
      reference_range: { min: 4.0, max: 5.6 },
      status: 'normal'
    },
    {
      name: 'Vitamin D',
      value: 25,
      unit: 'ng/mL',
      reference_range: { min: 30, max: 100 },
      status: 'low'
    }
  ]
}

const sampleGeneticData = {
  source: '23andme',
  snps: [
    {
      rsid: 'rs4988235',
      chromosome: '2',
      position: 136608646,
      genotype: 'CT',
      gene: 'LCT',
      annotation: {
        phenotype: 'Lactose tolerance',
        clinical_significance: 'benign',
        disease_association: 'Lactose intolerance',
        risk_level: 'low'
      }
    },
    {
      rsid: 'rs1801133',
      chromosome: '1',
      position: 11796321,
      genotype: 'TT',
      gene: 'MTHFR',
      annotation: {
        phenotype: 'Folate metabolism',
        clinical_significance: 'risk_factor',
        disease_association: 'Cardiovascular disease risk',
        risk_level: 'moderate'
      }
    },
    {
      rsid: 'rs7903146',
      chromosome: '10',
      position: 114758349,
      genotype: 'CT',
      gene: 'TCF7L2',
      annotation: {
        phenotype: 'Type 2 diabetes risk',
        clinical_significance: 'risk_factor',
        disease_association: 'Type 2 diabetes',
        risk_level: 'moderate'
      }
    }
  ]
}

async function addSampleData() {
  console.log('📊 Adding sample data to OpenMed database...')
  console.log('')

  try {
    // Add sample blood work
    console.log('🩸 Adding sample blood test results...')
    const { data: bloodData, error: bloodError } = await supabase
      .from('blood_test_results')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Demo user ID
        ...sampleBloodWork
      })
      .select()

    if (bloodError) {
      console.error('❌ Error adding blood work:', bloodError.message)
    } else {
      console.log('✅ Sample blood work added')
    }

    // Add sample genetic data
    console.log('🧬 Adding sample genetic data...')
    const { data: geneticDataResult, error: geneticError } = await supabase
      .from('genetic_data')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Demo user ID
        ...sampleGeneticData
      })
      .select()

    if (geneticError) {
      console.error('❌ Error adding genetic data:', geneticError.message)
    } else {
      console.log('✅ Sample genetic data added')
    }

    console.log('')
    console.log('🎉 Sample data added successfully!')
    console.log('')
    console.log('📋 Added:')
    console.log('   • Blood test with 7 biomarkers')
    console.log('   • Genetic data with 3 SNPs')
    console.log('')
    console.log('💡 Start the app and try asking:')
    console.log('   "What are my out of range biomarkers?"')
    console.log('   "Do I have any genetic risk factors?"')
    console.log('')

  } catch (error) {
    console.error('❌ Failed to add sample data:', error.message)
    process.exit(1)
  }
}

addSampleData()
