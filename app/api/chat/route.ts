import { streamText, tool } from 'ai'
import { z } from 'zod'
import { aiModel, MEDICAL_AGENT_PROMPT, getAIModel, ModelType } from '@/lib/ai'
import { BloodWorkTool } from '@/lib/tools/blood-work'
import { GeneticTool } from '@/lib/tools/genetics'
import { BloodWorkQuerySchema, GeneticQuerySchema, MedicalSearchSchema } from '@/types'
import { MedicalSearchTool } from '@/lib/tools/medical-search-tool'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkUsageLimit, incrementUsage, formatUsageLimitError, MODEL_TIERS } from '@/lib/usage-limits'
import { getUserOpenAIKey, updateApiKeyLastUsed } from '@/lib/user-api-key'
import { createOpenAI } from '@ai-sdk/openai'
import { logger } from '@/lib/logger'

// Helper function to format medical profile information
function formatMedicalProfile(profile: any): string | null {
  const profileParts: string[] = []

  if (profile.age) {
    profileParts.push(`Age: ${profile.age} years`)
  }

  if (profile.gender) {
    profileParts.push(`Gender: ${profile.gender}`)
  }

  if (profile.weight) {
    profileParts.push(`Weight: ${profile.weight} kg`)
  }

  if (profile.height) {
    profileParts.push(`Height: ${profile.height} cm`)
  }

  if (profile.weight && profile.height) {
    const heightInMeters = profile.height / 100
    const bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1)
    profileParts.push(`BMI: ${bmi}`)
  }

  if (profile.conditions && Array.isArray(profile.conditions) && profile.conditions.length > 0) {
    profileParts.push(`Medical Conditions: ${profile.conditions.join(', ')}`)
  }

  if (profile.medications && Array.isArray(profile.medications) && profile.medications.length > 0) {
    profileParts.push(`Current Medications: ${profile.medications.join(', ')}`)
  }

  if (profile.allergies && Array.isArray(profile.allergies) && profile.allergies.length > 0) {
    profileParts.push(`Allergies: ${profile.allergies.join(', ')}`)
  }

  if (profile.family_history && Array.isArray(profile.family_history) && profile.family_history.length > 0) {
    profileParts.push(`Family History: ${profile.family_history.join(', ')}`)
  }

  if (profile.lifestyle && typeof profile.lifestyle === 'object') {
    const lifestyle = profile.lifestyle as Record<string, any>
    const lifestyleItems: string[] = []
    
    if (lifestyle.smoking) lifestyleItems.push(`Smoking: ${lifestyle.smoking}`)
    if (lifestyle.alcohol) lifestyleItems.push(`Alcohol: ${lifestyle.alcohol}`)
    if (lifestyle.exercise) lifestyleItems.push(`Exercise: ${lifestyle.exercise}`)
    if (lifestyle.diet) lifestyleItems.push(`Diet: ${lifestyle.diet}`)
    if (lifestyle.sleep) lifestyleItems.push(`Sleep: ${lifestyle.sleep}`)
    
    if (lifestyleItems.length > 0) {
      profileParts.push(`Lifestyle: ${lifestyleItems.join(', ')}`)
    }
  }

  return profileParts.length > 0 ? profileParts.join('\n') : null
}

export async function POST(req: Request) {
  let user: any = null
  
  try {
    const { messages, model, demo, conversation_id, demo_mode } = await req.json()

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
    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
    user = authenticatedUser
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has a custom OpenAI API key
    const userApiKeyResult = await getUserOpenAIKey()
    const usingCustomKey = userApiKeyResult.hasCustomKey && userApiKeyResult.apiKey

    let selectedModel;
    let shouldCheckUsage = true;

    if (usingCustomKey) {
      // User has custom key - create model with their key and bypass usage limits
      const customOpenAI = createOpenAI({
        apiKey: userApiKeyResult.apiKey
      })
      selectedModel = customOpenAI(model || 'gpt-4.1-mini')
      shouldCheckUsage = false;
      logger.debug('Using custom API key', { userId: user.id, action: 'custom_key_used' })
    } else {
      // Use system API key and check usage limits
      selectedModel = getAIModel(model) || aiModel
      
      // If no system AI model is configured, return a demo response
      if (!selectedModel) {
        return new Response(
          JSON.stringify({
            role: 'assistant',
            content: 'OpenMed AI is running in demo mode. To enable full chat functionality, please add your OpenAI API key to the .env.local file or configure your own API key in your account settings. In the meantime, you can upload medical data and explore the visualizations!'
          }),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Check usage limits only if using system API key
    if (shouldCheckUsage) {
      const usageCheck = await checkUsageLimit(supabase, user.id, model || 'gpt-4.1-mini')
      if (!usageCheck.allowed) {
        const modelTier = MODEL_TIERS[model || 'gpt-4.1-mini']
        const errorMessage = usageCheck.error || formatUsageLimitError(
          modelTier,
          usageCheck.currentUsage,
          usageCheck.limit,
          usageCheck.resetTime
        )
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            type: 'USAGE_LIMIT_EXCEEDED',
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
            resetTime: usageCheck.resetTime.toISOString(),
            modelTier
          }),
          { 
            status: 429, // Too Many Requests
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Create conversation if not provided and save the user message
    let actualConversationId = conversation_id
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'user') {
        // If no conversation_id, generate a new UUID for the conversation
        if (!actualConversationId) {
          actualConversationId = crypto.randomUUID()
          logger.debug('Created new conversation', { conversationId: actualConversationId, userId: user.id })
        }
        
        // Save the user message
        await (supabase as any)
          .from('chat_messages')
          .insert({
            user_id: user.id,
            conversation_id: actualConversationId,
            role: lastMessage.role,
            content: lastMessage.content,
            tool_calls: null
          })
      }
    }

    // Initialize tools with the authenticated Supabase client and demo mode
    const bloodWorkTool = new BloodWorkTool(supabase, demo_mode)
    const geneticTool = new GeneticTool(supabase, demo_mode)
    const medicalSearchTool = new MedicalSearchTool()

    // Get user's medical profile for new conversations (first message)
    let systemPrompt = MEDICAL_AGENT_PROMPT
    if (messages.length <= 1) { // First message in conversation
      try {
        const { data: medicalProfile } = await supabase
          .from('medical_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (medicalProfile) {
          const profileInfo = formatMedicalProfile(medicalProfile)
          if (profileInfo) {
            systemPrompt = MEDICAL_AGENT_PROMPT + `\n\n=== USER MEDICAL PROFILE ===\n${profileInfo}\n\nUse this profile information to provide more personalized and relevant health insights. Consider the user's age, gender, current conditions, medications, and other factors when analyzing their data and providing recommendations.`
          }
        }
      } catch (error) {
        logger.debug('Medical profile fetch failed', { userId: user.id, action: 'profile_fetch_error' })
        // Continue without profile info if there's an error
      }
    }

    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      messages,
      maxSteps: 20, // Allow multiple tool execution steps
      tools: {
        queryBloodWork: tool({
          description: 'Query and analyze blood test results and biomarkers. Use this to check specific biomarkers, find out-of-range values, analyze trends over time, or get a complete blood work overview.',
          parameters: BloodWorkQuerySchema,
          execute: async (params) => await bloodWorkTool.execute(params),
        }),
        queryGenetics: tool({
          description: 'Query genetic variants and SNPs from uploaded genetic data (23andMe, etc.). Use this to check for specific genes, variants, disease associations, or get a complete genetic risk profile.',
          parameters: GeneticQuerySchema,
          execute: async (params) => await geneticTool.execute(params),
        }),
        searchMedicalLiterature: tool({
          description: 'Search medical literature, research papers, and clinical guidelines. Use this to find evidence-based information about medical conditions, treatments, correlations, or latest research on specific health topics.',
          parameters: MedicalSearchSchema,
          execute: async (params) => await medicalSearchTool.execute(params),
        }),
      },
      onFinish: async (result) => {
        // Save the assistant response immediately when it's complete
        if (actualConversationId && result.text) {
          await (supabase as any)
            .from('chat_messages')
            .insert({
              user_id: user.id,
              conversation_id: actualConversationId,
              role: 'assistant',
              content: result.text,
              tool_calls: result.toolCalls || null
            })
        }
        
        if (usingCustomKey) {
          // Update last used timestamp for custom API key
          await updateApiKeyLastUsed()
        } else {
          // Only increment system usage count if using system API key
          await incrementUsage(supabase, user.id, model || 'gpt-4.1-mini')
        }
      }
    })

    return result.toDataStreamResponse()

  } catch (error) {
    logger.error('Chat API request failed', error, { 
      endpoint: '/api/chat',
      userId: user?.id,
      action: 'chat_request'
    })
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function GET() {
  return Response.json({ 
    message: 'OpenMed AI Chat API',
    version: '1.0.0',
    capabilities: [
      'Blood work analysis',
      'Genetic data interpretation', 
      'Medical literature search',
      'Multi-modal health insights'
    ]
  })
}
