import { useLiteMode } from '../hooks/useLiteMode'

/**
 * Lite Mode Styles Utility for TrackDeni
 * Provides reduced animations and simplified visual effects
 * Respects user's motion preferences and lite mode settings
 */

// Animation duration constants
const ANIMATION_DURATIONS = {
  normal: {
    fast: '150ms',
    medium: '300ms',
    slow: '500ms'
  },
  lite: {
    fast: '100ms',
    medium: '150ms',
    slow: '200ms'
  },
  reduced: {
    fast: '0ms',
    medium: '0ms',
    slow: '0ms'
  }
}

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Get animation mode based on lite mode and user preferences
const getAnimationMode = (isLiteModeEnabled) => {
  if (prefersReducedMotion()) return 'reduced'
  if (isLiteModeEnabled) return 'lite'
  return 'normal'
}

// Utility function to get animation classes
export const getAnimationClasses = (isLiteModeEnabled) => {
  const mode = getAnimationMode(isLiteModeEnabled)
  
  return {
    // Transition classes
    transition: mode === 'reduced' ? '' : 'transition-all',
    duration: ANIMATION_DURATIONS[mode],
    
    // Transform classes
    transform: mode === 'reduced' ? '' : 'transform',
    
    // Hover effects
    hover: mode === 'reduced' ? '' : 'hover:scale-105',
    hoverShadow: mode === 'reduced' ? '' : 'hover:shadow-lg',
    
    // Focus effects
    focus: mode === 'reduced' ? 'focus:outline-none focus:ring-2 focus:ring-primary' : 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    
    // Loading animations
    spin: mode === 'reduced' ? 'animate-none' : 'animate-spin',
    pulse: mode === 'reduced' ? 'animate-none' : 'animate-pulse',
    
    // Slide animations
    slideIn: mode === 'reduced' ? '' : 'animate-slide-in',
    slideOut: mode === 'reduced' ? '' : 'animate-slide-out',
    
    // Fade animations
    fadeIn: mode === 'reduced' ? '' : 'animate-fade-in',
    fadeOut: mode === 'reduced' ? '' : 'animate-fade-out'
  }
}

// React hook to get animation classes (for use in components)
export const useAnimationClasses = () => {
  const { isEnabled: isLiteModeEnabled } = useLiteMode()
  return getAnimationClasses(isLiteModeEnabled)
}

// CSS variables for dynamic animation control
export const getCSSVariables = (isLiteModeEnabled) => {
  const mode = getAnimationMode(isLiteModeEnabled)
  const durations = ANIMATION_DURATIONS[mode]
  
  return {
    '--animation-duration-fast': durations.fast,
    '--animation-duration-medium': durations.medium,
    '--animation-duration-slow': durations.slow,
    '--animation-scale': mode === 'reduced' ? '1' : '1.05',
    '--animation-shadow': mode === 'reduced' ? '0 1px 3px rgba(0, 0, 0, 0.12)' : '0 10px 25px rgba(0, 0, 0, 0.12)'
  }
}

// Utility function to get lite mode wrapper properties
export const getLiteModeWrapperProps = (isLiteModeEnabled, className = '') => {
  const cssVariables = getCSSVariables(isLiteModeEnabled)
  
  return {
    className: `${className} ${isLiteModeEnabled ? 'lite-mode' : ''}`,
    style: cssVariables
  }
}

// Utility classes for common animations
export const getLiteModeClasses = (isLiteModeEnabled) => {
  const reduced = prefersReducedMotion()
  const mode = getAnimationMode(isLiteModeEnabled)
  
  return {
    // Button styles
    button: {
      base: `px-4 py-2 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary`,
      transition: reduced ? '' : 'transition-all duration-200',
      hover: reduced ? '' : 'hover:transform hover:scale-105',
      shadow: mode === 'lite' ? 'shadow-sm' : 'shadow-md hover:shadow-lg'
    },
    
    // Card styles
    card: {
      base: 'bg-white rounded-lg border',
      transition: reduced ? '' : 'transition-all duration-300',
      hover: reduced ? '' : 'hover:shadow-lg hover:transform hover:scale-[1.02]',
      shadow: mode === 'lite' ? 'shadow-sm' : 'shadow-md'
    },
    
    // Modal styles
    modal: {
      overlay: `fixed inset-0 bg-black ${mode === 'lite' ? 'bg-opacity-50' : 'bg-opacity-60'}`,
      content: `relative bg-white rounded-lg p-6 ${mode === 'lite' ? 'shadow-lg' : 'shadow-2xl'}`,
      transition: reduced ? '' : 'transition-all duration-300',
      animation: reduced ? '' : 'animate-fade-in'
    },
    
    // Loading states
    loading: {
      spinner: reduced ? 'border-2 border-primary border-t-transparent rounded-full' : 'animate-spin border-2 border-primary border-t-transparent rounded-full',
      pulse: reduced ? 'bg-gray-200' : 'bg-gray-200 animate-pulse'
    },
    
    // Form elements
    input: {
      base: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
      transition: reduced ? '' : 'transition-all duration-200',
      focus: 'focus:border-primary'
    }
  }
}

// Performance optimized component animations
export const OptimizedAnimations = {
  // Use CSS transforms instead of changing layout properties
  slideIn: (element, duration = 300) => {
    if (prefersReducedMotion()) return
    
    element.style.transform = 'translateX(-100%)'
    element.style.opacity = '0'
    
    requestAnimationFrame(() => {
      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
      element.style.transform = 'translateX(0)'
      element.style.opacity = '1'
    })
  },
  
  // Fade animations
  fadeIn: (element, duration = 300) => {
    if (prefersReducedMotion()) return
    
    element.style.opacity = '0'
    
    requestAnimationFrame(() => {
      element.style.transition = `opacity ${duration}ms ease-out`
      element.style.opacity = '1'
    })
  },
  
  // Scale animations
  scaleIn: (element, duration = 200) => {
    if (prefersReducedMotion()) return
    
    element.style.transform = 'scale(0.9)'
    element.style.opacity = '0'
    
    requestAnimationFrame(() => {
      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
      element.style.transform = 'scale(1)'
      element.style.opacity = '1'
    })
  }
}

// CSS injection for lite mode styles
export const injectLiteModeStyles = () => {
  if (typeof document === 'undefined') return
  
  const styleId = 'lite-mode-styles'
  if (document.getElementById(styleId)) return
  
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    /* Lite Mode Styles */
    .lite-mode {
      --animation-duration-fast: 100ms;
      --animation-duration-medium: 150ms;
      --animation-duration-slow: 200ms;
    }
    
    .lite-mode * {
      animation-duration: var(--animation-duration-medium) !important;
      transition-duration: var(--animation-duration-medium) !important;
    }
    
    .lite-mode .card {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
    }
    
    .lite-mode .card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
      transform: translateY(-1px) !important;
    }
    
    .lite-mode .btn {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    }
    
    .lite-mode .btn:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Respect user's motion preferences */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0ms !important;
      }
    }
  `
  
  document.head.appendChild(style)
}

// Initialize lite mode styles
export const initLiteModeStyles = () => {
  if (typeof window === 'undefined') return
  
  injectLiteModeStyles()
  
  // Listen for lite mode changes
  window.addEventListener('lite-mode-changed', (event) => {
    const isEnabled = event.detail.enabled
    document.body.classList.toggle('lite-mode', isEnabled)
  })
}

export default {
  useAnimationClasses,
  getAnimationClasses,
  getCSSVariables,
  getLiteModeWrapperProps,
  getLiteModeClasses,
  OptimizedAnimations,
  initLiteModeStyles
} 