import { useState, useEffect } from 'react'
import { 
  getDeviceProfile, 
  isLowEndDevice, 
  isSlowNetwork, 
  hasDataSaver,
  getPerformanceRecommendations 
} from '../utils/deviceDetection'

const PerformanceWarning = () => {
  const [deviceProfile, setDeviceProfile] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const [dismissedWarnings, setDismissedWarnings] = useState([])

  useEffect(() => {
    // Get device profile on mount
    const profile = getDeviceProfile()
    setDeviceProfile(profile)
    
    // Check if we should show warnings
    const shouldShow = profile.recommendations.length > 0
    setShowWarning(shouldShow)
    
    // Get dismissed warnings from localStorage
    const dismissed = JSON.parse(localStorage.getItem('trackdeni-dismissed-warnings') || '[]')
    setDismissedWarnings(dismissed)
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Performance Warning Check')
      console.log('Device Profile:', profile)
      console.log('Should Show Warning:', shouldShow)
      console.log('Dismissed Warnings:', dismissed)
      console.groupEnd()
    }
  }, [])

  const dismissWarning = (warningType) => {
    const newDismissed = [...dismissedWarnings, warningType]
    setDismissedWarnings(newDismissed)
    localStorage.setItem('trackdeni-dismissed-warnings', JSON.stringify(newDismissed))
    
    // If all warnings are dismissed, hide the component
    if (deviceProfile && newDismissed.length >= deviceProfile.recommendations.length) {
      setShowWarning(false)
    }
  }

  const dismissAllWarnings = () => {
    if (deviceProfile) {
      const allWarningTypes = deviceProfile.recommendations.map(r => r.type)
      setDismissedWarnings(allWarningTypes)
      localStorage.setItem('trackdeni-dismissed-warnings', JSON.stringify(allWarningTypes))
      setShowWarning(false)
    }
  }

  const resetWarnings = () => {
    setDismissedWarnings([])
    localStorage.removeItem('trackdeni-dismissed-warnings')
    setShowWarning(true)
  }

  // Don't render if no device profile or no warnings
  if (!deviceProfile || !showWarning || deviceProfile.recommendations.length === 0) {
    return null
  }

  // Filter out dismissed warnings
  const activeWarnings = deviceProfile.recommendations.filter(
    warning => !dismissedWarnings.includes(warning.type)
  )

  // Don't render if all warnings are dismissed
  if (activeWarnings.length === 0) {
    return null
  }

  const getWarningIcon = (type) => {
    switch (type) {
      case 'device': return '📱'
      case 'network': return '📶'
      case 'data': return '💾'
      default: return '⚠️'
    }
  }

  const getWarningColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800'
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800'
      default: return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  return (
    <div className="mb-4 space-y-2">
      {activeWarnings.map((warning, index) => (
        <div
          key={`${warning.type}-${index}`}
          className={`p-3 rounded-lg border-l-4 ${getWarningColor(warning.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <span className="text-lg" role="img" aria-label={`${warning.type} warning`}>
                {getWarningIcon(warning.type)}
              </span>
              <div>
                <p className="text-sm font-medium">{warning.message}</p>
                {warning.action && (
                  <p className="text-xs mt-1 opacity-75">
                    Tip: {warning.action}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissWarning(warning.type)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss warning"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      
      {/* Show device info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-medium">🔧 Device Info (Dev Only)</summary>
            <div className="mt-2 space-y-1">
              <p><strong>Memory:</strong> {deviceProfile.memory}GB</p>
              <p><strong>CPU Cores:</strong> {deviceProfile.cores}</p>
              <p><strong>Device Type:</strong> {deviceProfile.deviceType}</p>
              <p><strong>Platform:</strong> {deviceProfile.platform}</p>
              <p><strong>Network:</strong> {deviceProfile.network.effectiveType}</p>
              <p><strong>Performance Score:</strong> {deviceProfile.performanceScore}/100</p>
              <p><strong>Device Class:</strong> {deviceProfile.deviceClass}</p>
              <p><strong>Is Low-End:</strong> {deviceProfile.isLowEnd ? 'Yes' : 'No'}</p>
              <p><strong>Slow Network:</strong> {deviceProfile.isSlowNetwork ? 'Yes' : 'No'}</p>
              <p><strong>Data Saver:</strong> {deviceProfile.hasDataSaver ? 'Yes' : 'No'}</p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={resetWarnings}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Reset Warnings
                </button>
                <button
                  onClick={dismissAllWarnings}
                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Dismiss All
                </button>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default PerformanceWarning 