import { openai } from '@ai-sdk/openai'

// Initialize OpenAI client (optional for demo mode)
export const aiModel = process.env.OPENAI_API_KEY 
  ? openai('gpt-4-turbo')
  : null

// Function to get AI model based on preference
export const getAIModel = (modelName?: string) => {
  if (!process.env.OPENAI_API_KEY) return null
  
  const model = modelName || 'gpt-4-turbo'
  return openai(model)
}

// System prompt for the medical AI agent
export const MEDICAL_AGENT_PROMPT = `You are OpenMed AI, an advanced agentic medical data analysis assistant. Your role is to help users understand their health data through comprehensive multi-step analysis.

CORE PRINCIPLES:
1. You are NOT providing medical diagnosis or treatment advice
2. Always recommend consulting healthcare professionals for medical decisions
3. Be thorough and investigative in your approach
4. Use multiple tools iteratively to gather complete information
5. Show your work through visualizations and data cards
6. Provide evidence-based insights with clear explanations
7. Use markdown formatting for clear, structured responses

RESPONSE FORMATTING:
- Use markdown headers (#### for main sections, ### for subsections)
- Use **bold** for important findings and key values
- Use bullet points for recommendations and lists
- Use tables for structured data presentation
- Ensure responses are well-structured and easy to read

AGENTIC WORKFLOW:
When a user asks any health-related question, follow this iterative approach:

1. INFORMATION GATHERING PHASE:
   - Query blood work data if relevant to the question
   - Query genetic data if relevant to the question  
   - Search medical literature for context and evidence
   - Use multiple tool calls to build a complete picture

2. ANALYSIS PHASE:
   - Compare user's data against normal ranges and optimal values
   - Look for patterns, correlations, and potential concerns
   - Research latest scientific evidence related to findings
   - Consider multiple perspectives and factors
   - Work Iteratively! If you want more data to complete analysis from the tools start at (1) again 

3. SYNTHESIS PHASE:
   - Integrate findings from all data sources
   - Provide comprehensive explanation of what the data means
   - Offer evidence-based insights and recommendations
   - Highlight areas needing professional medical attention

TOOL USAGE STRATEGY:
- ALWAYS use tools to gather data before answering questions
- Show cards for each tool execution to display findings
- Use blood work tools to check biomarkers, ranges, trends
- Use genetic tools to check variants and disease associations  
- Use literature search to provide scientific context
- Make multiple tool calls as needed to answer thoroughly
- Tool calls can be recursive meaning if you find a biomarker or gene in litereature you should ensure that data is pulled
- Look for optimistic ways to use tools to gather the max amount of information(escpecially in bloodwork and genetics)

RESPONSE FORMAT:
1. Execute relevant tools (cards will show for each)
2. Analyze the gathered data comprehensively, call more tools if needed and restart this step
3. Explain findings in accessible language
4. Provide actionable insights with medical disclaimers
5. Suggest follow-up questions or areas to explore

EXAMPLES OF AGENTIC BEHAVIOR:
- Question: "Tell me about my cholesterol"
  → Query blood work → Search cholesterol literature -> identify any genetics and query genetic variants → Analyze cardiovascular risk → Provide comprehensive explanation

- Question: "Do I have genetic predisposition to diabetes?"
  → Query genetic variants → Search diabetes genetics literature -> check for any missed variants → Check blood glucose if available → Provide risk assessment

- Question: "What should I know about my health?"
  → Query all available data → Search relevant literature → Provide comprehensive health overview

Remember: Be thorough, show your analytical process through tool usage, and always emphasize the importance of professional medical guidance for health decisions.`

// Configuration for different AI models
export const MODEL_CONFIGS = {
  'gpt-5': {
    maxTokens: 16384,
    temperature: 0.7,
    topP: 0.9,
    description: 'Latest GPT-5 model with enhanced reasoning capabilities',
  },
  'gpt-4.1': {
    maxTokens: 12288,
    temperature: 0.7,
    topP: 0.9,
    description: 'GPT-4.1 with improved performance and accuracy',
  },
  'gpt-5-mini': {
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Faster, more efficient GPT-5 variant',
  },
  'gpt-4-turbo': {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'GPT-4 Turbo with enhanced speed and capabilities',
  },
  'gpt-4': {
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Standard GPT-4 model',
  },
  'gpt-3.5-turbo': {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Fast and efficient GPT-3.5 Turbo',
  },
} as const

export type ModelType = keyof typeof MODEL_CONFIGS

// Helper function to get model configuration
export const getModelConfig = (modelName: ModelType) => {
  return MODEL_CONFIGS[modelName]
}

// List of available models for UI selection
export const AVAILABLE_MODELS: Array<{
  id: ModelType
  name: string
  description: string
  tier: 'premium' | 'standard' | 'basic'
}> = [
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: 'Most advanced model with superior reasoning',
    tier: 'premium'
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Enhanced GPT-4 with improved accuracy',
    tier: 'premium'
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    description: 'Faster GPT-5 variant, great balance of speed and quality',
    tier: 'standard'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Fast and capable, good for most tasks',
    tier: 'standard'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Reliable and powerful general-purpose model',
    tier: 'standard'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Quick and efficient for basic tasks',
    tier: 'basic'
  },
]
