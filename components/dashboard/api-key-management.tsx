import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Key, Shield, Clock, Calendar } from 'lucide-react'
import { useUserApiKey } from '@/hooks/use-user-api-key'
import { Badge } from '@/components/ui/badge'

export function ApiKeyManagement() {
  const { hasKey, keyInfo, loading, error, saveKey, deleteKey } = useUserApiKey()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [keyName, setKeyName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newApiKey.trim()) return

    if (!newApiKey.startsWith('sk-')) {
      setSubmitError('Please enter a valid OpenAI API key (starts with sk-)')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      await saveKey(newApiKey.trim(), keyName.trim() || undefined)
      
      // Reset form
      setNewApiKey('')
      setKeyName('')
      setShowAddForm(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save API key')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteKey = async () => {
    if (!window.confirm('Are you sure you want to delete your API key? This will restore usage limits.')) {
      return
    }

    try {
      await deleteKey()
    } catch (err) {
      // Error is handled by the hook
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Use your own OpenAI API key to bypass daily usage limits and enjoy unlimited access to all AI models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasKey && keyInfo ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{keyInfo.key_name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Added {formatDate(keyInfo.created_at)}
                  </div>
                  {keyInfo.last_used_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used {formatDate(keyInfo.last_used_at)}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteKey}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your API key is active. You now have unlimited access to all AI models without daily limits.
                Your key is securely encrypted and never exposed in API responses.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            {!showAddForm ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No API Key Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add your OpenAI API key to bypass daily usage limits and unlock unlimited access.
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  Add OpenAI API Key
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSaveKey} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">OpenAI API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    required
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key will be securely encrypted and stored. Get your key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name (Optional)</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., My OpenAI Key"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                  />
                </div>

                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newApiKey.trim()}
                  >
                    {isSubmitting ? 'Saving...' : 'Save API Key'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewApiKey('')
                      setKeyName('')
                      setSubmitError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
