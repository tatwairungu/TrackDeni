import { useState, useEffect } from 'react'
import { 
  shouldUseLiteMode, 
  enableLiteMode, 
  disableLiteMode, 
  resetLiteModePreference,
  isLiteModeRecommended,
  getLiteModeState,
  logLiteModeStatus 
} from '../utils/deviceDetection'

export const useLiteMode = () => {
  const [liteModeState, setLiteModeState] = useState({
    enabled: false,
    reason: '',
    source: 'auto-disabled',
    isLoading: true
  })

  const [recommendation, setRecommendation] = useState({
    recommended: false,
    reason: '',
    priority: 'none'
  })

  // Initialize Lite Mode state
  useEffect(() => {
    const initializeLiteMode = () => {
      try {
        // Get current state (this will auto-enable if recommended)
        const currentState = shouldUseLiteMode()
        setLiteModeState({
          ...currentState,
          isLoading: false
        })

        // Get recommendation info
        const rec = isLiteModeRecommended()
        setRecommendation(rec)

        // Development logging
        if (process.env.NODE_ENV === 'development') {
          console.group('🔄 Lite Mode Initialized')
          console.log('State:', currentState)
          console.log('Recommendation:', rec)
          console.groupEnd()
        }

      } catch (error) {
        console.error('Failed to initialize Lite Mode:', error)
        setLiteModeState({
          enabled: false,
          reason: 'Initialization failed',
          source: 'error',
          isLoading: false
        })
      }
    }

    initializeLiteMode()
  }, [])

  // Manual enable/disable functions
  const enable = (reason = 'Enabled manually') => {
    try {
      enableLiteMode(reason)
      const newState = shouldUseLiteMode()
      setLiteModeState(newState)
      
      // Emit event for style system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lite-mode-changed', {
          detail: { enabled: true, reason }
        }))
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Lite Mode enabled:', reason)
      }
    } catch (error) {
      console.error('Failed to enable Lite Mode:', error)
    }
  }

  const disable = (reason = 'Disabled manually') => {
    try {
      disableLiteMode(reason)
      const newState = shouldUseLiteMode()
      setLiteModeState(newState)
      
      // Emit event for style system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lite-mode-changed', {
          detail: { enabled: false, reason }
        }))
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Lite Mode disabled:', reason)
      }
    } catch (error) {
      console.error('Failed to disable Lite Mode:', error)
    }
  }

  const reset = () => {
    try {
      resetLiteModePreference()
      const newState = shouldUseLiteMode()
      setLiteModeState(newState)
      
      // Emit event for style system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lite-mode-changed', {
          detail: { enabled: newState.enabled, reason: 'Reset to auto' }
        }))
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Lite Mode reset to auto-detection')
      }
    } catch (error) {
      console.error('Failed to reset Lite Mode:', error)
    }
  }

  // Toggle Lite Mode
  const toggle = () => {
    if (liteModeState.enabled) {
      return disable('Toggled off')
    } else {
      return enable('Toggled on')
    }
  }

  // Get current stored state (for debugging)
  const getStoredState = () => {
    return getLiteModeState()
  }

  // Development logging
  const logStatus = () => {
    logLiteModeStatus()
  }

  return {
    // State
    isEnabled: liteModeState.enabled,
    reason: liteModeState.reason,
    source: liteModeState.source,
    isLoading: liteModeState.isLoading,
    
    // Recommendation
    isRecommended: recommendation.recommended,
    recommendationReason: recommendation.reason,
    recommendationPriority: recommendation.priority,
    
    // Controls
    enable,
    disable,
    toggle,
    reset,
    
    // Development helpers
    getStoredState,
    logStatus,
    
    // Computed properties
    isAutoEnabled: liteModeState.source === 'auto-enabled',
    isManuallySet: liteModeState.source === 'manual',
    shouldShowRecommendation: recommendation.recommended && !liteModeState.enabled && liteModeState.source !== 'manual'
  }
} 