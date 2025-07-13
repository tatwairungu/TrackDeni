// Test data utility for pagination testing
export const generateTestCustomers = (count = 30) => {
  const customers = []
  
  const firstNames = [
    'John', 'Jane', 'Peter', 'Mary', 'David', 'Sarah', 'Michael', 'Lisa', 'James', 'Emma',
    'Robert', 'Anna', 'William', 'Elizabeth', 'Thomas', 'Patricia', 'Charles', 'Jennifer',
    'Daniel', 'Linda', 'Matthew', 'Barbara', 'Anthony', 'Susan', 'Mark', 'Jessica',
    'Donald', 'Karen', 'Steven', 'Nancy', 'Paul', 'Betty', 'Andrew', 'Helen', 'Kenneth'
  ]
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
  ]
  
  const reasons = [
    'Grocery supplies', 'Mobile phone credit', 'School fees', 'Medical bills', 
    'Business loan', 'House rent', 'Transport fare', 'Emergency loan',
    'Farm equipment', 'Food supplies', 'Clothing', 'Household items'
  ]
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const phone = `+254${Math.floor(Math.random() * 900000000) + 700000000}`
    
    const customer = {
      id: `test-customer-${i + 1}`,
      name: `${firstName} ${lastName}`,
      phone: phone,
      debts: [],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Add 1-3 debts per customer
    const debtCount = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < debtCount; j++) {
      const amount = Math.floor(Math.random() * 5000) + 500
      const daysAgo = Math.floor(Math.random() * 30) + 1
      const daysDue = Math.floor(Math.random() * 60) - 30 // -30 to +30 days
      
      const debt = {
        id: `debt-${i + 1}-${j + 1}`,
        amount: amount,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        dateBorrowed: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + daysDue * 24 * 60 * 60 * 1000).toISOString(),
        paid: Math.random() < 0.3, // 30% chance of being paid
        payments: []
      }
      
      customer.debts.push(debt)
    }
    
    customers.push(customer)
  }
  
  return customers
}

// Development helper to add test customers to the store
export const addTestCustomersToStore = async (count = 30) => {
  // Import the store directly
  const useDebtStore = (await import('../store/useDebtStore.js')).default
  
  const testCustomers = generateTestCustomers(count)
  
  // Add customers using the store's addCustomer method
  // This respects free tier limits and other business logic
  let addedCount = 0
  
  for (const customer of testCustomers) {
    try {
      const result = await useDebtStore.getState().addCustomer(customer)
      if (result) {
        addedCount++
      } else {
        // Hit free tier limit or other constraint
        console.log(`⚠️ Could not add customer ${customer.name} - likely hit free tier limit`)
        break
      }
    } catch (error) {
      console.error(`❌ Error adding customer ${customer.name}:`, error)
      break
    }
  }
  
  console.log(`✅ Added ${addedCount} test customers for pagination testing`)
  
  if (addedCount < count) {
    console.log(`💡 Only added ${addedCount} of ${count} customers. This is likely due to free tier limit (5 customers).`)
    console.log(`💡 Use trackDeniDev.upgradeToPro() to test with more customers.`)
  }
  
  return addedCount
} 