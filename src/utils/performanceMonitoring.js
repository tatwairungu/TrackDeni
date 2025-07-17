/**
 * Performance Monitoring Utilities for TrackDeni
 * Tracks component performance, bundle loading, and optimization effectiveness
 * Development-only utilities for performance analysis
 */

// Performance metrics collection
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      componentRenders: new Map(),
      bundleLoads: new Map(),
      memoryUsage: [],
      userInteractions: [],
      networkRequests: []
    }
    
    this.isEnabled = process.env.NODE_ENV === 'development'
    this.startTime = performance.now()
    
    if (this.isEnabled) {
      this.initializeMonitoring()
    }
  }

  initializeMonitoring() {
    // Monitor component renders
    this.observeComponentRenders()
    
    // Monitor bundle loading
    this.observeBundleLoads()
    
    // Monitor memory usage
    this.monitorMemoryUsage()
    
    // Monitor user interactions
    this.monitorUserInteractions()
    
    // Monitor network requests
    this.monitorNetworkRequests()
    
    // Report performance periodically
    this.startPeriodicReporting()
  }

  observeComponentRenders() {
    // Hook into React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
      
      hook.onCommitFiberRoot = (id, root, priorityLevel) => {
        const renderTime = performance.now()
        this.recordComponentRender('FiberRoot', renderTime)
      }
    }
  }

  observeBundleLoads() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.name.includes('chunk') || entry.name.includes('.js')) {
          this.recordBundleLoad(entry.name, {
            duration: entry.duration,
            size: entry.transferSize || entry.encodedBodySize,
            startTime: entry.startTime
          })
        }
      })
    })

    if ('observe' in observer) {
      observer.observe({ entryTypes: ['resource'] })
    }
  }

  monitorMemoryUsage() {
    if (!performance.memory) return
    
    const collectMemoryStats = () => {
      const memory = performance.memory
      this.metrics.memoryUsage.push({
        timestamp: performance.now(),
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      })
      
      // Keep only last 100 entries
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift()
      }
    }
    
    // Collect every 5 seconds
    setInterval(collectMemoryStats, 5000)
    collectMemoryStats() // Initial collection
  }

  monitorUserInteractions() {
    const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart']
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        this.recordUserInteraction(type, {
          timestamp: performance.now(),
          target: event.target.tagName,
          className: event.target.className
        })
      }, { passive: true })
    })
  }

  monitorNetworkRequests() {
    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0]
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        
        this.recordNetworkRequest(url, {
          duration: endTime - startTime,
          status: response.status,
          size: response.headers.get('content-length'),
          method: args[1]?.method || 'GET'
        })
        
        return response
      } catch (error) {
        const endTime = performance.now()
        this.recordNetworkRequest(url, {
          duration: endTime - startTime,
          error: error.message,
          method: args[1]?.method || 'GET'
        })
        throw error
      }
    }
  }

  recordComponentRender(componentName, renderTime) {
    if (!this.metrics.componentRenders.has(componentName)) {
      this.metrics.componentRenders.set(componentName, [])
    }
    
    this.metrics.componentRenders.get(componentName).push({
      timestamp: renderTime,
      duration: performance.now() - renderTime
    })
  }

  recordBundleLoad(bundleName, stats) {
    this.metrics.bundleLoads.set(bundleName, {
      ...stats,
      timestamp: performance.now()
    })
  }

  recordUserInteraction(type, details) {
    this.metrics.userInteractions.push({
      type,
      ...details
    })
    
    // Keep only last 50 interactions
    if (this.metrics.userInteractions.length > 50) {
      this.metrics.userInteractions.shift()
    }
  }

  recordNetworkRequest(url, details) {
    this.metrics.networkRequests.push({
      url,
      ...details,
      timestamp: performance.now()
    })
    
    // Keep only last 30 requests
    if (this.metrics.networkRequests.length > 30) {
      this.metrics.networkRequests.shift()
    }
  }

  startPeriodicReporting() {
    // Report every 30 seconds
    setInterval(() => {
      this.generateReport()
    }, 30000)
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: performance.now() - this.startTime,
      
      // Component performance
      componentRenders: this.getComponentRenderStats(),
      
      // Bundle performance
      bundleLoads: this.getBundleLoadStats(),
      
      // Memory usage
      memoryUsage: this.getMemoryStats(),
      
      // User interactions
      userInteractions: this.getUserInteractionStats(),
      
      // Network performance
      networkRequests: this.getNetworkStats(),
      
      // Optimization effectiveness
      optimizations: this.getOptimizationEffectiveness()
    }
    
    console.group('📊 Performance Report')
    console.log('Report:', report)
    console.groupEnd()
    
    return report
  }

  getComponentRenderStats() {
    const stats = {}
    
    this.metrics.componentRenders.forEach((renders, componentName) => {
      const durations = renders.map(r => r.duration)
      stats[componentName] = {
        count: renders.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations)
      }
    })
    
    return stats
  }

  getBundleLoadStats() {
    const stats = {}
    
    this.metrics.bundleLoads.forEach((details, bundleName) => {
      stats[bundleName] = {
        duration: details.duration,
        size: details.size,
        timestamp: details.timestamp
      }
    })
    
    return stats
  }

  getMemoryStats() {
    if (this.metrics.memoryUsage.length === 0) return null
    
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
    const oldest = this.metrics.memoryUsage[0]
    
    return {
      current: {
        used: latest.used,
        total: latest.total,
        utilization: (latest.used / latest.total) * 100
      },
      trend: {
        growth: latest.used - oldest.used,
        timespan: latest.timestamp - oldest.timestamp
      },
      peak: Math.max(...this.metrics.memoryUsage.map(m => m.used))
    }
  }

  getUserInteractionStats() {
    const stats = {}
    
    this.metrics.userInteractions.forEach(interaction => {
      if (!stats[interaction.type]) {
        stats[interaction.type] = 0
      }
      stats[interaction.type]++
    })
    
    return stats
  }

  getNetworkStats() {
    const requests = this.metrics.networkRequests
    if (requests.length === 0) return null
    
    const durations = requests.map(r => r.duration)
    const sizes = requests.filter(r => r.size).map(r => parseInt(r.size))
    
    return {
      count: requests.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      totalSize: sizes.reduce((a, b) => a + b, 0),
      errors: requests.filter(r => r.error).length
    }
  }

  getOptimizationEffectiveness() {
    // Check if optimizations are working
    const effectiveness = {
      memoization: this.checkMemoizationEffectiveness(),
      lazyLoading: this.checkLazyLoadingEffectiveness(),
      bundleOptimization: this.checkBundleOptimizationEffectiveness(),
      liteModeOptimizations: this.checkLiteModeOptimizations()
    }
    
    return effectiveness
  }

  checkMemoizationEffectiveness() {
    // Check if components are rendering less frequently
    const renderStats = this.getComponentRenderStats()
    const overRendering = Object.entries(renderStats).filter(([name, stats]) => 
      stats.count > 10 && stats.avgDuration > 5
    )
    
    return {
      status: overRendering.length === 0 ? 'effective' : 'needs-attention',
      details: overRendering.length > 0 ? `${overRendering.length} components may be over-rendering` : 'Memoization working well'
    }
  }

  checkLazyLoadingEffectiveness() {
    // Check if lazy-loaded components are loading appropriately
    const lazyComponents = Array.from(this.metrics.bundleLoads.keys()).filter(name => 
      name.includes('chunk') || name.includes('lazy')
    )
    
    return {
      status: lazyComponents.length > 0 ? 'active' : 'inactive',
      details: `${lazyComponents.length} lazy-loaded components detected`
    }
  }

  checkBundleOptimizationEffectiveness() {
    // Check bundle sizes and loading times
    const bundles = Array.from(this.metrics.bundleLoads.values())
    const totalSize = bundles.reduce((sum, bundle) => sum + (bundle.size || 0), 0)
    const avgLoadTime = bundles.reduce((sum, bundle) => sum + bundle.duration, 0) / bundles.length
    
    return {
      status: totalSize < 1000000 && avgLoadTime < 1000 ? 'good' : 'needs-improvement',
      details: `Total bundle size: ${Math.round(totalSize / 1024)}KB, Avg load time: ${Math.round(avgLoadTime)}ms`
    }
  }

  checkLiteModeOptimizations() {
    // Check if lite mode is being used and its effectiveness
    const liteModeEnabled = document.body.classList.contains('lite-mode')
    const memoryStats = this.getMemoryStats()
    
    return {
      status: liteModeEnabled ? 'active' : 'inactive',
      details: liteModeEnabled ? 
        `Lite mode active, memory usage: ${Math.round(memoryStats?.current.utilization || 0)}%` :
        'Lite mode not active'
    }
  }

  // Public API for manual performance tracking
  markComponentRender(componentName) {
    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      this.recordComponentRender(componentName, endTime - startTime)
    }
  }

  measureFunction(name, fn) {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    
    console.log(`⚡ ${name} took ${endTime - startTime}ms`)
    return result
  }

  async measureAsyncFunction(name, fn) {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    
    console.log(`⚡ ${name} took ${endTime - startTime}ms`)
    return result
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor()

// Performance monitoring utilities for components
export const createPerformanceTracker = (componentName) => {
  if (process.env.NODE_ENV !== 'development') {
    return {
      markRender: () => () => {},
      measureFunction: (name, fn) => fn(),
      measureAsyncFunction: async (name, fn) => await fn()
    }
  }
  
  return {
    markRender: () => performanceMonitor.markComponentRender(componentName),
    measureFunction: (name, fn) => performanceMonitor.measureFunction(name, fn),
    measureAsyncFunction: (name, fn) => performanceMonitor.measureAsyncFunction(name, fn)
  }
}

// Hook for performance monitoring in functional components (to be used in .jsx files)
export const usePerformanceMonitoring = (componentName) => {
  if (process.env.NODE_ENV !== 'development') {
    return { measureRender: () => () => {}, measureFunction: (name, fn) => fn() }
  }
  
  return {
    measureRender: () => performanceMonitor.markComponentRender(componentName),
    measureFunction: (name, fn) => performanceMonitor.measureFunction(name, fn),
    measureAsyncFunction: (name, fn) => performanceMonitor.measureAsyncFunction(name, fn)
  }
}

// Development utilities
export const devTools = {
  // Get current performance report
  getReport: () => performanceMonitor.generateReport(),
  
  // Clear all metrics
  clearMetrics: () => {
    performanceMonitor.metrics = {
      componentRenders: new Map(),
      bundleLoads: new Map(),
      memoryUsage: [],
      userInteractions: [],
      networkRequests: []
    }
    console.log('📊 Performance metrics cleared')
  },
  
  // Enable/disable monitoring
  toggleMonitoring: (enabled) => {
    performanceMonitor.isEnabled = enabled
    console.log(`📊 Performance monitoring ${enabled ? 'enabled' : 'disabled'}`)
  },
  
  // Get specific metric
  getMetric: (metricName) => {
    return performanceMonitor.metrics[metricName]
  }
}

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    // Prevent duplicate initialization
    if (window.trackDeniPerfInitialized) {
      console.log('📊 Performance monitoring already initialized')
      return
    }
    window.trackDeniPerfInitialized = true
    
    try {
      // Add dev tools to global scope
      window.trackDeniPerf = devTools
      
      console.log('📊 Performance monitoring initialized successfully')
      console.log('📊 Available tools:', Object.keys(devTools))
      console.log('📊 Use window.trackDeniPerf for performance utilities')
      
      // Test that the tools are accessible
      setTimeout(() => {
        if (window.trackDeniPerf) {
          console.log('✅ trackDeniPerf tools confirmed accessible')
        } else {
          console.error('❌ trackDeniPerf tools not accessible')
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ Performance monitoring initialization failed:', error)
    }
  }
}

export default performanceMonitor 