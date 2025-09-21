import Link from 'next/link'
import { Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <span>Built open source to democratize health data analysis</span>
          <Link
            href="https://github.com/ianrowan/OpenMed"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
