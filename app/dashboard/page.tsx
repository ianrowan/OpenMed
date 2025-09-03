'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Settings, Upload, MessageSquare, Activity, Calendar, Ruler, Weight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">OpenMed</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.email ? getInitials(user.email) : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">
                  {profile ? 'Profile Complete' : 'Profile Incomplete'}
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Welcome to OpenMed!</span>
                </CardTitle>
                <CardDescription>
                  Your AI-powered medical data analysis platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/chat">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="flex items-center p-6">
                        <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h3 className="font-medium">AI Chat</h3>
                          <p className="text-sm text-gray-500">Ask about your health</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/upload">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="flex items-center p-6">
                        <Upload className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h3 className="font-medium">Upload Data</h3>
                          <p className="text-sm text-gray-500">Add your medical files</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/profile">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="flex items-center p-6">
                        <Settings className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <h3 className="font-medium">Profile</h3>
                          <p className="text-sm text-gray-500">Manage your info</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Account created</span>
                    <span className="text-gray-400">just now</span>
                  </div>
                  {profile && (
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-gray-600">Medical profile completed</span>
                      <span className="text-gray-400">just now</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge variant="secondary">Complete</Badge>
                    </div>
                    
                    {profile.birth_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Age
                        </span>
                        <span className="text-sm font-medium">
                          {calculateAge(profile.birth_date)} years
                        </span>
                      </div>
                    )}

                    {profile.sex && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Sex</span>
                        <span className="text-sm font-medium capitalize">
                          {profile.sex}
                        </span>
                      </div>
                    )}

                    {profile.height && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Ruler className="h-4 w-4 mr-1" />
                          Height
                        </span>
                        <span className="text-sm font-medium">
                          {profile.height} cm
                        </span>
                      </div>
                    )}

                    {profile.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Weight className="h-4 w-4 mr-1" />
                          Weight
                        </span>
                        <span className="text-sm font-medium">
                          {profile.weight} kg
                        </span>
                      </div>
                    )}

                    {profile.height && profile.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">BMI</span>
                        <span className="text-sm font-medium">
                          {calculateBMI(profile.height, profile.weight)}
                        </span>
                      </div>
                    )}

                    <div className="pt-4">
                      <Link href="/profile">
                        <Button variant="outline" className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-500">
                      Complete your medical profile to get personalized insights
                    </p>
                    <Link href="/auth/onboarding">
                      <Button className="w-full">
                        Complete Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Data Files</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Chat Sessions</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Activity</span>
                    <span className="text-sm font-medium">Today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
