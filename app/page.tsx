import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'

export default function HomePage() {
  return (
    <div className="container mx-auto h-screen max-w-4xl p-4">
      <div className="flex h-full flex-col">
        <header className="mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-primary">OpenMed</h1>
          <p className="text-muted-foreground">
            AI-powered medical data analysis. Chat with your health data to gain insights.
          </p>
        </header>
        <main className="flex-1">
          <ChatInterface />
        </main>
      </div>
    </div>
  )
}
