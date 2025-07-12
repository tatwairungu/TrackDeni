import { useState, useEffect } from 'react'

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running as standalone app
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = window.navigator.standalone === true
      
      setIsStandalone(standalone || isIOSStandalone)
      
      // Don't show prompt if already installed
      if (standalone || isIOSStandalone) {
        setIsInstalled(true)
        return true
      }
      
      return false
    }

    if (checkIfInstalled()) return

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired')
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Store the event for later use
      setDeferredPrompt(e)
      
      // Check if user has previously dismissed the prompt
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = localStorage.getItem('pwa-install-dismissed-time')
      
      // Show prompt again after 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (!dismissed || (dismissedTime && parseInt(dismissedTime) < sevenDaysAgo)) {
        // Delay showing the prompt to avoid overwhelming the user
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000) // Show after 3 seconds
      }
    }

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('PWA: App was installed')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // Track installation
      if (typeof gtag !== 'undefined') {
        gtag('event', 'app_install', {
          method: 'pwa_prompt'
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      const result = await deferredPrompt.prompt()
      
      console.log('PWA: Install prompt result:', result.outcome)
      
      // Track user's choice
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install_prompt', {
          choice: result.outcome
        })
      }
      
      if (result.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
        setShowPrompt(false)
      } else {
        console.log('PWA: User dismissed the install prompt')
        handleDismiss()
      }
      
      // Reset the deferred prompt
      setDeferredPrompt(null)
      
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString())
    
    // Track dismissal
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_dismissed')
    }
  }

  // Don't render if installed or no prompt available
  if (isInstalled || isStandalone || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slideUp">
        <div className="flex items-start space-x-3">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">TD</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Install TrackDeni
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Get faster access and work offline. Install our app for the best experience.
            </p>
            
            {/* Benefits */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Works offline
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Faster loading
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary-dark transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-500 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt 