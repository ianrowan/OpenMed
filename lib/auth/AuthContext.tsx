'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { MedicalProfile, MedicalProfileFormData } from '@/types'
import { Analytics } from '@/lib/analytics'
import { resolve } from 'path'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: MedicalProfile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: any }>
  updateProfile: (profile: Partial<MedicalProfile> | MedicalProfileFormData) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<MedicalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Failsafe timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('AuthContext: Failsafe timeout reached, setting loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [])

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for userId:', userId)
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, resolve) => {
        setTimeout(() => resolve(), 500) // 10 second timeout
      })
      
      const fetchPromise = supabase
        .from('medical_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.log('Error fetching profile:', error)
        return null
      }

      if (error && error.code === 'PGRST116') {
        console.log('AuthContext: No profile found for user')
      } else if (data) {
        console.log('AuthContext: Profile fetched successfully')
      }

      return data
    } catch (error) {
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthContext: Error getting session:', error)
        } else {
          console.log('AuthContext: Initial session:', session?.user?.email || 'No user')
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id)
          try {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } catch (error) {
            console.error('AuthContext: Error fetching profile in initial load:', error)
            setProfile(null)
          }
        }
        
        console.log('AuthContext: Initial loading complete')
        setLoading(false)
      } catch (error) {
        console.error('AuthContext: Error in getSession:', error)
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, session?.user?.email || 'No user')
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } catch (error) {
            console.error('AuthContext: Error fetching profile in auth state change:', error)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        
        console.log('AuthContext: Setting loading to false after auth state change')
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    // Track successful sign up
    if (!error) {
      Analytics.userSignUp('email')
    }
    
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Track successful sign in
    if (!error) {
      Analytics.userSignIn('email')
    }
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const updateProfile = async (profileData: Partial<MedicalProfile> | MedicalProfileFormData) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      // Convert form data to database format
      const processedData: any = { ...profileData }
      
      // Handle birth_date to age conversion if present
      if ('birth_date' in profileData && profileData.birth_date) {
        const birthDate = new Date(profileData.birth_date as string)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        // Adjust age if birthday hasn't occurred this year
        const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age
        
        processedData.age = finalAge
        // Remove birth_date as it's not in the database schema
        delete processedData.birth_date
      }

      // Handle sex to gender conversion if present
      if ('sex' in profileData && profileData.sex) {
        processedData.gender = profileData.sex
        delete processedData.sex
      }

      // Create the update object
      const updateData = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
        ...processedData,
      }

      const { error } = await supabase
        .from('medical_profiles')
        .upsert(updateData as any)

      if (!error) {
        await refreshProfile()
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
