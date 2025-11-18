import { LanguageModelV1, LanguageModelV1CallWarning, LanguageModelV1FinishReason, LanguageModelV1StreamPart } from '@ai-sdk/provider'

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: any
  }
}

interface OllamaToolCall {
  id: string
  function: {
    name: string
    arguments: any
  }
}

interface OllamaResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
    tool_calls?: OllamaToolCall[]
  }
  done: boolean
  done_reason?: string
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * Creates a custom LanguageModelV1 provider for Ollama that supports tool calling.
 * 
 * This provider uses Ollama's native /api/chat endpoint with tool calling support.
 * It's compatible with AI SDK v4 and properly handles tool calls, streaming, and error cases.
 * 
 * @param modelId - The Ollama model to use (e.g., 'gemma2:27b', 'llama3.1:8b')
 * @param baseURL - The Ollama API base URL (default: 'http://localhost:11434/api')
 * @returns A LanguageModelV1 provider instance
 */
export function createOllamaLanguageModel(
  modelId: string,
  baseURL: string = 'http://localhost:11434/api'
): LanguageModelV1 {
  // Validate inputs
  if (!modelId || typeof modelId !== 'string') {
    throw new Error('Invalid modelId: must be a non-empty string')
  }
  
  if (!baseURL || typeof baseURL !== 'string') {
    throw new Error('Invalid baseURL: must be a non-empty string')
  }

  const provider = {
    specificationVersion: 'v1' as const,
    provider: 'ollama.custom' as const,
    modelId,
    defaultObjectGenerationMode: 'json' as const,

    async doGenerate(options: {
      prompt: Array<{ role: string; content: string | Array<any> }>
      mode?: { type: string; tools?: any; toolChoice?: any }
    }) {
      try {
        // Convert AI SDK messages to Ollama format
        const messages: OllamaMessage[] = []
        
        for (const msg of options.prompt) {
          // Handle tool results - convert to user messages with formatted results
          if (msg.role === 'tool') {
            const toolContent = Array.isArray(msg.content)
              ? msg.content.map((part: any) => {
                  if (part.type === 'tool-result') {
                    return `Tool "${part.toolName}" (ID: ${part.toolCallId}) returned:\n${JSON.stringify(part.result, null, 2)}`
                  }
                  return ''
                }).filter(Boolean).join('\n\n')
              : msg.content
            
            messages.push({
              role: 'user',
              content: `TOOL RESULTS:\n${toolContent}`
            })
            continue
          }
          
          // Handle regular messages
          let content = ''
          
          if (typeof msg.content === 'string') {
            content = msg.content
          } else if (Array.isArray(msg.content)) {
            // Handle multi-modal content (extract text parts only)
            // Note: tool-call parts are handled separately by Ollama's native tool system
            content = msg.content
              .filter(part => part.type === 'text')
              .map(part => part.text)
              .join('\n')
          }
          
          messages.push({
            role: msg.role as 'system' | 'user' | 'assistant',
            content
          })
        }

        // Check if any tool results are present in THIS turn (not entire history)
        // We only want to block tools if we're responding to tool results right now
        // Find the last user message index
        const lastUserMessageIndex = options.prompt.map((m, i) => ({ msg: m, idx: i }))
          .reverse()
          .find(item => item.msg.role === 'user')?.idx ?? -1
        
        // Check if there are tool results after the last user message (current turn)
        const hasToolResultsInCurrentTurn = lastUserMessageIndex >= 0 && 
          options.prompt.slice(lastUserMessageIndex).some(msg => msg.role === 'tool')
        
        // Convert AI SDK tools to Ollama format
        // CRITICAL: Don't provide tools again if we already have tool results in THIS turn
        // This prevents the model from calling tools repeatedly in the same turn
        const tools: OllamaTool[] | undefined = (!hasToolResultsInCurrentTurn && options.mode?.tools)
          ? options.mode.tools.map((tool: any) => ({
              type: 'function' as const,
              function: {
                name: tool.name,
                description: tool.description || '',
                parameters: tool.parameters || {}
              }
            }))
          : undefined

        // Build request body
        const requestBody = {
          model: modelId,
          messages,
          ...(tools && tools.length > 0 && { tools }),
          stream: false,
          // Add options for better performance with large models
          options: {
            num_ctx: 8192, // Context window (32K tokens - good balance for most models)
            temperature: 0.3, // Lower temperature to reduce randomness and looping
            top_p: 0.9,
            repeat_penalty: 1.1, // Penalize repetition
            stop: ["</tool>", "<tool>"], // Stop sequences to prevent tool loops
          }
        }

        // Make request to Ollama
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 240000) // 2 minute timeout for large models

        let response: Response
        try {
          response = await fetch(`${baseURL}/chat`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          })
        } finally {
          clearTimeout(timeout)
        }

        // Handle errors
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[OLLAMA] API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: `${baseURL}/chat`,
            model: modelId
          })
          throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`)
        }

        // Parse response
        let data: OllamaResponse
        try {
          data = await response.json()
        } catch (e) {
          console.error('[OLLAMA] Failed to parse JSON response:', e)
          throw new Error('Invalid JSON response from Ollama')
        }

        // Validate response structure
        if (!data.message) {
          console.error('[OLLAMA] Invalid response structure:', data)
          throw new Error('Invalid response from Ollama: missing message field')
        }

        // Extract text and tool calls
        const text = data.message.content || ''
        const toolCalls = data.message.tool_calls?.map(tc => {
          // Validate tool call structure
          if (!tc.id || !tc.function || !tc.function.name) {
            console.warn('[OLLAMA] Invalid tool call structure:', tc)
            return null
          }

          // Arguments might be an object or already a string
          let argsString: string
          if (typeof tc.function.arguments === 'string') {
            argsString = tc.function.arguments
          } else {
            argsString = JSON.stringify(tc.function.arguments)
          }

          return {
            toolCallType: 'function' as const,
            toolCallId: tc.id,
            toolName: tc.function.name,
            args: argsString
          }
        }).filter(Boolean) || [] // Remove any null entries

        // Determine finish reason
        let finishReason: LanguageModelV1FinishReason = 'stop'
        if (toolCalls.length > 0) {
          finishReason = 'tool-calls'
        } else if (data.done_reason === 'length') {
          finishReason = 'length'
        }

        // Build result
        const result = {
          text,
          toolCalls: toolCalls as any, // Type assertion needed for AI SDK compatibility
          finishReason,
          usage: {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0
          },
          rawCall: { 
            rawPrompt: messages, 
            rawSettings: {
              model: modelId,
              toolCount: tools?.length || 0
            }
          },
          warnings: [] as LanguageModelV1CallWarning[]
        }

        return result

      } catch (error: any) {
        // Enhanced error handling
        if (error.name === 'AbortError') {
          console.error('[OLLAMA] Request timeout after 120 seconds')
          throw new Error('Ollama request timeout - the model may be too large or the server is slow to respond')
        }
        
        if (error.code === 'ECONNREFUSED') {
          console.error('[OLLAMA] Connection refused - is Ollama running?')
          throw new Error(`Cannot connect to Ollama at ${baseURL} - ensure Ollama is running`)
        }

        if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
          console.error('[OLLAMA] Connection timeout - cannot reach Ollama server')
          throw new Error(`Connection timeout to Ollama at ${baseURL} - check network and firewall settings`)
        }

        // Re-throw with context
        console.error('[OLLAMA] doGenerate error:', error)
        throw error
      }
    },

    async doStream(options: {
      prompt: Array<{ role: string; content: string }>
      mode?: { type: string; tools?: any }
    }) {
      const self = this
      
      return {
        stream: new ReadableStream({
          async start(controller) {
            try {
              // Call doGenerate to get the complete response
              const result = await self.doGenerate(options)
              
              // Emit text if present
              if (result.text) {
                controller.enqueue({
                  type: 'text-delta' as const,
                  textDelta: result.text
                })
              }

              // Emit tool calls
              for (const toolCall of result.toolCalls) {
                controller.enqueue({
                  type: 'tool-call' as const,
                  toolCallType: toolCall.toolCallType,
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  args: toolCall.args
                })
              }

              // Emit finish
              controller.enqueue({
                type: 'finish' as const,
                finishReason: result.finishReason,
                usage: result.usage
              })

              controller.close()

            } catch (error) {
              console.error('[OLLAMA] Stream error:', error)
              
              // Emit error to stream
              controller.enqueue({
                type: 'error' as const,
                error: error instanceof Error ? error : new Error(String(error))
              } as any)
              
              controller.error(error)
            }
          }
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
        warnings: [] as LanguageModelV1CallWarning[]
      }
    }
  }

  return provider as LanguageModelV1
}
