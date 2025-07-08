import { useState, useEffect } from 'react'
import { getTodayDate, addDays } from '../utils/dateUtils'
import useDebtStore from '../store/useDebtStore'

// Helper function to safely parse monetary amounts (fixes floating point precision)
const parseMonetaryAmount = (amount) => {
  return Math.round(parseFloat(amount) * 100) / 100
}

const DebtForm = ({ customerId, onSuccess, onCancel, initialData = null, tutorial }) => {
  const { addCustomer, addDebt, customers } = useDebtStore()
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
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required'
      } else if (!/^(\+254|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid Kenyan phone number'
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
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    } else if (new Date(formData.dueDate) <= new Date(formData.dateBorrowed)) {
      newErrors.dueDate = 'Due date must be after date borrowed'
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
        // Check if customer already exists
        const existingByPhone = customers.find(c => 
          c.phone.replace(/\s/g, '') === formData.phone.replace(/\s/g, '')
        )
        
        if (existingByPhone) {
          setErrors({ phone: 'Customer with this phone number already exists' })
          setIsLoading(false)
          return
        }

        customerIdToUse = addCustomer({
          name: formData.name.trim(),
          phone: formData.phone.trim()
        })
      }

      // Add debt to customer
      addDebt(customerIdToUse, {
        amount: parseMonetaryAmount(formData.amount),
        reason: formData.reason.trim(),
        dateBorrowed: formData.dateBorrowed,
        dueDate: formData.dueDate
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
    <form onSubmit={handleSubmit} data-tutorial="customer-form" className="space-y-4">
      <h2 className="text-xl font-semibold text-text mb-4">
        {isNewCustomer ? 'Add New Customer & Debt' : `Add Debt for ${existingCustomer?.name || 'Customer'}`}
      </h2>

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
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.phone ? 'border-danger' : 'border-gray-300'
              }`}
              placeholder="0712345678 or +254712345678"
            />
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
            onWheel={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onKeyDown={(e) => {
              // Prevent arrow keys from changing the value
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault()
                e.stopPropagation()
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateBorrowed" className="block text-sm font-medium text-gray-700 mb-1">
              Date Borrowed *
            </label>
            <input
              type="date"
              id="dateBorrowed"
              value={formData.dateBorrowed}
              onChange={handleInputChange('dateBorrowed')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.dateBorrowed ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {errors.dateBorrowed && <p className="text-danger text-sm mt-1">{errors.dateBorrowed}</p>}
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange('dueDate')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.dueDate ? 'border-danger' : 'border-gray-300'
              }`}
            />
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
          className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Debt'}
        </button>
      </div>
    </form>
  )
}

export default DebtForm 