import { createServerComponentClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Load clinical SNPs database
let clinicalSnpsData: any = null

async function loadClinicalSnps() {
  if (!clinicalSnpsData) {
    try {
      const filePath = join(process.cwd(), 'data', 'clinical_snps.json')
      const fileContents = await readFile(filePath, 'utf8')
      clinicalSnpsData = JSON.parse(fileContents)
    } catch (error) {
      console.warn('Clinical SNPs database not found, proceeding without clinical annotations')
      clinicalSnpsData = {}
    }
  }
  return clinicalSnpsData
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const demo = searchParams.get('demo') === 'true'

    if (!query.trim()) {
      return NextResponse.json({ data: [] })
    }

    const supabase = await createServerComponentClient()

    if (demo) {
      // Demo mode - query demo table without authentication
      const { data, error } = await supabase
        .from('demo_genetics_variants')
        .select('*')
        .ilike('rsid', `%${query}%`)
        .order('rsid')

      if (error) {
        console.error('Demo genetic search error:', error)
        return NextResponse.json(
          { error: 'Failed to search demo genetic variants' },
          { status: 500 }
        )
      }

      // Load clinical annotations
      const clinicalSnps = await loadClinicalSnps()
      
      // Enhance results with clinical annotations and format for frontend
      const enhancedResults = (data || []).map((variant: any) => {
        const clinicalInfo = clinicalSnps[variant.rsid] || null
        return {
          rsid: variant.rsid,
          genotype: variant.genotype,
          source: variant.source,
          hasData: true,
          annotation: clinicalInfo ? {
            geneName: clinicalInfo.gene_symbol,
            phenotype: clinicalInfo.phenotype,
            clinical_significance: clinicalInfo.clinical_significance,
            drugResponse: clinicalInfo.drug_response,
            frequency: clinicalInfo.frequency,
            riskAllele: clinicalInfo.risk_allele,
            interpretation: clinicalInfo.interpretation
          } : {}
        }
      })

      return NextResponse.json({ data: enhancedResults })
    }

    // Regular mode - require authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('genetics_variants')
      .select('*')
      .eq('user_id', user.id)
      .ilike('rsid', `%${query}%`)
      .order('rsid')

    if (error) {
      console.error('Genetic search error:', error)
      return NextResponse.json(
        { error: 'Failed to search genetic variants' },
        { status: 500 }
      )
    }

    // Load clinical annotations
    const clinicalSnps = await loadClinicalSnps()
    
    // Enhance results with clinical annotations and format for frontend
    const enhancedResults = (data || []).map((variant: any) => {
      const clinicalInfo = clinicalSnps[variant.rsid] || null
      return {
        rsid: variant.rsid,
        genotype: variant.genotype,
        source: variant.source,
        hasData: true,
        annotation: clinicalInfo ? {
          geneName: clinicalInfo.gene_symbol,
          phenotype: clinicalInfo.phenotype,
          clinical_significance: clinicalInfo.clinical_significance,
          drugResponse: clinicalInfo.drug_response,
          frequency: clinicalInfo.frequency,
          riskAllele: clinicalInfo.risk_allele,
          interpretation: clinicalInfo.interpretation
        } : {}
      }
    })

    return NextResponse.json({ data: enhancedResults })
  } catch (error) {
    console.error('Unexpected error in genetic search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
