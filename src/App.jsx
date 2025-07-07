import { useState } from 'react'
import Home from './pages/Home'
import AddDebt from './pages/AddDebt'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const navigateToHome = () => {
    setCurrentPage('home')
    setSelectedCustomerId(null)
  }

  const navigateToAddDebt = (customerId = null) => {
    setSelectedCustomerId(customerId)
    setCurrentPage('add-debt')
  }

  const navigateToCustomer = (customer) => {
    // For now, we'll navigate to add debt for this customer
    // In the future, this could go to a customer detail page
    navigateToAddDebt(customer.id)
  }

  const handleDebtSuccess = (customerId) => {
    // Navigate back to home after successful debt creation
    navigateToHome()
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'add-debt':
        return (
          <AddDebt
            customerId={selectedCustomerId}
            onBack={navigateToHome}
            onSuccess={handleDebtSuccess}
          />
        )
      case 'home':
      default:
        return (
          <Home
            onNavigateToAddDebt={navigateToAddDebt}
            onNavigateToCustomer={navigateToCustomer}
          />
        )
    }
  }

  return renderCurrentPage()
}

export default App
