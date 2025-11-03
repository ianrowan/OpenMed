'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeleteDataManager } from '@/components/dashboard/delete-data-manager'
import BloodworkVisualizationCard from '@/components/dashboard/bloodwork-visualization-card'
import GeneticSearchCard from '@/components/dashboard/genetic-search-card'
import { ApiKeyManagement } from '@/components/dashboard/api-key-management'
import { BloodworkDialog } from '@/components/dialogs/bloodwork-dialog'
import { Toaster } from '@/components/ui/toaster'
import { User, Settings, Upload, MessageSquare, Activity, Calendar, Ruler, Weight, TestTube } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [demoMode, setDemoMode] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Activity className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                OpenMed
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Demo Mode Toggle */}
              <div className="flex items-center space-x-1 md:space-x-2 bg-slate-100 rounded-full px-2 md:px-3 py-1 md:py-1.5">
                <TestTube className="h-3 w-3 md:h-4 md:w-4 text-slate-600" />
                <Label htmlFor="demo-mode" className="text-xs md:text-sm font-medium cursor-pointer hidden sm:inline">Demo</Label>
                <Switch
                  id="demo-mode"
                  checked={demoMode}
                  onCheckedChange={setDemoMode}
                  className="data-[state=checked]:bg-blue-600 scale-75 md:scale-100"
                />
              </div>
              
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold shadow-lg">
                {user?.email ? getInitials(user.email) : 'U'}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  {profile ? (
                    <><span className="h-2 w-2 bg-green-500 rounded-full"></span> Profile Complete</>
                  ) : (
                    <><span className="h-2 w-2 bg-amber-500 rounded-full"></span> Profile Incomplete</>
                  )}
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="border-slate-300 hover:bg-slate-100 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 hidden sm:flex">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Welcome Card */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center space-x-2 text-xl md:text-2xl">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  <span>Welcome to OpenMed!</span>
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Your AI-powered medical data analysis platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <Link href="/chat" className="group">
                    <Card className="border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-white sm:group-hover:scale-105">
                      <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-2 md:space-y-3">
                        <div className="p-2 md:p-3 bg-blue-100 rounded-xl md:rounded-2xl group-hover:bg-blue-600 transition-colors">
                          <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base md:text-lg">AI Chat</h3>
                          <p className="text-xs md:text-sm text-slate-600">Ask about your health</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/upload" className="group">
                    <Card className="border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 cursor-pointer bg-gradient-to-br from-emerald-50 to-white sm:group-hover:scale-105">
                      <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-2 md:space-y-3">
                        <div className="p-2 md:p-3 bg-emerald-100 rounded-xl md:rounded-2xl group-hover:bg-emerald-600 transition-colors">
                          <Upload className="h-6 w-6 md:h-8 md:w-8 text-emerald-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base md:text-lg">Upload Data</h3>
                          <p className="text-xs md:text-sm text-slate-600">Add your medical files</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/profile" className="group">
                    <Card className="border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-200 cursor-pointer bg-gradient-to-br from-purple-50 to-white sm:group-hover:scale-105">
                      <CardContent className="flex flex-col items-center justify-center p-4 md:p-6 text-center space-y-2 md:space-y-3">
                        <div className="p-2 md:p-3 bg-purple-100 rounded-xl md:rounded-2xl group-hover:bg-purple-600 transition-colors">
                          <Settings className="h-6 w-6 md:h-8 md:w-8 text-purple-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base md:text-lg">Profile</h3>
                          <p className="text-xs md:text-sm text-slate-600">Manage your info</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Need Bloodwork CTA */}
            <div className="flex justify-center">
              <BloodworkDialog 
                triggerText="Need Bloodwork? Get comprehensive testing" 
                triggerVariant="secondary" 
                triggerSize="default" 
                className="w-full sm:w-auto"
              />
            </div>

            {/* Demo Mode Alert */}
            {demoMode && (
              <Alert className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
                <TestTube className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-900 font-medium">
                  <strong className="font-bold">Demo Mode Active:</strong> You're viewing sample medical data. Toggle off Demo Mode to see your own data.
                </AlertDescription>
              </Alert>
            )}

            {/* Blood Work Results Visualization */}
            <BloodworkVisualizationCard demoMode={demoMode} />

            {/* Genetic Variant Search */}
            <GeneticSearchCard demoMode={demoMode} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Profile Summary */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Status</span>
                      <Badge className="bg-green-600 hover:bg-green-700">Complete</Badge>
                    </div>
                    
                                        {profile.age && (
                      <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="text-sm text-slate-600 font-medium">Age</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {profile.age} years
                        </span>
                      </div>
                    )}

                    {profile.gender && (
                      <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="text-sm text-slate-600 font-medium">Gender</span>
                        <span className="text-sm font-semibold text-slate-900 capitalize">
                          {profile.gender}
                        </span>
                      </div>
                    )}

                    {profile.height && (
                      <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="text-sm text-slate-600 font-medium flex items-center">
                          <Ruler className="h-4 w-4 mr-1.5 text-blue-500" />
                          Height
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {profile.height} cm
                        </span>
                      </div>
                    )}

                    {profile.weight && (
                      <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="text-sm text-slate-600 font-medium flex items-center">
                          <Weight className="h-4 w-4 mr-1.5 text-blue-500" />
                          Weight
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {profile.weight} kg
                        </span>
                      </div>
                    )}

                    {profile.height && profile.weight && (
                      <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="text-sm text-slate-600 font-medium">BMI</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {calculateBMI(profile.height, profile.weight)}
                        </span>
                      </div>
                    )}

                    <div className="pt-6 border-t border-slate-100">
                      <Link href="/profile">
                        <Button variant="outline" className="w-full group hover:border-blue-300 hover:bg-blue-50 transition-all">
                          <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                          Edit Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">
                      Complete your medical profile to get personalized insights
                    </p>
                    <Link href="/profile">
                      <Button variant="outline" className="w-full group hover:border-blue-300 hover:bg-blue-50 transition-all">
                        <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                        Complete Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API Key Management */}
            <ApiKeyManagement />

            {/* Delete Data Manager */}
            <DeleteDataManager />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
