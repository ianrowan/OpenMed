#!/usr/bin/env node

/**
 * OpenMed AI Prompt Testing Script
 * 
 * Usage:
 *   npm run test-prompt "What are my latest blood test results?"
 *   npm run test-prompt "Do I have any concerning genetic variants?"
 *   npm run test-prompt "What lifestyle changes should I make based on my data?"
 * 
 * This script:
 * - Calls the dev-only /api/dev/chat endpoint
 * - Uses demo data automatically
 * - Displays streaming responses in real-time
 * - Works with any prompt/question
 */

const API_URL = 'http://localhost:3000/api/dev/chat'

async function testPrompt(prompt) {
  if (!prompt || prompt.trim() === '') {
    console.error('❌ Error: Please provide a prompt')
    console.log('\nUsage:')
    console.log('  npm run test-prompt "Your question here"')
    console.log('\nExamples:')
    console.log('  npm run test-prompt "What are my latest blood test results?"')
    console.log('  npm run test-prompt "Do I have the MTHFR gene variant?"')
    console.log('  npm run test-prompt "What are my cholesterol trends?"')
    process.exit(1)
  }

  console.log('\n🧬 OpenMed AI - Prompt Testing\n')
  console.log('📝 Prompt:', prompt)
  console.log('🔗 Endpoint:', API_URL)
  console.log('\n' + '─'.repeat(80) + '\n')

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4.1' // Use full model for sanity evaluation
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ API Error:', error)
      process.exit(1)
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    console.log('🤖 Assistant:\n')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('0:')) {
          // Text content
          try {
            const content = JSON.parse(line.slice(2))
            if (typeof content === 'string') {
              process.stdout.write(content)
              fullResponse += content
            }
          } catch (e) {
            // Ignore parsing errors for partial chunks
          }
        } else if (line.startsWith('9:')) {
          // Tool call
          try {
            const toolData = JSON.parse(line.slice(2))
            if (toolData.toolName) {
              console.log(`\n\n🔧 [Tool: ${toolData.toolName}]`)
              if (toolData.args) {
                console.log('   Args:', JSON.stringify(toolData.args, null, 2).split('\n').join('\n   '))
              }
              console.log()
            }
          } catch (e) {
            // Ignore
          }
        } else if (line.startsWith('a:')) {
          // Tool result
          try {
            const resultData = JSON.parse(line.slice(2))
            if (resultData.result) {
              console.log('   ✅ Result received\n')
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    console.log('\n\n' + '─'.repeat(80) + '\n')
    console.log('✅ Response complete')
    console.log(`📊 Length: ${fullResponse.length} characters`)
    console.log()

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Make sure:')
    console.log('  1. Your dev server is running (npm run dev)')
    console.log('  2. The server is accessible at', API_URL)
    console.log('  3. OPENAI_API_KEY is set in .env.local')
    process.exit(1)
  }
}

// Get prompt from command line arguments
const prompt = process.argv.slice(2).join(' ')
testPrompt(prompt)
