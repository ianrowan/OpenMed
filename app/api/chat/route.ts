import { streamText, tool } from 'ai'
import { z } from 'zod'
import { aiModel, MEDICAL_AGENT_PROMPT } from '@/lib/ai'
import { BloodWorkTool } from '@/lib/tools/blood-work'
import { GeneticTool } from '@/lib/tools/genetics'
import { BloodWorkQuerySchema, GeneticQuerySchema, MedicalSearchSchema } from '@/types'
import { MedicalSearchTool } from '@/lib/tools/medical-search-tool'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // If no AI model is configured, return a demo response
    if (!aiModel) {
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

    // Initialize tools
    const bloodWorkTool = new BloodWorkTool()
    const geneticTool = new GeneticTool()
    const medicalSearchTool = new MedicalSearchTool()

    const result = streamText({
      model: aiModel,
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
