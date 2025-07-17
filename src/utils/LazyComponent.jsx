import React, { lazy, Suspense } from 'react'

// Loading fallback component
const LoadingFallback = ({ inline = false, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  if (inline) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]} mx-auto mb-2`} />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Error boundary component
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Lazy component error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-gray-600">Failed to load component</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs text-primary hover:underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Main lazy component wrapper
export const createLazyComponent = (importFunc, fallbackProps = {}) => {
  const LazyComponent = lazy(importFunc)
  
  return (props) => (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingFallback {...fallbackProps} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  )
}

// Utility for lazy loading with preloading
export const createPreloadableLazyComponent = (importFunc, fallbackProps = {}) => {
  const LazyComponent = lazy(importFunc)
  
  const WrappedComponent = (props) => (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingFallback {...fallbackProps} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  )

  // Add preload method
  WrappedComponent.preload = importFunc

  return WrappedComponent
}

export default createLazyComponent 