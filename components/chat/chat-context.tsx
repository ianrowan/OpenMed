'use client'

import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { Conversation, ChatMessage } from '@/types'

interface ChatContextType {
  currentConversation: Conversation | null
  conversations: Conversation[]
  loading: boolean
  createNewConversation: () => Promise<Conversation | null>
  loadConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  refreshConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | null>(null)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation)
        return data.conversation
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to create conversation:', response.status, errorData)
        return null
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
    return null
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== id))
        if (currentConversation?.id === id) {
          setCurrentConversation(null)
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }, [currentConversation])

  const refreshConversations = useCallback(async () => {
    await fetchConversations()
  }, [])

  const value = {
    currentConversation,
    conversations,
    loading,
    createNewConversation,
    loadConversation,
    deleteConversation,
    refreshConversations
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
