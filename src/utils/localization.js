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
    
    // Upgrade prompt
    upgrade: {
      title: 'Upgrade to Pro',
      subtitle: 'You\'ve reached the free tier limit of 5 customers',
      price: 'KES 500',
      priceUnit: '/ month',
      regularPrice: 'Regular price: KES 1,000/month',
      launchPrice: 'Special Launch Price',
      benefits: {
        unlimited: 'Unlimited Customers',
        unlimitedDesc: 'Track as many customers as you need',
        sms: 'SMS Bundles',
        smsDesc: 'Send automatic payment reminders',
        cloud: 'Cloud Sync',
        cloudDesc: 'Access your data from any device',
        reports: 'Advanced Reports',
        reportsDesc: 'Detailed analytics and insights',
        backup: 'Data Backup',
        backupDesc: 'Never lose your customer data',
        support: 'Priority Support',
        supportDesc: 'Get help when you need it'
      },
      cta: {
        upgrade: 'Upgrade Now',
        later: 'Maybe Later',
        back: 'Back'
      },
      guarantee: '30-day money-back guarantee • Cancel anytime',
      payment: {
        title: 'Choose Payment Method',
        subtitle: 'Complete your upgrade to TrackDeni Pro',
        mpesa: 'M-Pesa',
        mpesaDesc: 'Pay with your M-Pesa account',
        card: 'Card Payment',
        cardDesc: 'Pay with Visa, Mastercard, or other cards',
        bank: 'Bank Transfer',
        bankDesc: 'Direct bank transfer',
        secure: 'Secure Payment • 256-bit SSL encryption'
      }
    }
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
    
    // Upgrade prompt
    upgrade: {
      title: 'Panda daraja kwenda Pro',
      subtitle: 'Umefika kikomo cha bure cha wateja 5',
      price: 'KES 500',
      priceUnit: '/ mwezi',
      regularPrice: 'Bei ya kawaida: KES 1,000/mwezi',
      launchPrice: 'Bei Maalum ya Uzinduzi',
      benefits: {
        unlimited: 'Wateja Bila Kikomo',
        unlimitedDesc: 'Fuatilia wateja wangapi unahitaji',
        sms: 'Vishuka vya SMS',
        smsDesc: 'Tuma vikumbusho vya malipo kiotomatiki',
        cloud: 'Usawazishaji wa Wingu',
        cloudDesc: 'Pata data yako kutoka kifaa chochote',
        reports: 'Ripoti za Juu',
        reportsDesc: 'Uchanganuzi wa kina na maarifa',
        backup: 'Nakala ya Data',
        backDesc: 'Usipoteze data ya wateja wako kamwe',
        support: 'Msaada wa Kwanza',
        supportDesc: 'Pata msaada unapohitaji'
      },
      cta: {
        upgrade: 'Panda Daraja Sasa',
        later: 'Labda Baadaye',
        back: 'Rudi'
      },
      guarantee: 'Dhamana ya kurudi fedha siku 30 • Ghairi wakati wowote',
      payment: {
        title: 'Chagua Njia ya Malipo',
        subtitle: 'Kamilisha kupanda daraja kwenda TrackDeni Pro',
        mpesa: 'M-Pesa',
        mpesaDesc: 'Lipa kwa akaunti yako ya M-Pesa',
        card: 'Malipo ya Kadi',
        cardDesc: 'Lipa kwa Visa, Mastercard, au kadi zingine',
        bank: 'Uhamisho wa Benki',
        bankDesc: 'Uhamisho wa moja kwa moja wa benki',
        secure: 'Malipo Salama • Usimbaji wa SSL 256-bit'
      }
    }
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