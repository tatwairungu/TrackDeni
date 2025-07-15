import { useState } from 'react'
import { t, setLanguage } from '../utils/localization'

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0) // 0: language, 1-3: intro slides
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const languages = [
    { code: 'english', name: 'English', flag: '🇬🇧' },
    { code: 'swahili', name: 'Kiswahili', flag: '🇰🇪' },
  ]

  const slides = [
    {
      titleKey: 'onboarding.slide1.title',
      subtitleKey: 'onboarding.slide1.subtitle',
      descriptionKey: 'onboarding.slide1.description',
      icon: '👥',
      color: 'bg-primary'
    },
    {
      titleKey: 'onboarding.slide2.title',
      subtitleKey: 'onboarding.slide2.subtitle',
      descriptionKey: 'onboarding.slide2.description',
      icon: '💰',
      color: 'bg-success'
    },
    {
      titleKey: 'onboarding.slide3.title',
      subtitleKey: 'onboarding.slide3.subtitle',
      descriptionKey: 'onboarding.slide3.description',
      icon: '📱',
      color: 'bg-accent'
    }
  ]

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode)
    setLanguage(langCode) // Set language in localization system
    setCurrentStep(1) // Move to first slide
  }

  const handleFinish = () => {
    // Save language preference
    localStorage.setItem('trackdeni-language', selectedLanguage)
    
    // Complete onboarding
    onComplete()
  }

  if (currentStep === 0) {
    // Language Selection Screen
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">TD</span>
          </div>
          
          <h1 className="text-3xl font-bold text-text mb-2 text-center">TrackDeni</h1>
          <p className="text-gray-600 text-center mb-8">Choose your language / Chagua lugha yako</p>
          
          <div className="w-full max-w-sm space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedLanguage === lang.code
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium text-text">{lang.name}</span>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          <button
            onClick={handleFinish}
            className="w-full text-gray-500 text-sm py-3"
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  if (currentStep >= 1 && currentStep <= 3) {
    // Intro slides
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{slides[currentStep - 1].icon}</span>
            </div>
            <h2 className="text-xl font-bold text-text mb-2">{t(slides[currentStep - 1].titleKey)}</h2>
            <p className="text-gray-600 leading-relaxed">{t(slides[currentStep - 1].descriptionKey)}</p>
          </div>
          
          <div className="flex gap-2 justify-center mb-6">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep - 1 ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1 btn-primary py-3"
              >
                {t('next')}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex-1 btn-primary py-3"
              >
                {t('getStarted')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default OnboardingFlow 