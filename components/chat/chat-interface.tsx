'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMessage } from '@/components/chat/chat-message'
import { ToolCallVisualization } from '@/components/chat/tool-call-visualization'
import { ModelSelector } from '@/components/chat/model-selector'
import { FileUpload } from '@/components/data/file-upload'
import { AIProcessingStages } from '@/components/ui/ai-processing'
import { Send, Upload, Activity } from 'lucide-react'
import { ModelType } from '@/lib/ai'

export function ChatInterface() {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt-4.1-mini')

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const hasMessages = messages.length > 0

  if (!hasMessages) {
    return (
      <div className="flex h-full flex-col max-h-full">
        {/* Fixed header area with model selector */}
        <div className="border-b p-4 bg-background flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">OpenMed AI Chat</h1>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Welcome content area */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-4 min-h-0">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Welcome to OpenMed AI</h2>
            <p className="text-muted-foreground max-w-md">
              Upload your medical data and start chatting to gain insights about your health.
              I can analyze blood work, genetic data, and search medical literature.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-2xl w-full">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowUpload(true)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Data
                </CardTitle>
                <CardDescription>
                  Upload blood work, genetic test results, or other medical data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Example Questions</CardTitle>
                <CardDescription>
                  Try asking about biomarker trends, genetic variants, or health correlations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {showUpload && (
            <div className="w-full max-w-2xl">
              <FileUpload onUploadComplete={() => setShowUpload(false)} />
            </div>
          )}
        </div>

        {/* Fixed chat input area at bottom */}
        <div className="border-t p-4 bg-background flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your health data... (e.g., 'What are my out of range biomarkers?')"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col max-h-full">
      {/* Fixed header area with model selector */}
      <div className="border-b p-4 bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">OpenMed AI Chat</h1>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message, index) => (
          <div key={message.id} className="space-y-4">
            {/* Show loading animation above tool cards for the last assistant message being processed */}
            {message.role === 'assistant' && isLoading && index === messages.length - 1 && (
              <AIProcessingStages />
            )}
            
            {/* Show tool calls first (above the text) */}
            {message.toolInvocations?.map((toolCall) => (
              <ToolCallVisualization key={toolCall.toolCallId} toolCall={toolCall} />
            ))}
            
            {/* Then show the message content */}
            {message.role !== 'data' && (
              <ChatMessage message={message} />
            )}
          </div>
        ))}
        
        {/* Show loading animation when starting a new response (no assistant message yet) */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="space-y-4">
            <AIProcessingStages />
          </div>
        )}
      </div>

      {/* Fixed chat input area at bottom */}
      <div className="border-t p-4 bg-background flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your health data..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
