import { useState, useEffect } from 'react'
import storage from '../utils/storage'

const StorageIndicator = () => {
  const [storageInfo, setStorageInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getStorageInfo = async () => {
      try {
        const info = await storage.getStorageInfo()
        setStorageInfo(info)
      } catch (error) {
        console.warn('Failed to get storage info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getStorageInfo()
  }, [])

  if (isLoading) {
    return null
  }

  if (!storageInfo) {
    return null
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getIcon = () => {
    return storageInfo.type === 'IndexedDB' ? '🗄️' : '📦'
  }

  const getStatusColor = () => {
    return storageInfo.type === 'IndexedDB' ? 'text-green-600' : 'text-orange-600'
  }

  const getBadgeColor = () => {
    return storageInfo.type === 'IndexedDB' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
  }

  return (
    <div className="card bg-gray-50 border-dashed border-gray-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getIcon()}</span>
          <div>
            <h3 className="text-sm font-medium text-gray-800">
              Storage System
            </h3>
            <p className="text-xs text-gray-600">
              {storageInfo.type} • {storageInfo.capacity}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}>
            {storageInfo.type}
          </span>
          {storageInfo.type === 'IndexedDB' && (
            <span className="text-xs text-green-600">✓ Optimal</span>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Performance:</span>
          <span className={getStatusColor()}>{storageInfo.performance}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>Features:</span>
          <span className="text-gray-700">{storageInfo.features.slice(0, 2).join(', ')}</span>
        </div>
      </div>
      
      {storageInfo.type === 'localStorage' && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
          <p className="text-orange-800">
            <strong>Note:</strong> Using localStorage fallback. IndexedDB unavailable in this environment.
          </p>
        </div>
      )}
      
      {storageInfo.type === 'IndexedDB' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
          <p className="text-green-800">
            <strong>Optimized:</strong> Using IndexedDB for better performance and storage capacity.
          </p>
        </div>
      )}
    </div>
  )
}

export default StorageIndicator 