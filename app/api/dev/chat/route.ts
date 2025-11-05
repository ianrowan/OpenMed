import { streamText, tool } from 'ai'
import { BloodWorkTool } from '@/lib/tools/blood-work'
import { GeneticTool } from '@/lib/tools/genetics'
import { MedicalSearchTool } from '@/lib/tools/medical-search-tool'
import { BloodWorkQuerySchema, GeneticQuerySchema, MedicalSearchSchema } from '@/types'
import { MEDICAL_AGENT_PROMPT, getAIModel } from '@/lib/ai'
import { createClient } from '@supabase/supabase-js'

const DEMO_MEDICAL_PROFILE = `
Age: 35 years old
Gender: Female
Weight: 65.5 kg
Height: 165 cm

Current Conditions:
- Prediabetes (HbA1c: 6.1%)
- Iron deficiency anemia (Ferritin: 28 ng/mL, low)
- Vitamin D deficiency (22 ng/mL, low)

Current Medications:
- Metformin 500mg daily
- Iron supplement 65mg daily
- Vitamin D3 2000 IU daily

Allergies:
- Penicillin
- Shellfish

Family History:
- Type 2 diabetes (mother)
- Breast cancer (aunt)
- Heart disease (father)

Lifestyle:
- Non-smoker
- Occasional alcohol consumption
- Moderate exercise routine
- Mediterranean diet
- 7 hours of sleep per night

Recent Blood Work Concerns (June 2025):
- Elevated HbA1c: 6.1% (prediabetic range)
- Low Ferritin: 28 ng/mL (iron deficiency)
- Low Vitamin D: 22 ng/mL (deficiency)
- High Total Cholesterol: 245 mg/dL
- High LDL: 156 mg/dL
- High Triglycerides: 185 mg/dL
- High C-Reactive Protein: 2.8 mg/L (inflammation)
- Elevated Calcium: 10.7 mg/dL
- High Iron Saturation: 69% (despite low ferritin)

Genetic Profile Highlights:
- MTHFR C677T: TT (homozygous - affects folate metabolism)
- APOE: ε3/ε2 (slightly protective against Alzheimer's)
- Lactose intolerant genotype
- CYP2C9*3: AT (affects warfarin metabolism)
- VKORC1: AA (sensitive to warfarin)
`

/**
 * DEV ONLY: Chat endpoint for prompt engineering and testing
 * 
 * Features:
 * - No authentication required
 * - Automatically uses demo data
 * - No rate limits
 * - Hot reloads with prompt changes
 * - Only available in development mode
 */
export async function POST(req: Request) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return new Response(
      JSON.stringify({ error: 'Dev endpoint not available in production' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get AI model (no custom key needed in dev)
    const selectedModel = getAIModel(model) || getAIModel('gpt-4.1-mini')
    
    if (!selectedModel) {
      return new Response(
        JSON.stringify({ error: 'No AI model configured. Set OPENAI_API_KEY in .env.local' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client for demo data access
    // This is safe in dev mode as we're only reading demo tables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Initialize tools with demo mode enabled
    const bloodWorkTool = new BloodWorkTool(supabase, true) // true = demo mode
    const geneticTool = new GeneticTool(supabase, true)
    const medicalSearchTool = new MedicalSearchTool()

    // Build system prompt with demo medical profile
    const systemPrompt = MEDICAL_AGENT_PROMPT + `\n\n=== USER MEDICAL PROFILE ===\n${DEMO_MEDICAL_PROFILE}\n\nUse this profile information to provide more personalized and relevant health insights. Consider the user's age, gender, current conditions, medications, and other factors when analyzing their data and providing recommendations.`

    // Stream the response
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
    })

    return result.toDataStreamResponse()

  } catch (error) {
    console.error('[DEV] Chat API request failed:', error)
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
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ 
    message: 'OpenMed AI Dev Chat API',
    version: '1.0.0-dev',
    features: [
      'No authentication required',
      'Automatic demo data',
      'No rate limits',
      'Hot reload support'
    ],
    demo_profile: {
      age: 35,
      gender: 'Female',
      conditions: ['Prediabetes', 'Iron deficiency', 'Vitamin D deficiency'],
      test_data: {
        blood_tests: 2,
        genetic_variants: 16,
        date_range: 'March 2025 - June 2025'
      }
    }
  })
}
