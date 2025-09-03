import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { z } from 'zod'

const GeneticUploadRequestSchema = z.object({
  data: z.object({
    variants: z.array(z.object({
      rsid: z.string(),
      chromosome: z.string(),
      position: z.number(),
      genotype: z.string(),
      annotation: z.object({
        geneName: z.string().optional(),
        clinicalSignificance: z.enum(['pathogenic', 'likely_pathogenic', 'uncertain', 'likely_benign', 'benign']).optional(),
        phenotype: z.string().optional(),
        drugResponse: z.string().optional(),
        frequency: z.number().optional(),
        consequence: z.string().optional(),
        riskAllele: z.string().optional(),
        interpretation: z.string().optional(),
      }).optional(),
    })),
    metadata: z.object({
      totalVariants: z.number(),
      annotatedVariants: z.number(),
      clinicallyRelevantVariants: z.number(),
      dataSource: z.string(),
      chromosomes: z.array(z.string()),
    }),
  }),
  riskAssessment: z.object({
    highRiskVariants: z.array(z.any()),
    drugResponseVariants: z.array(z.any()),
    carrierStatus: z.array(z.any()),
    recommendations: z.array(z.string()),
  }),
  fileName: z.string(),
  fileSize: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = GeneticUploadRequestSchema.parse(body)

    const { data: uploadData, riskAssessment, fileName, fileSize } = validatedData

    // Transform variants into a format suitable for storage
    const snpsData = {
      variants: uploadData.variants,
      metadata: uploadData.metadata,
      riskAssessment,
      uploadInfo: {
        fileName,
        fileSize,
        uploadedAt: new Date().toISOString(),
      }
    }

    // Insert genetic data
    const { data: geneticResult, error: insertError } = await supabase
      .from('genetic_data')
      .insert({
        user_id: user.id,
        source: uploadData.metadata.dataSource,
        snps: snpsData,
      } as any)
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save genetic data' },
        { status: 500 }
      )
    }

    // Log the upload
    console.log(`Genetic data uploaded for user ${user.id}: ${fileName} (${fileSize} bytes)`)

    return NextResponse.json({
      success: true,
      id: (geneticResult as any).id,
      summary: {
        totalVariants: uploadData.metadata.totalVariants,
        annotatedVariants: uploadData.metadata.annotatedVariants,
        clinicallyRelevantVariants: uploadData.metadata.clinicallyRelevantVariants,
        highRiskCount: riskAssessment.highRiskVariants.length,
        drugResponseCount: riskAssessment.drugResponseVariants.length,
      }
    })

  } catch (error) {
    console.error('Genetic data upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
