import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const UploadRequestSchema = z.object({
  data: z.object({
    biomarkers: z.array(z.object({
      biomarker: z.string(),
      value: z.number(),
      unit: z.string(),
      referenceMin: z.number().nullable(),
      referenceMax: z.number().nullable(),
      status: z.enum(['high', 'low', 'normal', 'critical']),
      percentileFromNormal: z.number().optional(),
      interpretation: z.string().optional(),
    })),
    metadata: z.object({
      totalCount: z.number(),
      abnormalCount: z.number(),
      criticalCount: z.number(),
      testDate: z.string(),
      labName: z.string(),
    }),
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
    const validatedData = UploadRequestSchema.parse(body)

    const { data: uploadData, fileName, fileSize } = validatedData

    // Insert blood test result
    const { data: bloodTestResult, error: insertError } = await supabase
      .from('blood_test_results')
      .insert({
        user_id: user.id,
        test_date: uploadData.metadata.testDate,
        lab_name: uploadData.metadata.labName,
        biomarkers: uploadData.biomarkers,
      } as any)
      .select()
      .single()

    if (insertError) {
      logger.error('Database insert error', { 
        error: insertError.message, 
        userId: user.id 
      })
      return NextResponse.json(
        { error: 'Failed to save blood test results' },
        { status: 500 }
      )
    }

    // Log the upload
    logger.info('Blood test uploaded successfully', { 
      fileName, 
      fileSize, 
      userId: user.id 
    })

    return NextResponse.json({
      success: true,
      id: (bloodTestResult as any).id,
      summary: {
        totalBiomarkers: uploadData.metadata.totalCount,
        abnormalCount: uploadData.metadata.abnormalCount,
        criticalCount: uploadData.metadata.criticalCount,
      }
    })

  } catch (error) {
    logger.error('Blood test upload error', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    
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
