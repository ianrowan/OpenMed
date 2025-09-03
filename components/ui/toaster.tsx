"use client"

import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Toaster() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm max-w-sm
            ${
              toast.variant === "destructive"
                ? "border-red-200 bg-red-50/90 text-red-800"
                : "border-green-200 bg-green-50/90 text-green-800"
            }
          `}
        >
          {toast.variant === "destructive" ? (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            {toast.title && (
              <h4 className="font-medium">{toast.title}</h4>
            )}
            {toast.description && (
              <p className="text-sm opacity-90">{toast.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
