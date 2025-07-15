// Performance optimization utilities for universal + Lite Mode benefits

import { shouldUseLiteMode } from './deviceDetection'

// Get current performance preferences
export const getPerformancePreferences = () => {
  try {
    const stored = localStorage.getItem('trackdeni-performance-prefs')
    const defaults = {
      animations: 'auto', // 'none', 'reduced', 'full', 'auto'
      visualComplexity: 'auto', // 'simple', 'standard', 'rich', 'auto' 
      performanceMode: 'auto' // 'battery', 'balanced', 'performance', 'auto'
    }
    
    if (stored) {
      return { ...defaults, ...JSON.parse(stored) }
    }
    
    return defaults
  } catch (error) {
    console.warn('Failed to get performance preferences:', error)
    return {
      animations: 'auto',
      visualComplexity: 'auto',
      performanceMode: 'auto'
    }
  }
}

// Set performance preferences
export const setPerformancePreferences = (prefs) => {
  try {
    const current = getPerformancePreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem('trackdeni-performance-prefs', JSON.stringify(updated))
    
    // Apply changes immediately
    applyPerformanceOptimizations(updated)
    
    return updated
  } catch (error) {
    console.warn('Failed to set performance preferences:', error)
    return getPerformancePreferences()
  }
}

// Check if animations should be reduced
export const shouldReduceAnimations = () => {
  const prefs = getPerformancePreferences()
  const liteModeStatus = shouldUseLiteMode()
  
  // User preference takes priority
  if (prefs.animations === 'none') return true
  if (prefs.animations === 'full') return false
  if (prefs.animations === 'reduced') return true
  
  // Auto mode: check system preference and Lite Mode
  if (prefs.animations === 'auto') {
    // Check system preference for reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    
    // Enable in Lite Mode
    if (liteModeStatus.enabled) {
      return true
    }
  }
  
  return false
}

// Check if visual complexity should be simplified
export const shouldSimplifyVisuals = () => {
  const prefs = getPerformancePreferences()
  const liteModeStatus = shouldUseLiteMode()
  
  // User preference takes priority
  if (prefs.visualComplexity === 'simple') return true
  if (prefs.visualComplexity === 'rich') return false
  if (prefs.visualComplexity === 'standard') return false
  
  // Auto mode: simplify in Lite Mode
  if (prefs.visualComplexity === 'auto' && liteModeStatus.enabled) {
    return true
  }
  
  return false
}

// Get animation class suffix based on preferences
export const getAnimationClasses = (defaultClasses, reducedClasses = '') => {
  if (shouldReduceAnimations()) {
    return reducedClasses
  }
  return defaultClasses
}

// Get visual complexity classes
export const getVisualClasses = (standardClasses, simplifiedClasses) => {
  if (shouldSimplifyVisuals()) {
    return simplifiedClasses
  }
  return standardClasses
}

// Apply performance optimizations to document
export const applyPerformanceOptimizations = (prefs = null) => {
  const preferences = prefs || getPerformancePreferences()
  const liteModeStatus = shouldUseLiteMode()
  
  // Apply CSS custom properties for dynamic styling
  const root = document.documentElement
  
  // Animation settings
  if (shouldReduceAnimations()) {
    root.style.setProperty('--animation-duration', '0s')
    root.style.setProperty('--transition-duration', '0s')
    root.classList.add('reduce-animations')
  } else {
    root.style.setProperty('--animation-duration', '0.3s')
    root.style.setProperty('--transition-duration', '0.2s')
    root.classList.remove('reduce-animations')
  }
  
  // Visual complexity
  if (shouldSimplifyVisuals()) {
    root.classList.add('simplified-visuals')
    root.style.setProperty('--shadow-intensity', '0.1')
    root.style.setProperty('--gradient-complexity', 'none')
  } else {
    root.classList.remove('simplified-visuals')
    root.style.setProperty('--shadow-intensity', '0.3')
    root.style.setProperty('--gradient-complexity', 'linear-gradient')
  }
  
  // Lite Mode specific optimizations
  if (liteModeStatus.enabled) {
    root.classList.add('lite-mode-active')
    
    // Additional performance optimizations
    root.style.setProperty('--image-quality', '0.8')
    root.style.setProperty('--blur-intensity', '2px')
  } else {
    root.classList.remove('lite-mode-active')
    root.style.setProperty('--image-quality', '1')
    root.style.setProperty('--blur-intensity', '4px')
  }
}

// Performance monitoring utilities
export const performanceMonitor = {
  measureRender: (componentName, renderFunction) => {
    const start = performance.now()
    const result = renderFunction()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 ${componentName} render took ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  },
  
  measureAsync: async (operationName, asyncFunction) => {
    const start = performance.now()
    const result = await asyncFunction()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${operationName} took ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  },
  
  measureCallback: (callbackName, callback) => {
    return (...args) => {
      const start = performance.now()
      const result = callback(...args)
      const end = performance.now()
      
      if (process.env.NODE_ENV === 'development' && end - start > 10) {
        console.log(`🐌 ${callbackName} callback took ${(end - start).toFixed(2)}ms (slow)`)
      }
      
      return result
    }
  }
}

// Image optimization utilities
export const optimizeImageLoading = () => {
  // Add intersection observer for lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      })
    })
    
    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
}

// Bundle optimization detection
export const getBundleOptimizationInfo = () => {
  return {
    lazyLoading: true,
    codesplitting: true,
    treeShaking: true,
    compression: process.env.NODE_ENV === 'production',
    serviceWorker: 'serviceWorker' in navigator
  }
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Apply initial optimizations
  applyPerformanceOptimizations()
  
  // Listen for system preference changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', () => {
      applyPerformanceOptimizations()
    })
  }
  
  // Initialize image optimization
  optimizeImageLoading()
  
  // Log performance info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Performance optimizations initialized')
    console.log('🎭 Animations:', shouldReduceAnimations() ? 'Reduced' : 'Full')
    console.log('🎨 Visuals:', shouldSimplifyVisuals() ? 'Simplified' : 'Standard')
    console.log('📦 Bundle:', getBundleOptimizationInfo())
  }
}

export default {
  getPerformancePreferences,
  setPerformancePreferences,
  shouldReduceAnimations,
  shouldSimplifyVisuals,
  getAnimationClasses,
  getVisualClasses,
  applyPerformanceOptimizations,
  performanceMonitor,
  optimizeImageLoading,
  getBundleOptimizationInfo,
  initializePerformanceOptimizations
} 