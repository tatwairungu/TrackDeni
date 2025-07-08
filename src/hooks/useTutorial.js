import { useState, useEffect } from 'react'

export const useTutorial = () => {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)

  // Check if tutorial should be active
  useEffect(() => {
    const shouldShowTutorial = localStorage.getItem('shouldShowTutorial')
    const tutorialStep = localStorage.getItem('tutorialStep')
    
    if (shouldShowTutorial) {
      setIsActive(true)
      setCurrentStep(tutorialStep || 'highlight-add-button')
    }
  }, [])

  // Start the tutorial
  const startTutorial = () => {
    localStorage.setItem('shouldShowTutorial', 'true')
    localStorage.setItem('tutorialStep', 'highlight-add-button')
    setIsActive(true)
    setCurrentStep('highlight-add-button')
  }

  // Advance to next step
  const nextStep = (stepName) => {
    localStorage.setItem('tutorialStep', stepName)
    setCurrentStep(stepName)
  }

  // Complete the tutorial
  const completeTutorial = () => {
    localStorage.setItem('hasSeenTutorial', 'true')
    localStorage.removeItem('shouldShowTutorial')
    localStorage.removeItem('tutorialStep')
    setIsActive(false)
    setCurrentStep(null)
  }

  // Skip the tutorial
  const skipTutorial = () => {
    completeTutorial()
  }

  // Tutorial step progression handlers
  const onAddButtonClicked = () => {
    if (currentStep === 'highlight-add-button') {
      nextStep('fill-customer-form')
    }
  }

  const onCustomerFormSubmitted = (customerId) => {
    if (currentStep === 'fill-customer-form') {
      // Store the customer ID for the tutorial so we can reference it later
      localStorage.setItem('tutorialCustomerId', customerId)
      nextStep('record-payment')
    }
  }

  const onRecordPaymentClicked = () => {
    if (currentStep === 'record-payment') {
      nextStep('mark-as-paid')
    }
  }

  const onPaymentSubmitted = () => {
    if (currentStep === 'mark-as-paid') {
      nextStep('clear-data')
    }
  }

  const onClearDataClicked = () => {
    if (currentStep === 'clear-data') {
      completeTutorial()
    }
  }

  return {
    isActive,
    currentStep,
    startTutorial,
    nextStep,
    completeTutorial,
    skipTutorial,
    // Event handlers for tutorial progression
    onAddButtonClicked,
    onCustomerFormSubmitted,
    onRecordPaymentClicked,
    onPaymentSubmitted,
    onClearDataClicked
  }
} 