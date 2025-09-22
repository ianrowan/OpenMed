import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const GeneticUploadRequestSchema = z.object({
  data: z.object({
    variants: z.array(z.object({
      rsid: z.string(),
      genotype: z.string(),
    })),
    metadata: z.object({
      totalVariants: z.number(),
      dataSource: z.string(),
    }),
  }),
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

    const { data: uploadData } = validatedData

    // Batch process large uploads to prevent database timeouts
    const BATCH_SIZE = 2000 // Process 2000 variants at a time
    const variants = uploadData.variants
    let totalInserted = 0

    // Process variants in batches
    for (let i = 0; i < variants.length; i += BATCH_SIZE) {
      const batch = variants.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(variants.length / BATCH_SIZE)

      logger.info('Processing genetic data batch', { 
        batchNumber, 
        totalBatches, 
        variantCount: batch.length, 
        userId: user.id 
      })

      // For first batch, delete existing data. For subsequent batches, just insert
      const shouldDeleteExisting = i === 0

      const { data: batchInserted, error: batchError } = await supabase
        .rpc('bulk_insert_genetic_variants_batch', {
          p_user_id: user.id,
          p_source: uploadData.metadata.dataSource,
          p_variants: batch,
          p_delete_existing: shouldDeleteExisting
        } as any)

      if (batchError) {
        logger.error('Database insert error on batch', { 
          batchNumber, 
          error: batchError.message, 
          userId: user.id 
        })
        // If we've already inserted some batches, we should clean up
        if (totalInserted > 0) {
          logger.info('Cleaning up previously inserted variants due to batch failure', { 
            totalInserted, 
            userId: user.id 
          })
          await supabase.from('genetics_variants').delete().eq('user_id', user.id)
        }
        return NextResponse.json(
          { error: `Failed to save genetic data (batch ${batchNumber}/${totalBatches})` },
          { status: 500 }
        )
      }

      totalInserted += batchInserted || 0
    }

    // Use totalInserted instead of single operation result

    // Log the upload
    logger.info('Genetic data uploaded successfully', { 
      variantsInserted: totalInserted, 
      dataSource: uploadData.metadata.dataSource,
      userId: user.id 
    })

    return NextResponse.json({
      success: true,
      variantsInserted: totalInserted,
      summary: {
        totalVariants: uploadData.metadata.totalVariants,
        dataSource: uploadData.metadata.dataSource,
      }
    })

  } catch (error) {
    logger.error('Genetic data upload error', { 
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
