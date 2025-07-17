/**
 * Bundle Optimization Utilities for TrackDeni
 * Provides route-based code splitting and smart preloading
 */

// Route-based code splitting helper function
export const createRouteComponent = (importFunc) => {
  // This function should be used in JSX files to create lazy-loaded components
  // It returns the import function that can be used with React.lazy()
  return importFunc
}

// Smart preloading system
class PreloadManager {
  constructor() {
    this.preloadQueue = new Map()
    this.preloadedComponents = new Set()
    this.preloadingInProgress = new Set()
  }

  // Add component to preload queue
  queuePreload(key, importFunc, priority = 'low') {
    if (this.preloadedComponents.has(key) || this.preloadingInProgress.has(key)) {
      return
    }

    this.preloadQueue.set(key, { importFunc, priority })
  }

  // Execute preloading with priority
  async executePreload(key) {
    if (this.preloadedComponents.has(key) || this.preloadingInProgress.has(key)) {
      return
    }

    const item = this.preloadQueue.get(key)
    if (!item) return

    this.preloadingInProgress.add(key)

    try {
      await item.importFunc()
      this.preloadedComponents.add(key)
      this.preloadQueue.delete(key)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Preloaded component: ${key}`)
      }
    } catch (error) {
      console.warn(`⚠️ Failed to preload component: ${key}`, error)
    } finally {
      this.preloadingInProgress.delete(key)
    }
  }

  // Preload components based on user interactions
  preloadOnHover(key) {
    if (this.preloadQueue.has(key)) {
      this.executePreload(key)
    }
  }

  // Preload high-priority components on idle
  preloadOnIdle(keys) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        keys.forEach(key => this.executePreload(key))
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        keys.forEach(key => this.executePreload(key))
      }, 1000)
    }
  }
}

// Create singleton instance
const preloadManager = new PreloadManager()

// Heavy utility function optimizations
export const optimizedUtils = {
  // Lazy load date utilities only when needed
  dateUtils: () => import('./dateUtils.js'),
  
  // Lazy load device detection only when needed
  deviceDetection: () => import('./deviceDetection.js'),
  
  // Lazy load localization only when language changes
  localization: () => import('./localization.js'),
  
  // Lazy load storage utilities
  storage: () => import('./storage.js'),
  
  // Lazy load test data utilities (dev only)
  testData: () => import('./testData.js')
}

// Component preloading helpers
export const preloadComponents = {
  // Preload modals when app starts
  modals: () => {
    preloadManager.queuePreload('PaymentModal', () => import('../components/PaymentModal.jsx'))
    preloadManager.queuePreload('UpgradePrompt', () => import('../components/UpgradePrompt.jsx'))
    preloadManager.queuePreload('ProWelcomeModal', () => import('../components/ProWelcomeModal.jsx'))
  },

  // Preload pages when user navigates
  pages: () => {
    preloadManager.queuePreload('AddDebt', () => import('../pages/AddDebt.jsx'))
    preloadManager.queuePreload('CustomerDetail', () => import('../pages/CustomerDetail.jsx'))
  },

  // Preload components on user interaction
  onHover: (componentKey) => {
    preloadManager.preloadOnHover(componentKey)
  },

  // Preload on idle
  onIdle: (componentKeys) => {
    preloadManager.preloadOnIdle(componentKeys)
  }
}

// Bundle size monitoring (dev only)
export const monitorBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry) => {
      if (entry.name.includes('chunk')) {
        console.log(`📦 Bundle chunk loaded: ${entry.name}`, {
          duration: entry.duration,
          size: entry.transferSize
        })
      }
    })
  })

  observer.observe({ entryTypes: ['navigation', 'resource'] })
}

// Progressive loading helpers
export const progressiveLoading = {
  // Load critical CSS first
  loadCriticalCSS: () => {
    const criticalStyles = document.querySelector('style[data-critical]')
    if (criticalStyles) {
      criticalStyles.remove()
    }
  },

  // Load non-critical resources after initial render
  loadNonCritical: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Load analytics, social widgets, etc.
        console.log('Loading non-critical resources...')
      })
    }
  }
}

// Initialize bundle optimization
export const initBundleOptimization = () => {
  // Prevent duplicate initialization
  if (window.bundleOptimizationInitialized) return
  window.bundleOptimizationInitialized = true
  
  // Queue initial preloads
  preloadComponents.modals()
  
  // Preload pages on idle
  preloadComponents.onIdle(['AddDebt', 'CustomerDetail'])
  
  // Monitor bundle size in development
  monitorBundleSize()
  
  // Load non-critical resources
  progressiveLoading.loadNonCritical()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Bundle optimization initialized')
  }
}

export default preloadManager 