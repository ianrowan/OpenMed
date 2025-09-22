import { track } from '@vercel/analytics/server'

/**
 * Track custom events for Vercel Analytics
 * This utility provides a centralized way to track important user actions
 */

// Define event types for type safety
export type AnalyticsEvent = 
  | 'chat_message_sent'
  | 'data_uploaded'
  | 'conversation_created'
  | 'custom_api_key_added'
  | 'model_changed'
  | 'sign_up'
  | 'sign_in'
  | 'profile_updated'

interface EventProperties {
  [key: string]: string | number | boolean
}

/**
 * Track a custom event with Vercel Analytics
 * @param event - The event name
 * @param properties - Optional properties to include with the event
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  // Only track in production or when VERCEL_ENV is set
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
    try {
      track(event, properties)
    } catch (error) {
      // Silently fail in case analytics is not available
      console.warn('Failed to track event:', event, error)
    }
  } else {
    // Log events in development for debugging
    console.log('Analytics Event:', event, properties)
  }
}

/**
 * Client-side event tracking (use in components)
 */
export function trackClientEvent(event: AnalyticsEvent, properties?: EventProperties) {
  // Import dynamically to avoid SSR issues
  if (typeof window !== 'undefined') {
    import('@vercel/analytics').then(({ track }) => {
      try {
        track(event, properties)
      } catch (error) {
        console.warn('Failed to track client event:', event, error)
      }
    })
  }
}

// Pre-defined tracking functions for common events
export const Analytics = {
  chatMessage: (model: string) => 
    trackClientEvent('chat_message_sent', { model }),
  
  dataUpload: (type: 'genetic' | 'bloodwork') => 
    trackClientEvent('data_uploaded', { type }),
  
  conversationCreated: () => 
    trackClientEvent('conversation_created'),
  
  customApiKeyAdded: () => 
    trackClientEvent('custom_api_key_added'),
  
  modelChanged: (from: string, to: string) => 
    trackClientEvent('model_changed', { from, to }),
  
  userSignUp: (method: 'email' | 'oauth') => 
    trackClientEvent('sign_up', { method }),
  
  userSignIn: (method: 'email' | 'oauth') => 
    trackClientEvent('sign_in', { method }),
  
  profileUpdated: () => 
    trackClientEvent('profile_updated')
}
