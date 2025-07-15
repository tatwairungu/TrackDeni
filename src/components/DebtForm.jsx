import { useState, useEffect } from 'react'
import { getTodayDate, addDays } from '../utils/dateUtils'
import useDebtStore from '../store/useDebtStore'
import UpgradePrompt from './UpgradePrompt'
import SimpleToggle from './SimpleToggle'

// Helper function to safely parse monetary amounts (fixes floating point precision)
const parseMonetaryAmount = (amount) => {
  return Math.round(parseFloat(amount) * 100) / 100
}

const DebtForm = ({ customerId, onSuccess, onCancel, initialData = null }) => {
  const { 
    addCustomer, 
    addDebt, 
    customers, 
    canAddCustomer,
    showUpgradePrompt,
    hideUpgradePrompt,
    showUpgradeModal,
    getRemainingCustomerSlots,
    isFreeTier
  } = useDebtStore()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '',
    reason: '',
    dateBorrowed: getTodayDate(),
    dueDate: addDays(getTodayDate(), 7), // Default: 1 week from today
    ...initialData
  })

  // Toggle states for optional features
  const [includePhone, setIncludePhone] = useState(true)
  const [includeDueDate, setIncludeDueDate] = useState(true)

  // If we have a customerId, we're adding debt to existing customer
  const isNewCustomer = !customerId
  const existingCustomer = customerId ? customers.find(c => c.id === customerId) : null

  useEffect(() => {
    if (existingCustomer) {
      setFormData(prev => ({
        ...prev,
        name: existingCustomer.name,
        phone: existingCustomer.phone
      }))
    }
  }, [existingCustomer])

  const validateForm = () => {
    const newErrors = {}

    // Customer validation (only for new customers)
    if (isNewCustomer) {
      if (!formData.name.trim()) {
        newErrors.name = 'Customer name is required'
      }
      if (includePhone) {
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required'
        } else if (!/^(\+254|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
          newErrors.phone = 'Please enter a valid Kenyan phone number'
        }
      }
    }

    // Debt validation
    if (!formData.amount || parseMonetaryAmount(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }
    if (!formData.dateBorrowed) {
      newErrors.dateBorrowed = 'Date borrowed is required'
    }
    if (includeDueDate) {
      if (!formData.dueDate) {
        newErrors.dueDate = 'Due date is required'
      } else if (new Date(formData.dueDate) <= new Date(formData.dateBorrowed)) {
        newErrors.dueDate = 'Due date must be after date borrowed'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      let customerIdToUse = customerId

      // Create new customer if needed
      if (isNewCustomer) {
        // Check free tier limit before creating new customer
        if (!canAddCustomer()) {
          showUpgradeModal()
          setIsLoading(false)
          return
        }
        
        // Check if customer already exists
        if (includePhone && formData.phone.trim()) {
          const existingByPhone = customers.find(c => 
            c.phone && c.phone.replace(/\s/g, '') === formData.phone.replace(/\s/g, '')
          )
          
          if (existingByPhone) {
            setErrors({ phone: 'Customer with this phone number already exists' })
            setIsLoading(false)
            return
          }
        }

        // Check for existing customer by name (more flexible for informal businesses)
        const existingByName = customers.find(c => 
          c.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
        )
        
        if (existingByName) {
          setErrors({ name: 'Customer with this name already exists' })
          setIsLoading(false)
          return
        }

        customerIdToUse = await addCustomer({
          name: formData.name.trim(),
          phone: includePhone ? formData.phone.trim() : ''
        })
        
        // Check if customer creation failed due to limit
        if (!customerIdToUse) {
          setIsLoading(false)
          return
        }
      }

      // Add debt to customer
      await addDebt(customerIdToUse, {
        amount: parseMonetaryAmount(formData.amount),
        reason: formData.reason.trim(),
        dateBorrowed: formData.dateBorrowed,
        dueDate: includeDueDate ? formData.dueDate : null
      })

      // Reset form
      setFormData({
        name: '',
        phone: '',
        amount: '',
        reason: '',
        dateBorrowed: getTodayDate(),
        dueDate: addDays(getTodayDate(), 7)
      })

      if (onSuccess) {
        onSuccess(customerIdToUse)
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save debt. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-text mb-4">
        {isNewCustomer ? 'Add New Customer & Debt' : `Add Debt for ${existingCustomer?.name || 'Customer'}`}
      </h2>

      {/* Free tier warning for new customers */}
      {isNewCustomer && isFreeTier() && getRemainingCustomerSlots() <= 1 && (
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-accent">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-accent">
                {getRemainingCustomerSlots() === 0 
                  ? 'Free tier limit reached!' 
                  : `Only ${getRemainingCustomerSlots()} customer slot remaining`}
              </p>
              <p className="text-xs text-gray-600">
                {getRemainingCustomerSlots() === 0 
                  ? 'You cannot add more customers on the free tier' 
                  : 'Upgrade to Pro for unlimited customers'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Pro tier celebration for new customers */}
      {isNewCustomer && !isFreeTier() && (
        <div className="p-3 bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-primary">✨</span>
            <div>
              <p className="text-sm font-semibold text-primary">
                Adding customers with TrackDeni Pro!
              </p>
              <p className="text-xs text-gray-600">
                No limits - grow your business as much as you want.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Information (only for new customers) */}
      {isNewCustomer && (
        <div className="space-y-4 pb-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Customer Information</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange('name')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.name ? 'border-danger' : 'border-gray-300'
              }`}
              placeholder="Enter customer name"
            />
            {errors.name && <p className="text-danger text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number {includePhone && <span className="text-danger">*</span>}
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-sm transition-colors ${includePhone ? 'text-gray-600' : 'text-gray-400'}`}>
                  {includePhone ? 'Required' : 'Optional'}
                </span>
                <SimpleToggle
                  enabled={includePhone}
                  onToggle={() => setIncludePhone(!includePhone)}
                  label="Toggle phone number requirement"
                />
              </div>
            </div>
            
            {includePhone && (
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                  errors.phone ? 'border-danger' : 'border-gray-300'
                }`}
                placeholder="0712345678 or +254712345678"
              />
            )}
            
            {!includePhone && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-accent text-sm font-medium">SMS features disabled</p>
                    <p className="text-accent/80 text-xs mt-1">
                      Without a phone number, you won't be able to send payment reminders or track this customer's payment history via SMS.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {errors.phone && <p className="text-danger text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>
      )}

      {/* Debt Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-800">Debt Information</h3>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (KES) *
          </label>
          <input
            type="number"
            id="amount"
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange('amount')}
            onWheel={(e) => e.currentTarget.blur()}
            onKeyDown={(e) => {
              // Prevent arrow keys from changing the value
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault()
              }
            }}
            style={{
              MozAppearance: 'textfield' // Firefox
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.amount ? 'border-danger' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            What was borrowed? *
          </label>
          <input
            type="text"
            id="reason"
            value={formData.reason}
            onChange={handleInputChange('reason')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.reason ? 'border-danger' : 'border-gray-300'
            }`}
            placeholder="e.g., Sukari 2kg, Unga 1kg, Loan"
          />
          {errors.reason && <p className="text-danger text-sm mt-1">{errors.reason}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateBorrowed" className="block text-sm font-medium text-gray-700 mb-2">
              Date Borrowed <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              id="dateBorrowed"
              value={formData.dateBorrowed}
              onChange={handleInputChange('dateBorrowed')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                errors.dateBorrowed ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {errors.dateBorrowed && <p className="text-danger text-sm mt-1">{errors.dateBorrowed}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date {includeDueDate && <span className="text-danger">*</span>}
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-sm transition-colors ${includeDueDate ? 'text-gray-600' : 'text-gray-400'}`}>
                  {includeDueDate ? 'Set date' : 'Open-ended'}
                </span>
                <SimpleToggle
                  enabled={includeDueDate}
                  onToggle={() => setIncludeDueDate(!includeDueDate)}
                  label="Toggle due date requirement"
                />
              </div>
            </div>
            
            {includeDueDate && (
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange('dueDate')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                  errors.dueDate ? 'border-danger' : 'border-gray-300'
                }`}
              />
            )}
            
            {!includeDueDate && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-primary text-sm font-medium">Open-ended debt</p>
                    <p className="text-primary/80 text-xs mt-1">
                      This debt doesn't have a due date. You can set reminders manually or add a due date later.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {errors.dueDate && <p className="text-danger text-sm mt-1">{errors.dueDate}</p>}
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
          <p className="text-danger text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Summary warning when both features are disabled */}
      {isNewCustomer && !includePhone && !includeDueDate && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-purple-100 rounded-full">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-purple-800 text-sm font-semibold">🌟 Fully Informal Mode</p>
              <p className="text-purple-700 text-xs mt-1 leading-relaxed">
                Perfect for local community businesses! This customer will be tracked by name only with flexible payment terms.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[1.5] py-3.5 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-md"
        >
          {isLoading ? 'Saving...' : 'Save Debt'}
        </button>
      </div>
      
      {/* Upgrade Prompt */}
      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={hideUpgradePrompt}
      />
    </form>
  )
}

export default DebtForm 