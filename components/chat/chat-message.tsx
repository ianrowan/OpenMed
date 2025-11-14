'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from 'ai'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex w-full sm:max-w-[85%] md:max-w-[80%] gap-2 sm:gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary text-primary-foreground">
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        
        <Card className={cn(
          "chat-message flex-1 min-w-0 overflow-hidden",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <CardContent className="p-3 sm:p-4">
            {isUser ? (
              <div className="whitespace-pre-wrap text-sm break-words">
                {message.content}
              </div>
            ) : (
              <div className="text-sm markdown-content overflow-hidden">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold mb-2 mt-4 text-foreground break-words">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold mb-2 mt-3 text-foreground break-words">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 text-foreground break-words">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-2 text-foreground break-words">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-xs font-semibold mb-1 mt-1 text-foreground break-words">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs font-medium mb-1 mt-1 text-foreground break-words">{children}</h6>,
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground break-words">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2 sm:ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2 sm:ml-4">{children}</ol>,
                    li: ({ children }) => <li className="text-sm text-foreground break-words">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    code: ({ children }) => <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono border break-all">{children}</code>,
                    pre: ({ children }) => <pre className="bg-background/50 p-2 rounded text-xs font-mono overflow-x-auto mb-2 border max-w-full">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-2 sm:pl-3 italic mb-2 text-muted-foreground break-words">{children}</blockquote>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-2 max-w-full">
                        <table className="border-collapse border border-border w-full min-w-full">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="border border-border px-1 sm:px-2 py-1 bg-muted/50 font-semibold text-left text-foreground text-xs sm:text-sm break-words">{children}</th>,
                    td: ({ children }) => <td className="border border-border px-1 sm:px-2 py-1 text-foreground text-xs sm:text-sm break-words">{children}</td>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
