import { useState } from 'react'
import { t, setLanguage } from '../utils/localization'

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0) // 0: language, 1-3: intro slides, 4: tutorial prompt
  const [selectedLanguage, setSelectedLanguage] = useState('english')

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

  const handleNext = () => {
    if (currentStep < slides.length) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === slides.length) {
      // Move to tutorial prompt
      setCurrentStep(currentStep + 1)
    } else {
      // Store completion in localStorage and complete onboarding
      localStorage.setItem('hasSeenIntro', 'true')
      localStorage.setItem('hasSeenTutorial', 'true')
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenIntro', 'true')
    localStorage.setItem('hasSeenTutorial', 'true')
    onComplete()
  }

  const handleStartTutorial = () => {
    localStorage.setItem('hasSeenIntro', 'true')
    localStorage.setItem('shouldShowTutorial', 'true')
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
            onClick={handleSkip}
            className="w-full text-gray-500 text-sm py-3"
          >
            Skip for now
          </button>
        </div>
      </div>
    )
  }

  // Tutorial Prompt Screen
  if (currentStep === slides.length + 1) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-8">
            <span className="text-4xl">🎓</span>
          </div>
          
          <h1 className="text-2xl font-bold text-text mb-4 text-center">{t('tutorial.title')}</h1>
          <p className="text-lg text-gray-600 mb-6 text-center">{t('tutorial.subtitle')}</p>
          <p className="text-gray-600 text-center leading-relaxed max-w-sm">{t('tutorial.description')}</p>
        </div>
        
        <div className="p-6 space-y-3">
          <button
            onClick={handleStartTutorial}
            className="w-full btn-primary py-4 text-lg"
          >
            {t('tutorial.startTutorial')}
          </button>
          
          <button
            onClick={handleSkip}
            className="w-full text-gray-500 py-3"
          >
            {t('tutorial.skipTutorial')}
          </button>
        </div>
      </div>
    )
  }

  // Intro Slides
  const slide = slides[currentStep - 1]
  const isLastSlide = currentStep === slides.length

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className={`w-24 h-24 ${slide.color} rounded-full flex items-center justify-center mb-8`}>
          <span className="text-4xl">{slide.icon}</span>
        </div>
        
        <h1 className="text-2xl font-bold text-text mb-4 text-center">{t(slide.titleKey)}</h1>
        <p className="text-lg text-gray-600 mb-6 text-center">{t(slide.subtitleKey)}</p>
        <p className="text-gray-600 text-center leading-relaxed max-w-sm">{t(slide.descriptionKey)}</p>
        
        {/* Progress indicators */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep - 1 ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="p-6 space-y-3">
        <button
          onClick={handleNext}
          className="w-full btn-primary py-4 text-lg"
        >
          {isLastSlide ? t('next') : t('next')}
        </button>
        
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            className="text-gray-500 py-2 px-4"
          >
            {t('previous')}
          </button>
          <button
            onClick={handleSkip}
            className="text-gray-500 py-2 px-4"
          >
            {t('skip')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow 