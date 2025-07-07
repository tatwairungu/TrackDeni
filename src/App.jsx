import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">TrackDeni</h1>
          <p className="text-gray-600">Your debt tracking companion</p>
        </header>
        
        <main className="space-y-4">
          <div className="card text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to TrackDeni!</h2>
            <p className="text-gray-600 mb-6">
              Start tracking debts with your mobile-first, offline-capable solution.
            </p>
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="btn-primary w-full"
            >
              Test Counter: {count}
            </button>
          </div>
          
          <div className="card">
            <h3 className="font-semibold text-lg mb-2">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">KES 0</p>
                <p className="text-sm text-gray-600">Total Owed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">KES 0</p>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
