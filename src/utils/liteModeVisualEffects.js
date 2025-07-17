/**
 * Lite Mode Visual Effects for TrackDeni
 * Provides simplified visual effects for better performance
 * Maintains design system principles while reducing complexity
 */

// Visual effect presets
const VISUAL_EFFECTS = {
  normal: {
    shadows: {
      card: 'shadow-md hover:shadow-lg',
      button: 'shadow-sm hover:shadow-md',
      modal: 'shadow-2xl',
      dropdown: 'shadow-lg',
      floating: 'shadow-xl'
    },
    gradients: {
      primary: 'bg-gradient-to-r from-primary to-primary/90',
      success: 'bg-gradient-to-r from-success to-success/90',
      accent: 'bg-gradient-to-r from-accent to-accent/90',
      pro: 'bg-gradient-to-r from-primary to-success'
    },
    borders: {
      card: 'border border-gray-200',
      input: 'border border-gray-300 focus:border-primary',
      button: 'border border-transparent'
    },
    blur: {
      backdrop: 'backdrop-blur-sm',
      overlay: 'backdrop-blur-md',
      modal: 'backdrop-blur-lg'
    }
  },
  
  lite: {
    shadows: {
      card: 'shadow-sm hover:shadow-md',
      button: 'shadow-none hover:shadow-sm',
      modal: 'shadow-lg',
      dropdown: 'shadow-md',
      floating: 'shadow-lg'
    },
    gradients: {
      primary: 'bg-primary',
      success: 'bg-success',
      accent: 'bg-accent',
      pro: 'bg-primary'
    },
    borders: {
      card: 'border border-gray-300',
      input: 'border border-gray-400 focus:border-primary',
      button: 'border border-gray-200'
    },
    blur: {
      backdrop: '',
      overlay: 'bg-black/50',
      modal: 'bg-black/60'
    }
  }
}

// Get visual effect classes based on lite mode state
export const getVisualEffectsForState = (isLiteModeEnabled) => {
  const effects = isLiteModeEnabled ? VISUAL_EFFECTS.lite : VISUAL_EFFECTS.normal
  
  return {
    shadows: effects.shadows,
    gradients: effects.gradients,
    borders: effects.borders,
    blur: effects.blur,
    
    // Utility functions
    getCardClass: (hover = true) => {
      return `${effects.borders.card} ${effects.shadows.card} ${hover ? 'transition-shadow' : ''}`
    },
    
    getButtonClass: (variant = 'primary') => {
      const base = `${effects.borders.button} ${effects.shadows.button} transition-all`
      const gradient = effects.gradients[variant] || effects.gradients.primary
      return `${base} ${gradient}`
    },
    
    getModalClass: () => {
      return `${effects.shadows.modal} ${effects.blur.modal}`
    },
    
    getOverlayClass: () => {
      return `${effects.blur.overlay}`
    }
  }
}

// Utility function to get visual effects classes for a variant
export const getVisualEffectsClass = (variant = 'card', isLiteModeEnabled) => {
  const effects = isLiteModeEnabled ? VISUAL_EFFECTS.lite : VISUAL_EFFECTS.normal
  
  switch (variant) {
    case 'card':
      return `${effects.borders.card} ${effects.shadows.card} transition-shadow`
    case 'modal':
      return `${effects.shadows.modal} ${effects.blur.modal}`
    case 'overlay':
      return `${effects.blur.overlay}`
    default:
      return ''
  }
}

// Optimized component styles
export const getOptimizedStyles = (isLiteModeEnabled) => {
  const effects = isLiteModeEnabled ? VISUAL_EFFECTS.lite : VISUAL_EFFECTS.normal
  
  return {
    // Card component optimizations
    card: {
      base: `bg-white rounded-lg p-4 ${effects.borders.card} ${effects.shadows.card}`,
      hover: isLiteModeEnabled ? 'hover:shadow-md' : 'hover:shadow-lg hover:transform hover:scale-[1.02]',
      transition: isLiteModeEnabled ? 'transition-shadow' : 'transition-all duration-300'
    },
    
    // Button component optimizations
    button: {
      primary: `${effects.gradients.primary} text-white px-4 py-2 rounded-lg font-medium ${effects.shadows.button}`,
      secondary: `bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium ${effects.shadows.button}`,
      success: `${effects.gradients.success} text-white px-4 py-2 rounded-lg font-medium ${effects.shadows.button}`,
      accent: `${effects.gradients.accent} text-white px-4 py-2 rounded-lg font-medium ${effects.shadows.button}`
    },
    
    // Modal component optimizations
    modal: {
      overlay: `fixed inset-0 z-50 flex items-center justify-center p-4 ${effects.blur.overlay}`,
      content: `relative bg-white rounded-lg p-6 w-full max-w-md ${effects.shadows.modal}`,
      backdrop: isLiteModeEnabled ? 'bg-black/50' : 'bg-black/60 backdrop-blur-sm'
    },
    
    // Input component optimizations
    input: {
      base: `w-full px-3 py-2 rounded-lg ${effects.borders.input} focus:outline-none focus:ring-2 focus:ring-primary/20`,
      error: `border-red-300 focus:border-red-500 focus:ring-red-500/20`,
      success: `border-green-300 focus:border-green-500 focus:ring-green-500/20`
    },
    
    // Badge component optimizations
    badge: {
      success: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${isLiteModeEnabled ? '' : 'shadow-sm'}`,
      warning: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ${isLiteModeEnabled ? '' : 'shadow-sm'}`,
      danger: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ${isLiteModeEnabled ? '' : 'shadow-sm'}`,
      primary: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ${isLiteModeEnabled ? '' : 'shadow-sm'}`
    }
  }
}

// CSS variables for visual effects
export const getVisualEffectsCSSVariables = (isLiteModeEnabled) => {
  const effects = isLiteModeEnabled ? VISUAL_EFFECTS.lite : VISUAL_EFFECTS.normal
  
  return {
    '--card-shadow': isLiteModeEnabled ? '0 1px 3px rgba(0, 0, 0, 0.12)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
    '--card-shadow-hover': isLiteModeEnabled ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 10px 25px rgba(0, 0, 0, 0.12)',
    '--button-shadow': isLiteModeEnabled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--modal-shadow': isLiteModeEnabled ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 25px 50px rgba(0, 0, 0, 0.25)',
    '--gradient-primary': isLiteModeEnabled ? 'var(--color-primary)' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    '--backdrop-blur': isLiteModeEnabled ? 'none' : 'blur(4px)'
  }
}

// Performance monitoring for visual effects
export const monitorVisualEffectsPerformance = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry) => {
      if (entry.name.includes('paint') || entry.name.includes('render')) {
        console.log(`🎨 Visual effect performance: ${entry.name}`, {
          duration: entry.duration,
          startTime: entry.startTime
        })
      }
    })
  })
  
  if ('observe' in observer) {
    observer.observe({ entryTypes: ['paint', 'measure'] })
  }
}

// Inject visual effects CSS
export const injectVisualEffectsCSS = (isLiteModeEnabled) => {
  if (typeof document === 'undefined') return
  
  const styleId = 'visual-effects-styles'
  const existingStyle = document.getElementById(styleId)
  
  if (existingStyle) {
    existingStyle.remove()
  }
  
  const style = document.createElement('style')
  style.id = styleId
  
  const cssVariables = getVisualEffectsCSSVariables(isLiteModeEnabled)
  const cssVarsString = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ')
  
  style.textContent = `
    :root {
      ${cssVarsString}
    }
    
    /* Optimized visual effects */
    .card {
      box-shadow: var(--card-shadow);
    }
    
    .card:hover {
      box-shadow: var(--card-shadow-hover);
    }
    
    .btn {
      box-shadow: var(--button-shadow);
    }
    
    .modal {
      box-shadow: var(--modal-shadow);
    }
    
    .modal-backdrop {
      backdrop-filter: var(--backdrop-blur);
    }
    
    /* Reduce complexity for lite mode */
    ${isLiteModeEnabled ? `
      .gradient-bg {
        background: var(--color-primary) !important;
        background-image: none !important;
      }
      
      .complex-shadow {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      }
      
      .backdrop-blur {
        backdrop-filter: none !important;
        background: rgba(0, 0, 0, 0.5) !important;
      }
    ` : ''}
  `
  
  document.head.appendChild(style)
}

// Initialize visual effects system
export const initVisualEffects = () => {
  if (typeof window === 'undefined') return
  
  // Monitor performance in development
  monitorVisualEffectsPerformance()
  
  // Listen for lite mode changes
  window.addEventListener('lite-mode-changed', (event) => {
    const isEnabled = event.detail.enabled
    injectVisualEffectsCSS(isEnabled)
  })
  
  // Initial CSS injection with default state
  const liteModeEnabled = document.body.classList.contains('lite-mode')
  injectVisualEffectsCSS(liteModeEnabled)
}

export default {
  getVisualEffectsForState,
  getVisualEffectsClass,
  getOptimizedStyles,
  initVisualEffects
} 