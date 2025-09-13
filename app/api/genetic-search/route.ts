import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { CLINICAL_SNPS } from '@/lib/parsers/config/SNPs'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.toLowerCase() || ''

    if (!query || query.length < 2) {
      return Response.json({ variants: [] })
    }

    // Search through CLINICAL_SNPS for matching rsids or gene names
    const matchingRsids = Object.keys(CLINICAL_SNPS).filter(rsid => {
      const annotation = CLINICAL_SNPS[rsid]
      
      // Match by rsid (exact match or contains, case insensitive)
      if (rsid.toLowerCase() === query.toLowerCase() || rsid.toLowerCase().includes(query)) {
        return true
      }
      
      // Also try without 'rs' prefix if query doesn't have it
      if (!query.startsWith('rs') && rsid.toLowerCase().includes(`rs${query}`)) {
        return true
      }
      
      // Match by gene name
      if (annotation.geneName && annotation.geneName.toLowerCase().includes(query)) {
        return true
      }
      
      // Match by phenotype
      if (annotation.phenotype && annotation.phenotype.toLowerCase().includes(query)) {
        return true
      }
      
      return false
    })

    // Limit to first 10 matches for performance
    const limitedRsids = matchingRsids.slice(0, 10)

    // Also search user's actual genetic data directly for RSIDs not in clinical database
    const { data: directUserVariants, error: directError } = await supabase
      .from('genetics_variants')
      .select('*')
      .eq('user_id', user.id)
      .or(`rsid.ilike.%${query}%`)

    if (directError) {
      console.error('Error fetching direct user variants:', directError)
    }

    // Combine results from clinical database and user's direct data
    const allFoundRsids = new Set([...limitedRsids])
    
    // Add user's variants that match the search but aren't in clinical database
    if (directUserVariants) {
      directUserVariants.forEach(variant => {
        if (variant.rsid.toLowerCase().includes(query) || 
            (!query.startsWith('rs') && variant.rsid.toLowerCase().includes(`rs${query}`))) {
          allFoundRsids.add(variant.rsid)
        }
      })
    }

    const finalRsids = Array.from(allFoundRsids).slice(0, 10)

    if (finalRsids.length === 0) {
      return Response.json({ variants: [] })
    }

    // Get user's genetic data for these RSIDs
    const { data: userVariants, error } = await supabase
      .from('genetics_variants')
      .select('*')
      .eq('user_id', user.id)
      .in('rsid', finalRsids)

    if (error) {
      console.error('Error fetching genetic variants:', error)
      return Response.json(
        { error: 'Failed to fetch genetic variants' },
        { status: 500 }
      )
    }

    // Combine user data with annotations
    const annotatedVariants = finalRsids.map((rsid: string) => {
      const userVariant = userVariants?.find(v => v.rsid === rsid)
      const annotation = CLINICAL_SNPS[rsid]
      
      return {
        rsid,
        genotype: userVariant?.genotype || 'Not available',
        source: userVariant?.source || null,
        hasData: !!userVariant,
        annotation: annotation ? {
          geneName: annotation.geneName,
          phenotype: annotation.phenotype,
          clinical_significance: annotation.clinicalSignificance,
          drugResponse: annotation.drugResponse,
          frequency: annotation.frequency,
          riskAllele: annotation.riskAllele,
          interpretation: annotation.interpretation
        } : {
          geneName: 'Unknown',
          phenotype: 'No clinical annotation available',
          clinical_significance: undefined,
          drugResponse: undefined,
          frequency: undefined,
          riskAllele: undefined,
          interpretation: 'This variant is not in our clinical database but is present in your genetic data.'
        }
      }
    })

    return Response.json({ variants: annotatedVariants })
  } catch (error) {
    console.error('Error in genetic search API:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
