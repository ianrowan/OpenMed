'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Conversation } from '@/types'
import { MessageSquare, Plus, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  currentConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  onRefresh: () => void
  conversations: Conversation[]
  loading: boolean
  className?: string
}

export function ChatSidebar({ 
  currentConversationId, 
  onConversationSelect, 
  onNewChat,
  onDeleteConversation,
  onRefresh,
  conversations,
  loading,
  className
}: ChatSidebarProps) {
  const deleteConversation = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onDeleteConversation(id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const truncateTitle = (title: string, maxLength = 30) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-2">
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
        
        <Button 
          onClick={onRefresh}
          className="w-full justify-start gap-2"
          variant="ghost"
          size="sm"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/50 group",
                currentConversationId === conversation.id && "bg-accent border-primary/20"
              )}
              onClick={() => onConversationSelect(conversation.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {truncateTitle(conversation.title || 'Untitled Chat')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conversation.updated_at)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => deleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
