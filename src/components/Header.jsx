import { useState } from 'react'

const Header = ({ title = "TrackDeni", showBack = false, onBack, actions = [] }) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or logo */}
          <div className="flex items-center space-x-3">
            {showBack ? (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TD</span>
              </div>
            )}
            
            <h1 className="text-xl font-semibold text-text">{title}</h1>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`p-2 rounded-lg transition-colors ${
                  action.variant === 'primary' 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={action.label}
              >
                {action.icon || action.label}
              </button>
            ))}
            
            {/* Menu button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute right-4 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Export Data
            </button>
            <hr className="my-1" />
            <button className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-gray-100">
              Clear All Data
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 