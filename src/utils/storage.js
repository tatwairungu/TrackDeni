// Universal storage system using IndexedDB with localStorage fallback
// This provides better performance and capacity for all users

const DB_NAME = 'TrackDeniDB'
const DB_VERSION = 1
const STORE_NAME = 'trackdeni-data'
const FALLBACK_KEY = 'trackdeni-storage'

class StorageManager {
  constructor() {
    this.db = null
    this.isIndexedDBAvailable = false
    this.initPromise = this.init()
  }

  async init() {
    try {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        throw new Error('IndexedDB not available')
      }

      // Open IndexedDB
      this.db = await this.openDB()
      this.isIndexedDBAvailable = true
      
      console.log('✅ IndexedDB initialized successfully')
      
      // Migrate existing localStorage data if needed
      await this.migrateFromLocalStorage()
      
    } catch (error) {
      console.warn('⚠️ IndexedDB failed, falling back to localStorage:', error.message)
      this.isIndexedDBAvailable = false
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          
          // Create indexes for better query performance
          store.createIndex('userTier', 'userTier', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
          
          console.log('🗄️ IndexedDB object store created with indexes')
        }
      }
    })
  }

  async migrateFromLocalStorage() {
    try {
      const localData = localStorage.getItem(FALLBACK_KEY)
      if (!localData) return

      const parsedData = JSON.parse(localData)
      
      // Save to IndexedDB directly (avoid circular dependency)
      await this.setDataToIndexedDB(parsedData)
      
      // Remove from localStorage after successful migration
      localStorage.removeItem(FALLBACK_KEY)
      
      console.log('📦 Data migrated from localStorage to IndexedDB')
      
    } catch (error) {
      console.warn('⚠️ Failed to migrate data from localStorage:', error)
    }
  }

  async ensureReady() {
    await this.initPromise
  }

  async getData() {
    await this.ensureReady()

    if (this.isIndexedDBAvailable) {
      return this.getDataFromIndexedDB()
    } else {
      return this.getDataFromLocalStorage()
    }
  }

  async setData(data) {
    await this.ensureReady()

    if (this.isIndexedDBAvailable) {
      return this.setDataToIndexedDB(data)
    } else {
      return this.setDataToLocalStorage(data)
    }
  }

  async getDataFromIndexedDB() {
    try {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('app-data')
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.data : null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('⚠️ IndexedDB read failed:', error)
      return null
    }
  }

  async setDataToIndexedDB(data) {
    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      // Check if record exists to preserve createdAt
      const existingRecord = await new Promise((resolve, reject) => {
        const getRequest = store.get('app-data')
        getRequest.onsuccess = () => resolve(getRequest.result)
        getRequest.onerror = () => reject(getRequest.error)
      })
      
      const record = {
        id: 'app-data',
        data: data,
        updatedAt: new Date().toISOString(),
        createdAt: existingRecord?.createdAt || new Date().toISOString()
      }
      
      const request = store.put(record)
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('⚠️ IndexedDB write failed:', error)
      throw error
    }
  }

  getDataFromLocalStorage() {
    try {
      const data = localStorage.getItem(FALLBACK_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('⚠️ localStorage read failed:', error)
      return null
    }
  }

  setDataToLocalStorage(data) {
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      console.warn('⚠️ localStorage write failed:', error)
      throw error
    }
  }

  async clearData() {
    await this.ensureReady()

    if (this.isIndexedDBAvailable) {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(true)
          request.onerror = () => reject(request.error)
        })
      } catch (error) {
        console.warn('⚠️ IndexedDB clear failed:', error)
      }
    } else {
      localStorage.removeItem(FALLBACK_KEY)
    }
  }

  async getStorageInfo() {
    await this.ensureReady()
    
    const info = {
      type: this.isIndexedDBAvailable ? 'IndexedDB' : 'localStorage',
      available: this.isIndexedDBAvailable,
      capacity: this.isIndexedDBAvailable ? 'Large (50MB+)' : 'Limited (5-10MB)',
      performance: this.isIndexedDBAvailable ? 'High (async)' : 'Medium (sync)',
      features: this.isIndexedDBAvailable ? ['Transactions', 'Indexes', 'Large storage'] : ['Simple', 'Synchronous']
    }
    
    return info
  }

  // Performance monitoring
  async measurePerformance(operation, data) {
    const startTime = performance.now()
    
    try {
      await operation(data)
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`📊 Storage ${operation.name} took ${duration.toFixed(2)}ms`)
      return duration
    } catch (error) {
      console.error(`❌ Storage ${operation.name} failed:`, error)
      throw error
    }
  }
}

// Create singleton instance
const storageManager = new StorageManager()

// Export the storage interface
export const storage = {
  // Core operations
  getData: () => storageManager.getData(),
  setData: (data) => storageManager.setData(data),
  clearData: () => storageManager.clearData(),
  
  // Utility operations
  getStorageInfo: () => storageManager.getStorageInfo(),
  measurePerformance: (operation, data) => storageManager.measurePerformance(operation, data),
  
  // Direct access to manager for advanced operations
  manager: storageManager
}

export default storage 