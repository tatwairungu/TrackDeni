import { useState, useEffect } from 'react'
import { t } from '../utils/localization'

const InteractiveTutorial = ({ currentStep, onComplete, onStepComplete }) => {
  const [showHint, setShowHint] = useState(true)
  const [targetPos, setTargetPos] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [modalDismissed, setModalDismissed] = useState(false)
  const [buttonClicked, setButtonClicked] = useState(false)

  const tutorialSteps = {
    'highlight-add-button': {
      titleKey: 'tutorial.interactive.step1.title',
      descriptionKey: 'tutorial.interactive.step1.description', 
      target: 'add-debt-button',
      position: 'bottom-right',
      icon: '👆',
      action: 'click'
    },
    'fill-customer-form': {
      titleKey: 'tutorial.interactive.step2.title',
      descriptionKey: 'tutorial.interactive.step2.description',
      target: 'customer-form',
      position: 'top',
      icon: '📝',
      action: 'submit'
    },
    'record-payment': {
      titleKey: 'tutorial.interactive.step3.title',
      descriptionKey: 'tutorial.interactive.step3.description',
      target: 'pay-button',
      position: 'bottom',
      icon: '💰',
      action: 'click'
    },
    'payment-options': {
      titleKey: 'tutorial.interactive.step4.title',
      descriptionKey: 'tutorial.interactive.step4.description',
      target: 'payment-modal',
      position: 'top',
      icon: '⚡',
      action: 'submit'
    },
    'tutorial-complete': {
      titleKey: 'tutorial.interactive.step5.title',
      descriptionKey: 'tutorial.interactive.step5.description',
      target: 'record-payment-button',
      position: 'bottom',
      icon: '🎉',
      action: 'click'
    }
  }

  const currentStepData = tutorialSteps[currentStep]

  // Debug logging
  console.log('InteractiveTutorial: currentStep =', currentStep, 'currentStepData =', currentStepData)

  if (!currentStep || !currentStepData) {
    return null
  }

  // Reset modal dismissed state when step changes
  useEffect(() => {
    setModalDismissed(false)
    setButtonClicked(false)
  }, [currentStep])

  // Update target position when step changes
  useEffect(() => {
    if (!currentStepData) return
    
    const target = document.querySelector(`[data-tutorial="${currentStepData.target}"]`)
    console.log('InteractiveTutorial: Looking for target:', currentStepData.target, 'Found:', target)
    if (!target) {
      console.log('InteractiveTutorial: Target not found, setting empty position')
      setTargetPos({ top: 0, left: 0, width: 0, height: 0 })
      return
    }
    
    const rect = target.getBoundingClientRect()
    setTargetPos({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    })

    // Add click listener to target button to hide speech bubble
    const handleTargetClick = () => {
      setButtonClicked(true)
    }

    target.addEventListener('click', handleTargetClick)
    
    // Cleanup
    return () => {
      target.removeEventListener('click', handleTargetClick)
    }
  }, [currentStep])

  // Center the modal on screen for better responsiveness
  const getHintPosition = () => {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const hintPosition = getHintPosition()

  // Steps that allow dismissing the modal to interact with the form
  const interactiveSteps = ['fill-customer-form', 'record-payment', 'payment-options']

  return (
    <>
      {/* Overlay with cutout to highlight target element */}
      {!modalDismissed && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50"></div>
          
          {/* Cutout highlight */}
          <div 
            className="absolute border-4 border-primary rounded-lg bg-transparent"
            style={{
              top: targetPos.top - 4,
              left: targetPos.left - 4,
              width: targetPos.width + 8,
              height: targetPos.height + 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }}
          />
        </div>
      )}

      {/* Tutorial hint */}
      {showHint && !modalDismissed && (
        <>
          {/* Hand emoji pointing to target */}
          <div 
            className="fixed z-50 text-4xl pointer-events-none animate-bounce"
            style={{
              top: currentStep === 'highlight-add-button' ? targetPos.top + targetPos.height + 10 : targetPos.top + targetPos.height / 2,
              left: currentStep === 'highlight-add-button' ? targetPos.left + targetPos.width - 20 : targetPos.left - 60,
              transform: currentStep === 'highlight-add-button' ? 'rotate(-45deg)' : 'translateY(-50%)'
            }}
          >
            {currentStepData.icon}
          </div>
          
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl p-6 w-80 max-w-[90vw] pointer-events-auto"
            style={hintPosition}
          >
            <div className="text-center">
              <h3 className="font-semibold text-text mb-2 text-lg">{t(currentStepData.titleKey)}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{t(currentStepData.descriptionKey)}</p>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  localStorage.setItem('hasSeenTutorial', 'true')
                  localStorage.removeItem('shouldShowTutorial')
                  localStorage.removeItem('tutorialStep')
                  onComplete()
                }}
                className="text-sm text-gray-500 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('skip')}
              </button>
              
              {interactiveSteps.includes(currentStep) && (
                <button
                  onClick={() => setModalDismissed(true)}
                  className="text-sm bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                >
                  Got it!
                </button>
              )}
              
              {currentStep === 'tutorial-complete' && (
                <button
                  onClick={() => {
                    // Clear tutorial state
                    localStorage.setItem('hasSeenTutorial', 'true')
                    localStorage.removeItem('shouldShowTutorial')
                    localStorage.removeItem('tutorialStep')
                    
                    // Clear test data - use the correct localStorage key
                    localStorage.removeItem('trackdeni-storage')
                    
                    // Complete tutorial and refresh
                    onComplete()
                    window.location.reload()
                  }}
                  className="text-sm bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                >
                  {t('tutorial.complete')}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Highlight target when modal is dismissed */}
      {showHint && modalDismissed && !buttonClicked && interactiveSteps.includes(currentStep) && currentStep !== 'payment-options' && (
        <>
          {/* Pulsing border around target button */}
          <div 
            className="fixed z-40 border-4 border-primary rounded-lg animate-pulse pointer-events-none"
            style={{
              top: targetPos.top - 4,
              left: targetPos.left - 4,
              width: targetPos.width + 8,
              height: targetPos.height + 8,
              boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)'
            }}
          />

          {/* Text bubble above the button */}
          <div 
            className="fixed z-50 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium pointer-events-none shadow-lg"
            style={{
              top: targetPos.top - 50,
              left: targetPos.left + targetPos.width / 2,
              transform: 'translateX(-50%)'
            }}
          >
            {currentStep === 'record-payment' ? 'Click here!' : 'Click this!'}
            
            {/* Arrow pointing down to button */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgb(34, 197, 94)'
              }}
            />
          </div>
        </>
      )}

    </>
  )
}

export default InteractiveTutorial 