import { lazy } from 'react'

// Lazy load modal components for better performance
export const PaymentModal = lazy(() => import('../components/PaymentModal'))
export const ProWelcomeModal = lazy(() => import('../components/ProWelcomeModal'))
export const UpgradePrompt = lazy(() => import('../components/UpgradePrompt'))
export const ConfirmationDialog = lazy(() => import('../components/ConfirmationDialog'))

// Lazy load page components
export const AddDebt = lazy(() => import('../pages/AddDebt'))
export const CustomerDetail = lazy(() => import('../pages/CustomerDetail'))

// Lazy load form components
export const DebtForm = lazy(() => import('../components/DebtForm'))

// Loading component for suspense fallback
export const LoadingFallback = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

// Page-specific loading fallbacks
export const PageLoadingFallback = ({ message = 'Loading page...' }) => (
  <div className="min-h-screen bg-bg">
    <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  </div>
)

// Modal loading fallback (smaller)
export const ModalLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
  </div>
) 