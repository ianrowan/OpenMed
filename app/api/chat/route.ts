import { streamText, tool } from 'ai'
import { z } from 'zod'
import { aiModel, MEDICAL_AGENT_PROMPT, getAIModel, ModelType } from '@/lib/ai'
import { BloodWorkTool } from '@/lib/tools/blood-work'
import { GeneticTool } from '@/lib/tools/genetics'
import { BloodWorkQuerySchema, GeneticQuerySchema, MedicalSearchSchema } from '@/types'
import { MedicalSearchTool } from '@/lib/tools/medical-search-tool'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { messages, model, conversation_id } = await req.json()

    // Get the AI model based on the request or use default
    const selectedModel = getAIModel(model) || aiModel

    // If no AI model is configured, return a demo response
    if (!selectedModel) {
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: 'OpenMed AI is running in demo mode. To enable full chat functionality, please add your OpenAI API key to the .env.local file. In the meantime, you can upload medical data and explore the visualizations!'
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with auth session
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Save the user message immediately if conversation_id is provided
    if (conversation_id && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'user') {
        await (supabase as any)
          .from('chat_messages')
          .insert({
            user_id: user.id,
            conversation_id,
            role: lastMessage.role,
            content: lastMessage.content,
            tool_calls: null
          })
      }
    }

    // Initialize tools with the authenticated Supabase client
    const bloodWorkTool = new BloodWorkTool(supabase)
    const geneticTool = new GeneticTool(supabase)
    const medicalSearchTool = new MedicalSearchTool()

    const result = streamText({
      model: selectedModel,
      system: MEDICAL_AGENT_PROMPT,
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
        if (conversation_id && result.text) {
          await (supabase as any)
            .from('chat_messages')
            .insert({
              user_id: user.id,
              conversation_id,
              role: 'assistant',
              content: result.text,
              tool_calls: result.toolCalls || null
            })
        }
      }
    })

    return result.toDataStreamResponse()

  } catch (error) {
    console.error('Chat API error:', error)
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
