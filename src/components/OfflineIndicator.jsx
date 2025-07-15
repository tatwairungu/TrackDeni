import { useState, useEffect } from 'react'

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Show "back online" message briefly
      setShowIndicator(true)
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show indicator if already offline
    if (!navigator.onLine) {
      setShowIndicator(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOnline 
          ? 'bg-success text-white'
          : 'bg-accent text-white'
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-800'}`} />
        <span>
          {isOnline 
            ? '✅ Back online - data will sync automatically'
            : '📱 You\'re offline - your data is saved locally'
          }
        </span>
      </div>
    </div>
  )
}

export default OfflineIndicator 