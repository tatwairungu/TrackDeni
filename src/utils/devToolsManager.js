/**
 * Development Tools Manager for TrackDeni
 * Handles proper initialization and cleanup of dev tools
 */

// Clean up existing dev tools
export const cleanupDevTools = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  // Remove existing tools
  delete window.trackDeniDev
  delete window.trackDeniPerf
  delete window.trackDeniDevInitialized
  delete window.trackDeniPerfInitialized
  delete window.trackDeniOptimizationsInitialized
  
  console.log('🧹 Development tools cleaned up')
}

// Initialize all dev tools properly
export const initializeDevTools = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  // Clean up first to prevent duplicates
  cleanupDevTools()
  
  // Initialize performance monitoring
  import('./performanceMonitoring.js').then(({ initPerformanceMonitoring }) => {
    initPerformanceMonitoring()
  })
  
  // Initialize other optimizations
  import('./bundleOptimization.js').then(({ initBundleOptimization }) => {
    initBundleOptimization()
  })
  
  import('./liteModeStyles.js').then(({ initLiteModeStyles }) => {
    initLiteModeStyles()
  })
  
  import('./liteModeVisualEffects.js').then(({ initVisualEffects }) => {
    initVisualEffects()
  })
  
  console.log('🛠️ Development tools initialization started')
}

// Restart dev tools (for debugging)
export const restartDevTools = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  cleanupDevTools()
  
  setTimeout(() => {
    initializeDevTools()
    console.log('🔄 Development tools restarted')
  }, 100)
}

// Add global utility for restarting dev tools
if (process.env.NODE_ENV === 'development') {
  window.restartDevTools = restartDevTools
}

export default {
  cleanupDevTools,
  initializeDevTools,
  restartDevTools
} 