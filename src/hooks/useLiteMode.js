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

  // Manual enable Lite Mode
  const enable = (reason = 'Manually enabled') => {
    try {
      const newState = enableLiteMode(reason)
      setLiteModeState({
        enabled: true,
        reason: newState.reason,
        source: 'manual',
        isLoading: false
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('💡 Lite Mode manually enabled:', reason)
      }

      return true
    } catch (error) {
      console.error('Failed to enable Lite Mode:', error)
      return false
    }
  }

  // Manual disable Lite Mode
  const disable = (reason = 'Manually disabled') => {
    try {
      const newState = disableLiteMode(reason)
      setLiteModeState({
        enabled: false,
        reason: newState.reason,
        source: 'manual',
        isLoading: false
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('💡 Lite Mode manually disabled:', reason)
      }

      return true
    } catch (error) {
      console.error('Failed to disable Lite Mode:', error)
      return false
    }
  }

  // Reset to auto-detection
  const reset = () => {
    try {
      resetLiteModePreference()
      
      // Re-run auto-detection
      const autoState = shouldUseLiteMode()
      setLiteModeState({
        ...autoState,
        isLoading: false
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Lite Mode reset to auto-detection')
      }

      return true
    } catch (error) {
      console.error('Failed to reset Lite Mode:', error)
      return false
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