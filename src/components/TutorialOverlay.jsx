import { useState } from 'react'
import { t } from '../utils/localization'

const TutorialOverlay = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  
  const tutorialSteps = [
    {
      titleKey: 'tutorial.step1.title',
      descriptionKey: 'tutorial.step1.description',
      target: 'add-button', // Target the + button
      icon: '👆'
    },
    {
      titleKey: 'tutorial.step2.title', 
      descriptionKey: 'tutorial.step2.description',
      target: 'customer-form',
      icon: '📝'
    },
    {
      titleKey: 'tutorial.step3.title',
      descriptionKey: 'tutorial.step3.description', 
      target: 'payment-button',
      icon: '💰'
    },
    {
      titleKey: 'tutorial.step4.title',
      descriptionKey: 'tutorial.step4.description',
      target: 'complete',
      icon: '✅'
    }
  ]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      localStorage.setItem('hasSeenTutorial', 'true')
      localStorage.removeItem('shouldShowTutorial')
      onComplete()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true')
    localStorage.removeItem('shouldShowTutorial')
    onComplete()
  }

  const currentStepData = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-sm mx-4 p-6 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{currentStepData.icon}</span>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">{t(currentStepData.titleKey)}</h2>
          <p className="text-gray-600 leading-relaxed">{t(currentStepData.descriptionKey)}</p>
        </div>

        <div className="flex gap-2 justify-center mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {t('skip')}
          </button>
          <button
            onClick={handleNext}
            className="flex-1 btn-primary py-3"
          >
            {currentStep === tutorialSteps.length - 1 ? t('getStarted') : t('next')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TutorialOverlay 