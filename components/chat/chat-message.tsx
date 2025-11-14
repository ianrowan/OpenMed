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
      "flex w-full gap-2 sm:gap-3 px-2 sm:px-0",
      isUser ? "justify-end" : "justify-start"
    )}>
      {isUser ? (
        <>
          {/* User message bubble */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl px-4 py-2.5 shadow-sm max-w-[75%] sm:max-w-[70%]">
            <div className="whitespace-pre-wrap text-sm break-words">
              {message.content}
            </div>
          </div>
          {/* User avatar */}
          <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-slate-700 shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
        </>
      ) : (
        /* AI message - plain text without avatar */
        <div className="text-sm text-slate-800 max-w-full sm:max-w-3xl">
          <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-3 mt-4 text-slate-900 break-words">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold mb-2 mt-3 text-slate-900 break-words">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold mb-2 mt-2 text-slate-900 break-words">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-2 text-slate-800 break-words">{children}</h4>,
                h5: ({ children }) => <h5 className="text-sm font-semibold mb-1 mt-1 text-slate-800 break-words">{children}</h5>,
                h6: ({ children }) => <h6 className="text-xs font-medium mb-1 mt-1 text-slate-700 break-words">{children}</h6>,
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed break-words">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-3 space-y-1 ml-5 sm:ml-6">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-3 space-y-1 ml-5 sm:ml-6">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-relaxed break-words pl-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800 break-all">{children}</code>,
                pre: ({ children }) => <pre className="bg-slate-900 text-slate-100 p-3 sm:p-4 rounded-lg text-xs font-mono overflow-x-auto mb-3 max-w-full shadow-sm">{children}</pre>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic mb-3 text-slate-600 break-words">{children}</blockquote>,
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-3 max-w-full rounded-lg border border-slate-200 shadow-sm">
                    <table className="border-collapse w-full min-w-full bg-white">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="border-b border-slate-200 px-3 sm:px-4 py-2 bg-slate-50 font-semibold text-left text-slate-900 text-xs sm:text-sm break-words">{children}</th>,
                td: ({ children }) => <td className="border-b border-slate-100 px-3 sm:px-4 py-2 text-slate-700 text-xs sm:text-sm break-words">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
      )}
    </div>
  )
}
