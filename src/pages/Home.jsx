import { useState, useMemo } from 'react'
import useDebtStore from '../store/useDebtStore'
import CustomerCard from '../components/CustomerCard'
import Header from '../components/Header'

const Home = ({ onNavigateToAddDebt, onNavigateToCustomer }) => {
  const { customers, getTotalOwed, getTotalPaid } = useDebtStore()
  const [filter, setFilter] = useState('all') // all, overdue, due-soon, paid

  // Calculate totals
  const totalOwed = getTotalOwed()
  const totalPaid = getTotalPaid()

  // Filter customers based on their most urgent debt status
  const filteredCustomers = useMemo(() => {
    if (filter === 'all') return customers

    return customers.filter(customer => {
      const activeDebts = customer.debts.filter(debt => !debt.paid)
      
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

  // Get filter counts
  const getFilterCounts = () => {
    const counts = {
      all: customers.length,
      overdue: 0,
      'due-soon': 0,
      paid: 0
    }

    customers.forEach(customer => {
      const activeDebts = customer.debts.filter(debt => !debt.paid)
      
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

  const headerActions = [
    {
      label: 'Add Debt',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      variant: 'primary',
      onClick: onNavigateToAddDebt
    }
  ]

  return (
    <div className="min-h-screen bg-bg">
      <Header title="TrackDeni" actions={headerActions} />
      
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Summary Stats */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Customers</span>
              <span className="font-medium">{customers.length}</span>
            </div>
          </div>
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
                onClick={() => setFilter(key)}
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
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredCustomers.length === 0 ? (
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
                    onClick={onNavigateToAddDebt}
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
            filteredCustomers.map(customer => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={onNavigateToCustomer}
              />
            ))
          )}
        </div>

        {/* Quick Action */}
        {customers.length > 0 && (
          <div className="sticky bottom-4">
            <button
              onClick={onNavigateToAddDebt}
              className="w-full btn-primary py-4 text-lg shadow-lg"
            >
              Add New Debt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home 