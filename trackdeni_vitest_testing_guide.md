# 🧪 TrackDeni Vitest Testing Guide  
**File:** `trackdeni_vitest_testing_guide.md`  
**Purpose:**  
This document guides Cursor (and any developer) on how to set up and implement **Vitest-based automated testing** for the TrackDeni project as part of the Software Testing class. It covers setup, folder structure, test types, example patterns, and required test coverage.

---

# 1. Overview

TrackDeni uses **React + Vite + Zustand + Firebase**.  
This guide describes how to add **automated tests** using:

- **Vitest** – test runner  
- **React Testing Library** – component testing  
- **JSDOM** – browser-like environment  
- **Mocks** – for integration tests involving Firebase  

This ensures the project meets academic requirements for automated testing.

---

# 2. Test Principles (Cursor Must Follow)

1. **Do not rewrite existing TrackDeni code** unless absolutely necessary for testability.  
2. All tests must follow the existing project architecture:
   - `src/components`  
   - `src/pages`  
   - `src/store/useDebtStore.js`  
   - `src/firebase`  
   - `src/utils`  
3. Use **small, focused tests**, not large monolithic ones.  
4. Respect TrackDeni’s **design system**, **architecture guide**, and **file structure**.  
5. Use **mocking** for Firebase-related integration tests—do NOT hit real Firestore.

---

# 3. Setting Up Vitest

## 3.1 Install Dev Dependencies

Run:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

## 3.2 Update `vite.config.js`

Add or extend:

```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/tests/setupTests.js',
},
```

## 3.3 Create Test Setup File

Create:

```
src/tests/setupTests.js
```

Contents:

```js
import '@testing-library/jest-dom'
```

## 3.4 Add Test Script to `package.json`

```json
"scripts": {
  "test": "vitest"
}
```

Run tests with:

```bash
npm test
```

---

# 4. Test Folder Structure

Create a dedicated testing structure:

```
src/
  tests/
    setupTests.js
    unit/
    component/
    integration/
```

Rules:

- **Unit tests** → `src/tests/unit`
- **Component tests** → `src/tests/component`
- **Integration tests** → `src/tests/integration`
- File suffix: `.test.js` or `.test.jsx`

---

# 5. Types of Tests We Need

We need **three** categories of tests for the Software Testing class.

---

## 5.1 Unit Tests (Highest Priority)

Focus: **Business logic + Utilities**

Targets:

- `src/store/useDebtStore.js`
- Utility functions in `src/utils`

Required behaviours to cover:

- Adding customers (≤ 5 for free tier)
- Blocking 6th customer & showing upgrade prompt
- Adding debts
- Payment logic:
  - partial payment
  - full payment
  - overpayment (no negative balance)
- Summary totals (`getTotalOwed`, `getTotalPaid`)

---

## 5.2 Component Tests (Medium Priority)

Use **React Testing Library**.

Targets:

- `CustomerCard.jsx`
- `DebtForm.jsx`
- `UpgradePrompt.jsx`
- `LoginModal.jsx` or `SignupModal.jsx`

Behaviours to verify:

- Correct rendering of props (names, amounts, labels)
- Buttons trigger callbacks
- Form validation
- Modal layouts appear correctly

---

## 5.3 Integration Tests (Strong Marks for Class)

Simulate multiple modules working together.

Examples:

### **Integration Test A — Free Tier Limit on Home**

Flow:

1. Seed Zustand store with 5 customers.  
2. Render `Home.jsx`.  
3. Attempt to add a customer.  
4. Expect upgrade modal.

### **Integration Test B — Payment Flow**

Flow:

1. Seed store with debt of 1000.  
2. Render `CustomerDetail`.  
3. Add partial payment (400).  
4. Assert:
   - status = partial  
   - balance = 600  

### **Integration Test C — Mock Firebase Migration**

Flow:

1. Mock Firestore (`vi.mock`)  
2. Seed localStorage  
3. Call migration function  
4. Assert that `setDoc` / batch operations executed with correct payloads

---

# 6. Required Test Files (Cursor Must Generate)

### **Unit Tests**

```
src/tests/unit/useDebtStore.freeTier.test.js
src/tests/unit/useDebtStore.payments.test.js
src/tests/unit/useDebtStore.summaries.test.js
```

### **Component Tests**

```
src/tests/component/CustomerCard.test.jsx
src/tests/component/DebtForm.test.jsx
src/tests/component/UpgradePrompt.test.jsx
```

### **Integration Tests**

```
src/tests/integration/Home.freeTier.integration.test.jsx
src/tests/integration/CustomerDetail.payments.integration.test.jsx
src/tests/integration/dataSync.migration.integration.test.js
```

---

# 7. Example Test Templates

---

## 7.1 Example Unit Test (Zustand Store)

```js
import { describe, it, expect, beforeEach } from 'vitest'
import useDebtStore from '../../store/useDebtStore'

const resetStore = () => {
  useDebtStore.setState({
    customers: [],
    userTier: 'free',
    showUpgradePrompt: false,
  })
}

describe('useDebtStore - free tier logic', () => {
  beforeEach(() => resetStore())

  it('allows up to 5 customers for free tier', () => {
    const { addCustomer } = useDebtStore.getState()

    for (let i = 0; i < 5; i++) {
      addCustomer({ name: `Customer ${i+1}`, phone: '' })
    }

    expect(useDebtStore.getState().customers).toHaveLength(5)
  })

  it('blocks adding a 6th customer on free tier', () => {
    const store = useDebtStore.getState()

    for (let i = 0; i < 5; i++) {
      store.addCustomer({ name: `Customer ${i+1}`, phone: '' })
    }

    store.addCustomer({ name: 'Customer 6', phone: '' })

    const { customers, showUpgradePrompt } = useDebtStore.getState()
    expect(customers).toHaveLength(5)
    expect(showUpgradePrompt).toBe(true)
  })
})
```

---

## 7.2 Example Component Test (CustomerCard)

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerCard from '../../components/CustomerCard'

describe('CustomerCard', () => {
  it('renders customer name and total owed', () => {
    const customer = {
      id: 'c1',
      name: 'Mama Mboga',
      totalOwed: 500,
      status: 'unpaid',
    }

    render(<CustomerCard customer={customer} onClick={() => {}} />)

    expect(screen.getByText('Mama Mboga')).toBeInTheDocument()
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    const customer = {
      id: 'c1',
      name: 'Mama Mboga',
      totalOwed: 500,
      status: 'unpaid',
    }

    render(<CustomerCard customer={customer} onClick={handleClick} />)

    await user.click(screen.getByTestId('customer-card'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

---

# 8. Cursor Instructions

When Cursor is asked to create tests:

1. **Check setup** (Vitest config, folder structure).  
2. Create tests ONLY under:
   - `src/tests/unit`
   - `src/tests/component`
   - `src/tests/integration`
3. Never modify real app code unless:
   - Adding `data-testid`
   - Exporting a pure helper  
4. Keep tests small and descriptive.  
5. Use mocks for Firebase modules.  
6. Follow naming conventions exactly.

---

# 9. Running Tests for Class Demo

To show automated testing live:

```bash
npm test
```

Demo flow:

1. Run unit tests → store logic  
2. Run component tests → UI  
3. Run integration tests → multi-module flows  
4. Explain how automated tests support:
   - Test Plan  
   - Quality Plan  
   - Requirements coverage  

---

# 10. Conclusion

This Vitest testing guide ensures TrackDeni has:

- Unit tests  
- Component tests  
- Integration tests  
- Proper folder structure  
- Clean setup with Vite + React  
- Coverage of business logic, UI, and store interactions  

This meets academic expectations for a Software Testing project.
