import { useLiteMode } from '../hooks/useLiteMode'

const LiteModeIndicator = () => {
  const {
    isEnabled,
    reason,
    source,
    isLoading,
    isRecommended,
    recommendationReason,
    recommendationPriority,
    isAutoEnabled,
    isManuallySet,
    shouldShowRecommendation,
    enable,
    disable,
    reset,
    logStatus
  } = useLiteMode()

  // Don't render while loading
  if (isLoading) {
    return null
  }

  // Don't show anything if not enabled and not recommended
  if (!isEnabled && !shouldShowRecommendation) {
    return null
  }

  const getIndicatorColor = () => {
    if (!isEnabled && shouldShowRecommendation) {
      return recommendationPriority === 'high' 
        ? 'border-orange-200 bg-orange-50 text-orange-800'
        : 'border-blue-200 bg-blue-50 text-blue-800'
    }
    
    return isAutoEnabled 
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-purple-200 bg-purple-50 text-purple-800'
  }

  const getIcon = () => {
    if (!isEnabled && shouldShowRecommendation) {
      return '💡'
    }
    return isAutoEnabled ? '⚡' : '🎯'
  }

  const getTitle = () => {
    if (!isEnabled && shouldShowRecommendation) {
      return 'Lite Mode Recommended'
    }
    return isAutoEnabled ? 'Lite Mode Auto-Enabled' : 'Lite Mode Enabled'
  }

  const getMessage = () => {
    if (!isEnabled && shouldShowRecommendation) {
      return `${recommendationReason}. Enable Lite Mode for better performance?`
    }
    return `Lite Mode is active. ${reason}.`
  }

  const handleEnable = () => {
    enable('Enabled from recommendation')
  }

  const handleDisable = () => {
    disable('Disabled by user')
  }

  const handleReset = () => {
    reset()
  }

  return (
    <div className={`mb-4 p-3 rounded-lg border-l-4 ${getIndicatorColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg" role="img" aria-label="lite mode indicator">
            {getIcon()}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">{getTitle()}</p>
            <p className="text-xs mt-1 opacity-75">{getMessage()}</p>
            
            {/* Show benefits for enabled mode */}
            {isEnabled && (
              <div className="mt-2 text-xs opacity-60">
                <p>✓ Optimized for your device • Faster loading • Better battery life</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="ml-2 flex items-center space-x-1">
          {!isEnabled && shouldShowRecommendation && (
            <button
              onClick={handleEnable}
              className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary-dark transition-colors"
              aria-label="Enable Lite Mode"
            >
              Enable
            </button>
          )}
          
          {isEnabled && isManuallySet && (
            <button
              onClick={handleDisable}
              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
              aria-label="Disable Lite Mode"
            >
              Disable
            </button>
          )}
        </div>
      </div>
      
      {/* Development controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <details>
            <summary className="cursor-pointer text-xs font-medium opacity-60">
              🔧 Lite Mode Controls (Dev Only)
            </summary>
            <div className="mt-2 space-y-2">
              <div className="text-xs space-y-1">
                <p><strong>Status:</strong> {isEnabled ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Source:</strong> {source}</p>
                <p><strong>Reason:</strong> {reason}</p>
                <p><strong>Recommended:</strong> {isRecommended ? 'Yes' : 'No'}</p>
                {isRecommended && (
                  <p><strong>Recommendation:</strong> {recommendationReason} (Priority: {recommendationPriority})</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEnable}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  Force Enable
                </button>
                <button
                  onClick={handleDisable}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  Force Disable
                </button>
                <button
                  onClick={handleReset}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Reset to Auto
                </button>
                <button
                  onClick={logStatus}
                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Log Status
                </button>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default LiteModeIndicator 