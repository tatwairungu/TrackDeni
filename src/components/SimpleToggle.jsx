const SimpleToggle = ({ enabled, onToggle, label, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative inline-block 
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${className}
      `}
      style={{
        width: '44px',
        height: '24px',
        minWidth: '44px',     // Override global min-width
        minHeight: '24px',    // Override global min-height
        borderRadius: '12px',
        backgroundColor: enabled ? '#27AE60' : '#d1d5db',
        transition: 'background-color 0.2s ease-in-out',
        cursor: 'pointer',
        border: 'none',
        padding: '0',
        margin: '0'
      }}
      aria-label={label}
      aria-pressed={enabled}
    >
      <span
        className="absolute block rounded-full bg-white shadow-sm"
        style={{
          width: '16px',
          height: '16px',
          left: enabled ? '24px' : '4px',
          transition: 'left 0.2s ease-in-out',
          top: '4px'
        }}
      />
    </button>
  )
}

export default SimpleToggle 