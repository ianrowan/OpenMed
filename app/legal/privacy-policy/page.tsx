import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'

export default function PrivacyPolicyPage() {
  const privacyPath = path.join(process.cwd(), 'legal', 'privacy-policy.md')
  const privacyContent = fs.readFileSync(privacyPath, 'utf-8')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(privacyContent) }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple markdown to HTML converter for basic formatting
function convertMarkdownToHTML(markdown: string): string {
  let html = markdown

  // Headers
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4">$1</h1>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-6 mb-3">$1</h2>')
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-4 mb-2">$1</h3>')
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xl font-bold mt-3 mb-2">$1</h4>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>')

  // Wrap consecutive list items
  html = html.replace(/(<li.*?<\/li>\n)+/g, '<ul class="list-disc my-4">$&</ul>')

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-4">')
  html = '<p class="mb-4">' + html + '</p>'

  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-4"><\/p>/g, '')

  return html
}
