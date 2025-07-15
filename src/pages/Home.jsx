import { useState, useMemo } from 'react'
import useDebtStore from '../store/useDebtStore'
import CustomerCard from '../components/CustomerCard'
import Header from '../components/Header'
import UpgradePrompt from '../components/UpgradePrompt'
import ProWelcomeModal from '../components/ProWelcomeModal'
import PerformanceWarning from '../components/PerformanceWarning'
import LiteModeIndicator from '../components/LiteModeIndicator'
import StorageIndicator from '../components/StorageIndicator'

const Home = ({ onNavigateToAddDebt, onNavigateToCustomer, user, signIn, signOut }) => {
  const { 
    customers, 
    getTotalOwed, 
    getTotalPaid, 
    clearAllData, 
    isFreeTier,
    canAddCustomer,
    getCustomerLimit,
    getRemainingCustomerSlots,
    showUpgradePrompt,
    hideUpgradePrompt,
    showUpgradeModal,
    showProWelcome,
    hideProWelcomeModal,
    // Pagination
    currentPage,
    getPaginatedCustomers,
    goToNextPage,
    goToPrevPage,
    resetPagination
  } = useDebtStore()
  const [filter, setFilter] = useState('all') // all, overdue, due-soon, paid

  // Calculate totals
  const totalOwed = getTotalOwed()
  const totalPaid = getTotalPaid()

  // Filter customers based on their most urgent debt status
  const filteredCustomers = useMemo(() => {
    if (filter === 'all') return customers

    return customers.filter(customer => {
      const activeDebts = customer.debts.filter(debt => !debt.paid && debt.amount > 0) // Exclude credit entries
      
      if (filter === 'paid') {
        return activeDebts.length === 0 && customer.debts.length > 0
      }

      // For overdue and due-soon, check if customer has any debts with that status
      return activeDebts.some(debt => {
        const today = new Date()
        const dueDate = new Date(debt.dueDate)
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
        
        if (filter === 'overdue') {
          return daysDiff < 0
        }
        if (filter === 'due-soon') {
          return daysDiff >= 0 && daysDiff <= 3
        }
        return false
      })
    })
  }, [customers, filter])

  // Get paginated customers
  const paginationData = useMemo(() => {
    return getPaginatedCustomers(filteredCustomers)
  }, [filteredCustomers, currentPage, getPaginatedCustomers])

  // Handle filter change with pagination reset
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    resetPagination()
  }
  
  // Get filter counts
  const getFilterCounts = () => {
    const counts = {
      all: customers.length,
      overdue: 0,
      'due-soon': 0,
      paid: 0
    }

    customers.forEach(customer => {
      const activeDebts = customer.debts.filter(debt => !debt.paid && debt.amount > 0) // Exclude credit entries
      
      if (activeDebts.length === 0 && customer.debts.length > 0) {
        counts.paid++
        return
      }

      const hasOverdue = activeDebts.some(debt => {
        const today = new Date()
        const dueDate = new Date(debt.dueDate)
        return dueDate < today
      })

      const hasDueSoon = activeDebts.some(debt => {
        const today = new Date()
        const dueDate = new Date(debt.dueDate)
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
        return daysDiff >= 0 && daysDiff <= 3
      })

      if (hasOverdue) counts.overdue++
      else if (hasDueSoon) counts['due-soon']++
    })

    return counts
  }

  const filterCounts = getFilterCounts()

  // Menu action handlers
  const handleSettings = () => {
    // For now, just show an alert - we can implement a proper settings modal later
    alert('Settings functionality coming soon!')
  }

  const handleExportData = () => {
    try {
      const data = {
        customers,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trackdeni-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export data. Please try again.')
    }
  }

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone.\n\n' +
      'This will delete:\n' +
      '• All customers\n' +
      '• All debts\n' +
      '• All payment history\n\n' +
      'Consider exporting your data first.'
    )
    
    if (confirmed) {
      clearAllData()
      alert('All data has been cleared successfully.')
    }
  }

  const handleAddDebt = () => {
    // Check if user can add customers (free tier limit)
    if (!canAddCustomer()) {
      // Show upgrade prompt instead of navigating
      showUpgradeModal()
      return
    }
    
    onNavigateToAddDebt(null, true)
  }

  const headerActions = [
    {
      label: 'Add Customer',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      variant: 'primary',
      onClick: handleAddDebt
    }
  ]

  return (
    <div className="min-h-screen bg-bg">
      <Header
        title="TrackDeni"
        actions={headerActions}
        onSettings={handleSettings}
        onExportData={handleExportData}
        onClearAllData={handleClearAllData}
        user={user}
        onSignIn={signIn}
        onSignOut={signOut}
      />
      
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto p-4 space-y-6">
        {/* Performance Warnings */}
        <PerformanceWarning />
        
        {/* Lite Mode Indicator */}
        <LiteModeIndicator />

        {/* Storage Indicator (Development Only) */}
        <StorageIndicator />
        
        {/* Summary Stats */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Overview</h2>
            <div className="flex items-center space-x-2">
              {isFreeTier() ? (
                <>
                  <span className="text-sm text-gray-600">Free Tier</span>
                  <button
                    onClick={showUpgradeModal}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Upgrade
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-primary to-success px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-semibold">✨ PRO</span>
                  </div>
                  <span className="text-sm text-gray-600">Member</span>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-danger/10 rounded-lg">
              <p className="text-2xl font-bold text-danger">
                KES {totalOwed.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Owed</p>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <p className="text-2xl font-bold text-success">
                KES {totalPaid.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Paid</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg lg:block">
              <p className="text-2xl font-bold text-primary">
                {customers.length}
                {isFreeTier() && <span className="text-sm text-gray-600">/{getCustomerLimit()}</span>}
                {!isFreeTier() && (
                  <span className="text-xs text-success ml-1">∞</span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                {isFreeTier() ? 'Customers Used' : 'Active Customers'}
              </p>
              {!isFreeTier() && (
                <p className="text-xs text-success font-medium mt-1">Unlimited</p>
              )}
            </div>
          </div>
          
          {/* Free tier warning */}
          {isFreeTier() && getRemainingCustomerSlots() <= 1 && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
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
                      ? 'Upgrade to Pro to add more customers' 
                      : 'Upgrade to Pro for unlimited customers'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Pro tier celebration */}
          {!isFreeTier() && customers.length >= 5 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-primary">🎉</span>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Growing strong with {customers.length} customers!
                  </p>
                  <p className="text-xs text-gray-600">
                    No limits with TrackDeni Pro - keep adding more customers as you grow!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <div className="grid grid-cols-4 gap-1">
            {[
              { key: 'all', label: 'All', count: filterCounts.all },
              { key: 'overdue', label: 'Overdue', count: filterCounts.overdue },
              { key: 'due-soon', label: 'Due Soon', count: filterCounts['due-soon'] },
              { key: 'paid', label: 'Paid', count: filterCounts.paid },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1 text-xs ${
                    filter === key ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    ({count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text">
              {filter === 'all' ? 'All Customers' : 
               filter === 'overdue' ? 'Overdue Customers' :
               filter === 'due-soon' ? 'Due Soon' :
               'Paid Up Customers'}
            </h3>
            <span className="text-sm text-gray-500">
              {paginationData.totalCustomers} customer{paginationData.totalCustomers !== 1 ? 's' : ''}
              {paginationData.totalPages > 1 && (
                <span className="ml-2 text-xs">
                  (Page {paginationData.currentPage} of {paginationData.totalPages})
                </span>
              )}
            </span>
          </div>

          {paginationData.totalCustomers === 0 ? (
            <div className="card text-center py-8">
              {customers.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">No customers yet</h4>
                  <p className="text-gray-600 mb-4">Start by adding your first customer and their debt.</p>
                  <button
                    onClick={() => onNavigateToAddDebt(null, true)}
                    className="btn-primary"
                  >
                    Add First Customer
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    No {filter === 'overdue' ? 'overdue' : 
                        filter === 'due-soon' ? 'due soon' : 
                        'paid up'} customers
                  </h4>
                  <p className="text-gray-600">
                    {filter === 'overdue' && 'Great! No customers have overdue debts.'}
                    {filter === 'due-soon' && 'No debts are due in the next 3 days.'}
                    {filter === 'paid' && 'No customers have fully paid their debts yet.'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginationData.customers.map(customer => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onClick={onNavigateToCustomer}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {paginationData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPrevPage}
                      disabled={!paginationData.hasPrevPage}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        paginationData.hasPrevPage
                          ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={!paginationData.hasNextPage}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        paginationData.hasNextPage
                          ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Showing {((paginationData.currentPage - 1) * paginationData.itemsPerPage) + 1} to {' '}
                    {Math.min(paginationData.currentPage * paginationData.itemsPerPage, paginationData.totalCustomers)} of {' '}
                    {paginationData.totalCustomers} customers
                  </div>
                </div>
              )}
            </>
          )}
        </div>


      </div>
      
      {/* Upgrade Prompt */}
      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={hideUpgradePrompt}
      />
      
      {/* Pro Welcome Modal */}
      <ProWelcomeModal 
        isOpen={showProWelcome}
        onClose={hideProWelcomeModal}
      />
    </div>
  )
}

export default Home 