import { useState, useEffect } from 'react'

interface ApiKeyInfo {
  id: string
  key_name: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

interface UseUserApiKeyResult {
  hasKey: boolean
  keyInfo: ApiKeyInfo | null
  loading: boolean
  error: string | null
  saveKey: (apiKey: string, keyName?: string) => Promise<void>
  deleteKey: () => Promise<void>
  refresh: () => Promise<void>
}

export function useUserApiKey(): UseUserApiKeyResult {
  const [hasKey, setHasKey] = useState(false)
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKeyInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user-api-key')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API key info')
      }

      setHasKey(data.hasKey)
      setKeyInfo(data.keyInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveKey = async (apiKey: string, keyName?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          keyName: keyName || 'OpenAI API Key'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key')
      }

      // Refresh the key info after saving
      await fetchKeyInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err // Re-throw so the UI can handle it
    } finally {
      setLoading(false)
    }
  }

  const deleteKey = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user-api-key', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete API key')
      }

      setHasKey(false)
      setKeyInfo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err // Re-throw so the UI can handle it
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchKeyInfo()
  }

  useEffect(() => {
    fetchKeyInfo()
  }, [])

  return {
    hasKey,
    keyInfo,
    loading,
    error,
    saveKey,
    deleteKey,
    refresh
  }
}
