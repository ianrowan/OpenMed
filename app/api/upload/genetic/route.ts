import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createGeneticUploadClient } from '@/lib/supabase'
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
      chunkIndex: z.number().optional(), // For paginated uploads
      totalChunks: z.number().optional(), // For paginated uploads
      isLastChunk: z.boolean().optional(), // For paginated uploads
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
    const { chunkIndex = 1, totalChunks = 1, isLastChunk = true } = uploadData.metadata

    // Log chunk information
    if (totalChunks > 1) {
      logger.info('Processing paginated genetic data chunk', { 
        chunkIndex, 
        totalChunks,
        variantCount: uploadData.variants.length, 
        userId: user.id 
      })
    }

    // Batch process large uploads to prevent database timeouts
    const BATCH_SIZE = 10000 // Increased to 10k variants per batch to reduce DB calls
    const variants = uploadData.variants
    let totalInserted = 0

    // Create specialized client for genetic data uploads with extended timeouts
    const geneticUploadClient = createGeneticUploadClient()

    logger.info('Starting genetic data upload with enhanced timeout handling', {
      chunkIndex,
      totalChunks,
      variantCount: variants.length,
      batchSize: BATCH_SIZE,
      userId: user.id
    })

    // Process variants in batches
    for (let i = 0; i < variants.length; i += BATCH_SIZE) {
      const batch = variants.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(variants.length / BATCH_SIZE)

      logger.info('Processing genetic data batch', { 
        chunkIndex,
        batchNumber, 
        totalBatches, 
        variantCount: batch.length, 
        userId: user.id 
      })

      // Only delete existing data on first chunk and first batch
      const shouldDeleteExisting = chunkIndex === 1 && i === 0

      try {
        // Use the specialized client with extended timeouts for genetic data operations
        // Add retry logic for timeout errors
        let retryCount = 0
        const maxRetries = 2
        let batchInserted, batchError
        
        while (retryCount <= maxRetries) {
          const result = await geneticUploadClient
            .rpc('bulk_insert_genetic_variants_batch', {
              p_user_id: user.id,
              p_source: uploadData.metadata.dataSource,
              p_variants: batch,
              p_delete_existing: shouldDeleteExisting
            } as any)
          
          batchInserted = result.data
          batchError = result.error
          
          // If successful or non-timeout error, break
          if (!batchError || !batchError.message.includes('timeout')) {
            break
          }
          
          retryCount++
          if (retryCount <= maxRetries) {
            logger.warn('Database timeout, retrying batch', {
              chunkIndex,
              batchNumber,
              retryCount,
              userId: user.id
            })
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000))
          }
        }

        if (batchError) {
          logger.error('Database insert error on batch', {
            chunkIndex,
            batchNumber, 
            error: batchError.message, 
            userId: user.id 
          })
          // Only clean up if this is the first chunk and we've inserted some data
          if (chunkIndex === 1 && totalInserted > 0) {
            logger.info('Cleaning up previously inserted variants due to batch failure', { 
              totalInserted, 
              userId: user.id 
            })
            await supabase.from('genetics_variants').delete().eq('user_id', user.id)
          }
          return NextResponse.json(
            { error: `Failed to save genetic data (chunk ${chunkIndex}/${totalChunks}, batch ${batchNumber}/${totalBatches})` },
            { status: 500 }
          )
        }

        totalInserted += batchInserted || 0
        
      } catch (batchError) {
        logger.error('Database insert error on batch', {
          chunkIndex,
          batchNumber, 
          error: batchError instanceof Error ? batchError.message : String(batchError), 
          userId: user.id 
        })
        // Only clean up if this is the first chunk and we've inserted some data
        if (chunkIndex === 1 && totalInserted > 0) {
          logger.info('Cleaning up previously inserted variants due to batch failure', { 
            totalInserted, 
            userId: user.id 
          })
          await supabase.from('genetics_variants').delete().eq('user_id', user.id)
        }
        return NextResponse.json(
          { error: `Failed to save genetic data (chunk ${chunkIndex}/${totalChunks}, batch ${batchNumber}/${totalBatches})` },
          { status: 500 }
        )
      }
    }

    // Use totalInserted instead of single operation result

    // Log the upload
    logger.info('Genetic data chunk uploaded successfully', { 
      chunkIndex,
      totalChunks,
      variantsInserted: totalInserted, 
      dataSource: uploadData.metadata.dataSource,
      userId: user.id 
    })

    return NextResponse.json({
      success: true,
      totalVariants: uploadData.metadata.totalVariants,
      variantsSaved: totalInserted,
      clinicalVariantsFound: 0, // This would need to be calculated if needed
      reportGenerated: isLastChunk, // Only generate report on last chunk
      chunkIndex,
      totalChunks,
      isLastChunk
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
