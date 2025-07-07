# 🎨 TrackDeni Design System

A lightweight and culturally grounded design system for building a fast, mobile-first, and user-friendly debt tracking app for informal vendors and small businesses in Africa.

---

## 🌈 Brand Colors — Trust + Hustle Palette

| Color Role     | Name           | Hex Code   | Description                            |
|----------------|----------------|------------|----------------------------------------|
| Primary        | Pesa Green     | `#27AE60`  | Represents money, growth, and trust    |
| Accent         | Hustle Orange  | `#F39C12`  | Represents energy, reminders, activity |
| Background     | Light Gray     | `#F9F9F9`  | Clean and minimal base background      |
| Text/Contrast  | Rich Black     | `#222222`  | High contrast for clear readability    |
| Success Badge  | Confirm Green  | `#2ECC71`  | Payment received / positive feedback   |
| Danger Badge   | Alert Red      | `#E74C3C`  | Late debt / error indicators           |

### 🧩 Tailwind CSS Mapping

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#27AE60",
        accent: "#F39C12",
        bg: "#F9F9F9",
        text: "#222222",
        success: "#2ECC71",
        danger: "#E74C3C",
      }
    }
  }
}
```

---

## 🔤 Typography

### ✅ Primary Font: Inter

A modern, UI-optimized sans-serif font with excellent readability at small sizes.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
```

### Tailwind Setup

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### Usage Guidelines

| Use Case        | Font Weight | Notes                            |
|-----------------|-------------|----------------------------------|
| Headings (H1-H3)| 600–700     | Bold for emphasis                |
| Body Text       | 400–500     | Normal or slightly medium        |
| Badges/Labels   | 500–600     | Clear and punchy                 |
| Button Text     | 600         | Enough to stand out              |
| Footnotes       | 300–400     | Subtle and clean                 |

---

## 📐 Spacing & Sizing (Tailwind Recommendations)

| Spacing Unit   | Tailwind Class | Usage Example                     |
|----------------|----------------|-----------------------------------|
| 4px            | `p-1`, `m-1`   | Tiny labels, icons                |
| 8px            | `p-2`, `m-2`   | Tight padding                     |
| 16px           | `p-4`, `m-4`   | Default padding for containers    |
| 24px           | `p-6`, `m-6`   | Section spacing, cards            |
| 32px           | `p-8`, `m-8`   | Headline + body separation        |

### Responsive Text Sizes

| Size    | Tailwind Class | Example Usage          |
|---------|----------------|------------------------|
| Small   | `text-sm`      | App body text          |
| Base    | `text-base`    | Default on desktop     |
| Medium  | `text-md`      | Buttons, labels        |
| Large   | `text-lg`      | Card titles            |
| XL+     | `text-xl`, `text-2xl` | Page headers, stats     |

---

## 🧠 Design Philosophy

- 🧩 Modular and mobile-first
- 🟢 Trust-building visuals (green, bold, clear)
- 🛠️ No bloated UI kits — everything tailored to purpose
- ⚡ Fast, efficient, and readable on low-end phones

---

**Use this system to build with consistency, clarity, and confidence.**
