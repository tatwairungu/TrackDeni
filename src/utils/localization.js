// Localization system for TrackDeni (English & Swahili)
export const translations = {
  english: {
    // App name and branding
    appName: 'TrackDeni',
    tagline: 'Track Your Business Debts',
    
    // Language selection
    chooseLanguage: 'Choose your language',
    
    // Onboarding slides
    onboarding: {
      slide1: {
        title: 'Track Your Customers',
        subtitle: 'Keep all your customer debts organized in one place',
        description: 'Add customers, record what they owe, and never lose track of your business again.'
      },
      slide2: {
        title: 'Smart Payment System',
        subtitle: 'Automatic debt clearing and overpayment handling',
        description: 'When customers pay more than they owe, we automatically clear other debts and create store credit.'
      },
      slide3: {
        title: 'Send Reminders',
        subtitle: 'SMS reminders to help customers remember payments',
        description: 'Send payment reminders directly from the app. Keep your business running smoothly.'
      }
    },
    
    // Tutorial
    tutorial: {
      title: 'Quick Tutorial',
      subtitle: 'Let\'s add your first customer and debt',
      description: 'We\'ll walk you through adding a customer, recording a debt, and marking it as paid.',
      startTutorial: 'Start Tutorial',
      skipTutorial: 'Skip Tutorial',
      step1: {
        title: 'Add Your First Customer',
        description: 'Tap the + button in the top right to add a new customer and their debt.'
      },
      step2: {
        title: 'Fill Customer Details',
        description: 'Enter customer name, phone number, debt amount, and what they borrowed.'
      },
      step3: {
        title: 'Record Payments',
        description: 'When customers pay, tap "Record Payment" to track what they\'ve paid.'
      },
      step4: {
        title: 'You\'re All Set!',
        description: 'You now know how to track debts and payments. Start managing your business!'
      },
      interactive: {
        step1: {
          title: 'Click the + Button',
          description: 'Tap the green + button in the top right corner to add your first customer and debt.'
        },
        step2: {
          title: 'Fill Customer Details',
          description: 'Enter the customer\'s name, phone number, debt amount, and what they borrowed. Then click Save.'
        },
        step3: {
          title: 'Record a Payment',
          description: 'Now click the "Pay" button on the customer card to record a payment.'
        },
        step4: {
          title: 'Payment Options',
          description: 'You can choose "Partial Payment" to pay part of the debt, or "Pay in Full" to clear everything. Then click "Record Payment".'
        },
        step5: {
          title: 'Congratulations! 🎉',
          description: 'You\'ve completed the tutorial! You now know how to track debts and payments. Click below to clear this test data and start using the app to grow your business.'
        }
      },
      complete: 'Clear Test Data & Start Fresh'
    },
    
    // Navigation
    next: 'Next',
    previous: 'Previous',
    skip: 'Skip',
    getStarted: 'Get Started',
    skipForNow: 'Skip for now',
    
    // Common actions
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
  },
  
  swahili: {
    // App name and branding
    appName: 'TrackDeni',
    tagline: 'Fuatilia Madeni ya Biashara Yako',
    
    // Language selection
    chooseLanguage: 'Chagua lugha yako',
    
    // Onboarding slides
    onboarding: {
      slide1: {
        title: 'Fuatilia Wateja Wako',
        subtitle: 'Weka madeni yote ya wateja wako mahali pamoja',
        description: 'Ongeza wateja, rekodi kile wanachokudai, na usisahau biashara yako tena.'
      },
      slide2: {
        title: 'Mfumo wa Malipo Mzuri',
        subtitle: 'Kufuta madeni kiotomatiki na kushughulikia malipo ya ziada',
        description: 'Mteja akilipa zaidi ya anachokudai, tutafuta madeni mengine na kutengeneza mkopo wa duka.'
      },
      slide3: {
        title: 'Tuma Vikumbusho',
        subtitle: 'Vikumbusho vya SMS kuwakumbusha wateja malipo',
        description: 'Tuma vikumbusho vya malipo moja kwa moja kutoka app. Weka biashara yako ikiendelea vizuri.'
      }
    },
    
    // Tutorial
    tutorial: {
      title: 'Mafunzo ya Haraka',
      subtitle: 'Hebu tuongeze mteja wako wa kwanza na deni',
      description: 'Tutakuongoza kuongeza mteja, kurekodi deni, na kuliandika limelipwa.',
      startTutorial: 'Anza Mafunzo',
      skipTutorial: 'Ruka Mafunzo',
      step1: {
        title: 'Ongeza Mteja Wako wa Kwanza',
        description: 'Bonyeza kitufe cha + juu kulia kuongeza mteja mpya na deni lake.'
      },
      step2: {
        title: 'Jaza Maelezo ya Mteja',
        description: 'Ingiza jina la mteja, nambari ya simu, kiasi cha deni, na alichokopa.'
      },
      step3: {
        title: 'Rekodi Malipo',
        description: 'Mteja akilipa, bonyeza "Rekodi Malipo" kufuatilia alicholipa.'
      },
      step4: {
        title: 'Umekwisha Tayari!',
        description: 'Sasa unajua jinsi ya kufuatilia madeni na malipo. Anza kusimamia biashara yako!'
      },
      interactive: {
        step1: {
          title: 'Bonyeza Kitufe cha +',
          description: 'Bonyeza kitufe cha kijani + upande wa juu kulia kuongeza mteja wako wa kwanza na deni.'
        },
        step2: {
          title: 'Jaza Maelezo ya Mteja',
          description: 'Ingiza jina la mteja, nambari ya simu, kiasi cha deni, na alichokopa. Kisha bonyeza Hifadhi.'
        },
        step3: {
          title: 'Rekodi Malipo',
          description: 'Sasa bonyeza kitufe cha "Lipa" kwenye kadi ya mteja kurekodi malipo.'
        },
        step4: {
          title: 'Chaguo za Malipo',
          description: 'Unaweza kuchagua "Malipo ya Sehemu" kulipa sehemu ya deni, au "Lipa Kamili" kufuta yote. Kisha bonyeza "Rekodi Malipo".'
        },
        step5: {
          title: 'Hongera! 🎉',
          description: 'Umekamilisha mafunzo! Sasa unajua jinsi ya kufuatilia madeni na malipo. Bonyeza hapa chini kufuta data hii ya majaribio na kuanza kutumia app kukua biashara yako.'
        }
      },
      complete: 'Futa Data ya Majaribio & Anza Upya'
    },
    
    // Navigation
    next: 'Ifuatayo',
    previous: 'Iliyotangulia',
    skip: 'Ruka',
    getStarted: 'Anza',
    skipForNow: 'Ruka kwa sasa',
    
    // Common actions
    add: 'Ongeza',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    delete: 'Futa',
    edit: 'Hariri',
    loading: 'Inapakia...',
  }
}

// Get current language from localStorage
export const getCurrentLanguage = () => {
  return localStorage.getItem('selectedLanguage') || 'english'
}

// Get translation by key
export const t = (key) => {
  const language = getCurrentLanguage()
  const keys = key.split('.')
  let translation = translations[language]
  
  for (const k of keys) {
    translation = translation?.[k]
  }
  
  return translation || key
}

// Set language and persist to localStorage
export const setLanguage = (language) => {
  localStorage.setItem('selectedLanguage', language)
  // Trigger a custom event to notify components about language change
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }))
} 