import { Key, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUserApiKey } from '@/hooks/use-user-api-key'

export function CustomKeyIndicator() {
  const { hasKey, loading } = useUserApiKey()

  if (loading || !hasKey) {
    return null
  }

  return (
    <Badge 
      variant="secondary" 
      className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
    >
      <Key className="h-3 w-3 mr-1" />
      Custom API Key Active
    </Badge>
  )
}

interface CustomKeyBannerProps {
  className?: string
}

export function CustomKeyBanner({ className }: CustomKeyBannerProps) {
  const { hasKey, loading } = useUserApiKey()

  if (loading || !hasKey) {
    return null
  }

  return (
    <div className={`bg-green-50 border-l-4 border-green-400 p-3 ${className}`}>
      <div className="flex items-center">
        <Shield className="h-4 w-4 text-green-600 mr-2" />
        <div className="text-sm">
          <p className="text-green-700 font-medium">
            Using your custom OpenAI API key
          </p>
          <p className="text-green-600">
            Unlimited usage - no daily limits apply
          </p>
        </div>
      </div>
    </div>
  )
}
