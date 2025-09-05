'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { Trash2, Database, MessageSquare, FileText, User, Settings } from 'lucide-react'

interface DataCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  table: string
  count?: number
}

export function DeleteDataManager() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({})
  const { toast } = useToast()
  const supabase = createClient()

  const dataCategories: DataCategory[] = [
    {
      id: 'genetics_variants',
      name: 'Genetic Data',
      description: 'All genetic test results and variant data',
      icon: <Database className="h-4 w-4" />,
      table: 'genetics_variants'
    },
    {
      id: 'blood_test_results',
      name: 'Blood Work Results',
      description: 'All blood test results and biomarker data',
      icon: <FileText className="h-4 w-4" />,
      table: 'blood_test_results'
    },
    {
      id: 'chat_messages',
      name: 'Chat History',
      description: 'All AI chat conversations and messages',
      icon: <MessageSquare className="h-4 w-4" />,
      table: 'chat_messages'
    },
    {
      id: 'medical_profiles',
      name: 'Medical Profile',
      description: 'Personal medical information and preferences',
      icon: <User className="h-4 w-4" />,
      table: 'medical_profiles'
    },
    {
      id: 'user_preferences',
      name: 'User Preferences',
      description: 'App settings and notification preferences',
      icon: <Settings className="h-4 w-4" />,
      table: 'user_preferences'
    }
  ]

  const loadDataCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const counts: Record<string, number> = {}
      
      for (const category of dataCategories) {
        const { count } = await supabase
          .from(category.table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        counts[category.id] = count || 0
      }
      
      setDataCounts(counts)
    } catch (error) {
      console.error('Error loading data counts:', error)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleDeleteData = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data category to delete.",
        variant: "destructive"
      })
      return
    }

    setIsDeleting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const deletePromises = selectedCategories.map(categoryId => {
        const category = dataCategories.find(cat => cat.id === categoryId)
        if (!category) return Promise.resolve()
        
        return supabase
          .from(category.table)
          .delete()
          .eq('user_id', user.id)
      })

      await Promise.all(deletePromises)

      toast({
        title: "Data deleted successfully",
        description: `Deleted data from ${selectedCategories.length} category(ies).`,
      })

      // Reset state and reload counts
      setSelectedCategories([])
      await loadDataCounts()

    } catch (error) {
      console.error('Error deleting data:', error)
      toast({
        title: "Error deleting data",
        description: "An error occurred while deleting your data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Load data counts on component mount
  useEffect(() => {
    loadDataCounts()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          <span>Data Management</span>
        </CardTitle>
        <CardDescription>
          Delete your uploaded medical data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {dataCategories.map((category) => {
            const count = dataCounts[category.id] || 0
            const isSelected = selectedCategories.includes(category.id)
            
            return (
              <div key={category.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={category.id}
                  checked={isSelected}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  disabled={count === 0}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    {category.icon}
                    <span className="font-medium">{category.name}</span>
                    <Badge variant={count > 0 ? "default" : "secondary"}>
                      {count} {count === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {selectedCategories.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> You have selected {selectedCategories.length} data 
              category(ies) for deletion. This action cannot be undone.
            </p>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              disabled={selectedCategories.length === 0 || isDeleting}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : `Delete Selected Data (${selectedCategories.length})`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your selected
                medical data from our servers.
              </AlertDialogDescription>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground font-medium mb-2">
                  Selected categories:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedCategories.map(id => {
                    const category = dataCategories.find(cat => cat.id === id)
                    return (
                      <li key={id} className="text-sm text-muted-foreground">
                        {category?.name} ({dataCounts[id] || 0} items)
                      </li>
                    )
                  })}
                </ul>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteData}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
