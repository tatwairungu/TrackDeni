/**
 * Device Detection Utility for TrackDeni
 * Detects device capabilities and performance characteristics
 * Used for adaptive UI and performance optimizations
 */

// Device Memory Detection
export const getDeviceMemory = () => {
  // navigator.deviceMemory is supported in Chrome/Edge
  if ('deviceMemory' in navigator) {
    return navigator.deviceMemory // Returns approximate RAM in GB
  }
  
  // Fallback: estimate based on other factors
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Very rough estimates based on common patterns
  if (userAgent.includes('android')) {
    // Android Go devices often have specific indicators
    if (userAgent.includes('go') || userAgent.includes('lite')) {
      return 1 // Likely Android Go device
    }
    // Generic Android estimation
    return 3 // Conservative estimate
  }
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 4 // Most iOS devices have adequate RAM
  }
  
  return 4 // Default assumption for desktop/unknown
}

// CPU Detection
export const getCPUCores = () => {
  // navigator.hardwareConcurrency gives logical CPU cores
  if ('hardwareConcurrency' in navigator) {
    return navigator.hardwareConcurrency
  }
  
  // Fallback estimation
  return 4 // Conservative default
}

// Network Detection
export const getNetworkInfo = () => {
  // navigator.connection is experimental but widely supported
  if ('connection' in navigator) {
    const connection = navigator.connection
    return {
      effectiveType: connection.effectiveType, // '2g', '3g', '4g', 'slow-2g'
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // Round trip time in ms
      saveData: connection.saveData // User has data saver enabled
    }
  }
  
  // Fallback: assume decent connection
  return {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }
}

// Device Type Detection
export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('mobile') || userAgent.includes('android')) {
    return 'mobile'
  }
  
  if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
    return 'tablet'
  }
  
  return 'desktop'
}

// Platform Detection
export const getPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('android')) return 'android'
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios'
  if (userAgent.includes('windows')) return 'windows'
  if (userAgent.includes('mac')) return 'macos'
  if (userAgent.includes('linux')) return 'linux'
  
  return 'unknown'
}

// Performance Score Calculation
export const calculatePerformanceScore = () => {
  const memory = getDeviceMemory()
  const cores = getCPUCores()
  const network = getNetworkInfo()
  
  let score = 0
  
  // Memory scoring (0-40 points)
  if (memory >= 8) score += 40
  else if (memory >= 4) score += 30
  else if (memory >= 2) score += 20
  else score += 10
  
  // CPU scoring (0-30 points)
  if (cores >= 8) score += 30
  else if (cores >= 4) score += 25
  else if (cores >= 2) score += 15
  else score += 5
  
  // Network scoring (0-30 points)
  if (network.effectiveType === '4g') score += 30
  else if (network.effectiveType === '3g') score += 20
  else if (network.effectiveType === '2g') score += 10
  else score += 5
  
  return Math.min(score, 100) // Cap at 100
}

// Device Classification
export const getDeviceClass = () => {
  const score = calculatePerformanceScore()
  
  if (score >= 80) return 'high-end'
  if (score >= 50) return 'mid-range'
  return 'low-end'
}

// Specific Device Checks
export const isLowEndDevice = () => {
  const memory = getDeviceMemory()
  const cores = getCPUCores()
  const network = getNetworkInfo()
  
  // More conservative thresholds to avoid false positives
  const hasLowMemory = memory <= 2
  const hasLowCPU = cores <= 2
  const hasSlowNetwork = isSlowNetwork()
  
  // Only consider low-end if multiple factors are problematic
  // OR if memory is very low (1GB or less)
  return (
    memory <= 1 || // Definitely low-end (Android Go devices)
    (hasLowMemory && hasLowCPU) || // Both memory and CPU are low
    (hasLowMemory && hasSlowNetwork) // Low memory + slow network
  )
}

export const isSlowNetwork = () => {
  const network = getNetworkInfo()
  
  // First check effective type - this is most reliable
  if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
    return true
  }
  
  // If we have 4g, assume it's good (don't rely on downlink for 4g)
  if (network.effectiveType === '4g') {
    return false
  }
  
  // For 3g, check downlink if available, but be more lenient
  if (network.effectiveType === '3g') {
    // Only consider 3g slow if downlink is very low (less than 0.5 Mbps)
    return network.downlink && network.downlink < 0.5
  }
  
  // If no effective type info, check downlink with conservative threshold
  if (network.downlink && network.downlink < 0.5) {
    return true
  }
  
  // Default to false (assume good connection) if we can't determine
  return false
}

export const hasDataSaver = () => {
  const network = getNetworkInfo()
  return network.saveData
}

export const isMobileDevice = () => {
  return getDeviceType() === 'mobile'
}

export const isAndroidGo = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('android') && (
    userAgent.includes('go') || 
    userAgent.includes('lite') ||
    getDeviceMemory() <= 1
  )
}

// Storage Detection
export const getStorageInfo = () => {
  const info = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webSQL: false
  }
  
  try {
    info.localStorage = typeof Storage !== 'undefined' && 'localStorage' in window
    info.sessionStorage = typeof Storage !== 'undefined' && 'sessionStorage' in window
    info.indexedDB = 'indexedDB' in window
    info.webSQL = 'openDatabase' in window
  } catch (e) {
    // Storage detection failed
  }
  
  return info
}

// Performance Recommendations
export const getPerformanceRecommendations = () => {
  const deviceClass = getDeviceClass()
  const isLowEnd = isLowEndDevice()
  const slowNetwork = isSlowNetwork()
  const dataSaver = hasDataSaver()
  const memory = getDeviceMemory()
  
  const recommendations = []
  
  // Only show device warnings for genuinely low-end devices
  if (isLowEnd && memory <= 1) {
    recommendations.push({
      type: 'device',
      severity: 'high',
      message: 'Your device has limited memory. Consider enabling Lite Mode for better performance.',
      action: 'Enable Lite Mode'
    })
  } else if (isLowEnd) {
    recommendations.push({
      type: 'device',
      severity: 'medium',
      message: 'Your device may benefit from performance optimizations.',
      action: 'Consider Lite Mode'
    })
  }
  
  // Only show network warnings for truly slow connections
  if (slowNetwork) {
    const network = getNetworkInfo()
    if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
      recommendations.push({
        type: 'network',
        severity: 'high',
        message: 'Very slow network detected. Data will sync when connection improves.',
        action: 'Work Offline'
      })
    } else {
      recommendations.push({
        type: 'network',
        severity: 'medium',
        message: 'Slow network detected. Some features may be delayed.',
        action: 'Optimize Data Usage'
      })
    }
  }
  
  // Data saver is informational only
  if (dataSaver) {
    recommendations.push({
      type: 'data',
      severity: 'low',
      message: 'Data saver is enabled. Background sync may be limited.',
      action: 'Optimize Data Usage'
    })
  }
  
  return recommendations
}

// Complete Device Profile
export const getDeviceProfile = () => {
  const liteModeRecommendation = isLiteModeRecommended()
  const liteModeState = shouldUseLiteMode()
  
  return {
    // Hardware
    memory: getDeviceMemory(),
    cores: getCPUCores(),
    deviceType: getDeviceType(),
    platform: getPlatform(),
    
    // Network
    network: getNetworkInfo(),
    
    // Performance
    performanceScore: calculatePerformanceScore(),
    deviceClass: getDeviceClass(),
    
    // Capabilities
    storage: getStorageInfo(),
    
    // Flags
    isLowEnd: isLowEndDevice(),
    isSlowNetwork: isSlowNetwork(),
    hasDataSaver: hasDataSaver(),
    isMobile: isMobileDevice(),
    isAndroidGo: isAndroidGo(),
    
    // Lite Mode
    liteModeRecommendation,
    liteModeState,
    
    // Recommendations
    recommendations: getPerformanceRecommendations(),
    
    // Timestamp
    detectedAt: new Date().toISOString()
  }
}

// Development Helper
export const logDeviceProfile = () => {
  if (process.env.NODE_ENV === 'development') {
    const profile = getDeviceProfile()
    console.group('📱 Device Profile')
    console.log('Memory:', profile.memory + 'GB')
    console.log('CPU Cores:', profile.cores)
    console.log('Device Type:', profile.deviceType)
    console.log('Platform:', profile.platform)
    console.log('Network:', profile.network.effectiveType)
    console.log('Performance Score:', profile.performanceScore + '/100')
    console.log('Device Class:', profile.deviceClass)
    console.log('Is Low-End:', profile.isLowEnd)
    console.log('Recommendations:', profile.recommendations)
    console.groupEnd()
  }
} 

// Lite Mode Detection
export const isLiteModeRecommended = () => {
  const memory = getDeviceMemory()
  const cores = getCPUCores()
  const network = getNetworkInfo()
  const deviceType = getDeviceType()
  const platform = getPlatform()
  
  // Definitely recommend Lite Mode for very low-end devices
  if (memory <= 1) {
    return {
      recommended: true,
      reason: 'Very low memory detected (≤1GB)',
      priority: 'high'
    }
  }
  
  // Android Go devices should use Lite Mode
  if (isAndroidGo()) {
    return {
      recommended: true,
      reason: 'Android Go device detected',
      priority: 'high'
    }
  }
  
  // Low memory + low CPU combination
  if (memory <= 2 && cores <= 2) {
    return {
      recommended: true,
      reason: 'Limited memory and CPU resources',
      priority: 'high'
    }
  }
  
  // Low memory + slow network combination
  if (memory <= 2 && isSlowNetwork()) {
    return {
      recommended: true,
      reason: 'Limited memory with slow network',
      priority: 'medium'
    }
  }
  
  // Very slow network (2G) regardless of device specs
  if (network.effectiveType === '2g' || network.effectiveType === 'slow-2g') {
    return {
      recommended: true,
      reason: 'Very slow network connection (2G)',
      priority: 'medium'
    }
  }
  
  // Mobile devices with limited resources
  if (deviceType === 'mobile' && memory <= 3 && cores <= 4) {
    return {
      recommended: true,
      reason: 'Mobile device with limited resources',
      priority: 'low'
    }
  }
  
  // No recommendation for Lite Mode
  return {
    recommended: false,
    reason: 'Device has sufficient resources',
    priority: 'none'
  }
}

// Lite Mode State Management
export const getLiteModeState = () => {
  try {
    const stored = localStorage.getItem('trackdeni-lite-mode')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return null
}

export const setLiteModeState = (enabled, reason = '', autoEnabled = false) => {
  const state = {
    enabled,
    reason,
    autoEnabled,
    setAt: new Date().toISOString()
  }
  
  try {
    localStorage.setItem('trackdeni-lite-mode', JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save Lite Mode state:', e)
  }
  
  return state
}

export const shouldUseLiteMode = () => {
  // Check if user has manually set preference
  const storedState = getLiteModeState()
  if (storedState !== null) {
    return {
      enabled: storedState.enabled,
      reason: storedState.reason,
      source: storedState.autoEnabled ? 'auto' : 'manual'
    }
  }
  
  // Auto-detect if no preference set
  const recommendation = isLiteModeRecommended()
  if (recommendation.recommended) {
    // Auto-enable Lite Mode for recommended devices
    const state = setLiteModeState(true, recommendation.reason, true)
    return {
      enabled: true,
      reason: recommendation.reason,
      source: 'auto-enabled'
    }
  }
  
  // Default to normal mode for capable devices
  return {
    enabled: false,
    reason: 'Device has sufficient resources',
    source: 'auto-disabled'
  }
}

// Manual Lite Mode Controls
export const enableLiteMode = (reason = 'Manually enabled') => {
  return setLiteModeState(true, reason, false)
}

export const disableLiteMode = (reason = 'Manually disabled') => {
  return setLiteModeState(false, reason, false)
}

export const resetLiteModePreference = () => {
  try {
    localStorage.removeItem('trackdeni-lite-mode')
    return true
  } catch (e) {
    console.warn('Failed to reset Lite Mode preference:', e)
    return false
  }
}

// Development helpers
export const logLiteModeStatus = () => {
  if (process.env.NODE_ENV === 'development') {
    const liteModeState = shouldUseLiteMode()
    const recommendation = isLiteModeRecommended()
    const storedState = getLiteModeState()
    
    console.group('💡 Lite Mode Status')
    console.log('Current State:', liteModeState)
    console.log('Recommendation:', recommendation)
    console.log('Stored Preference:', storedState)
    console.groupEnd()
  }
} 