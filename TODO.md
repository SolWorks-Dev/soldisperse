# SolDisperse Redesign - Action Plan

## Overview
Redesign SolDisperse with a consumer-friendly wizard flow, fixed header, and animated steps.

---

## Phase 1: Foundation (Token Loading Refactor)

- [x] **1.1** Create `lib/jupiter.ts` - lightweight token list fetcher from Jupiter API
- [x] **1.2** Create `hooks/useTokens.ts` - fetch user balances from Helius + merge with Jupiter metadata
- [x] **1.3** Create `hooks/useSettings.ts` - localStorage persistence for RPC, Helius key, preferences
- [x] **1.4** Remove old S3 token list loading code from `page.tsx`

---

## Phase 2: New Theme

- [x] **2.1** Update `globals.css` with new refined dark color palette
  - Deep charcoal background (#0A0A0B)
  - Warm amber accent (#F5A524)
  - Monochrome palette
- [x] **2.2** Add custom CSS animations for step transitions
  - `ease-out-quart` for transforms
  - Respect `prefers-reduced-motion`
- [x] **2.3** Install and configure `framer-motion` for orchestrated animations
- [x] **2.4** Update `tailwind.config.js` with new animation keyframes

---

## Phase 3: Wizard Components

- [x] **3.1** Create `app/components/wizard/WizardProvider.tsx`
  - Manage current step state
  - Validation state per step
  - Shared data between steps
- [x] **3.2** Create `app/components/wizard/WizardLayout.tsx`
  - Fixed header with logo, step indicator, wallet, settings
  - Animated content area for steps
  - Navigation buttons (Back/Continue)
- [x] **3.3** Create `app/components/wizard/StepIndicator.tsx`
  - Horizontal progress dots
  - Animated transitions between states
- [x] **3.4** Create `app/components/wizard/StepSetup.tsx`
  - First-time RPC endpoint entry
  - Helius API key entry
  - Skip if already configured (localStorage)
- [x] **3.5** Create `app/components/wizard/StepToken.tsx`
  - Token selection grid
  - Search/filter
  - Empty state for no tokens
- [x] **3.6** Create `app/components/wizard/StepRecipients.tsx`
  - Toggle between bulk paste and manual entry
  - Real-time address validation
  - Amount input (fixed or variable)
- [x] **3.7** Create `app/components/wizard/StepReview.tsx`
  - Summary of token, amount, recipients
  - Edit buttons to go back to specific steps
  - Final send confirmation
- [x] **3.8** Create `app/components/wizard/StepProgress.tsx`
  - Full-screen transaction progress
  - Live status updates per recipient
  - Success/error states with retry

---

## Phase 4: Token Selection UI

- [x] **4.1** Create `app/components/token/TokenCard.tsx`
  - Token icon (from Jupiter)
  - Token name and symbol
  - Balance display
  - Selection state
- [x] **4.2** Create `app/components/token/TokenGrid.tsx`
  - Responsive grid layout
  - Search input
  - Loading skeleton
  - Empty state

---

## Phase 5: Recipients Input

- [x] **5.1** Create `app/components/recipients/BulkInput.tsx`
  - Textarea for pasting addresses
  - Support both formats: `address` and `address,amount`
  - Validation feedback
  - Parsed count display
- [x] **5.2** Create `app/components/recipients/ManualInput.tsx`
  - Row-based entry
  - Add/remove row buttons
  - Per-row validation
- [x] **5.3** Create `app/components/recipients/RecipientRow.tsx`
  - Address input with validation
  - Amount input
  - Remove button
  - Status indicator

---

## Phase 6: Review & Progress

- [x] **6.1** Implement `StepReview.tsx` fully
  - Token summary card
  - Recipients list (scrollable)
  - Total amount calculation
  - Edit shortcuts
- [x] **6.2** Implement `StepProgress.tsx` fully
  - Transaction batching display
  - Per-recipient status badges
  - Progress bar
  - Success celebration animation
  - Error handling with retry

---

## Phase 7: Advanced Settings

- [x] **7.1** Create `app/components/common/SettingsSheet.tsx`
  - Slide-out drawer (Sheet component)
  - All advanced options:
    - RPC endpoint
    - Helius API key
    - Commitment level
    - Priority fee rate
    - Connection timeout
    - Raw input mode
    - Variable amounts toggle
    - Delay between batches
  - Save to localStorage

---

## Phase 8: Empty States

- [x] **8.1** Create `app/components/common/EmptyState.tsx`
  - Reusable component with icon, title, description, action
- [x] **8.2** Implement empty states:
  - No wallet connected
  - First-time setup required
  - No tokens found
  - No recipients added
  - No transaction history

---

## Phase 9: Polish & Cleanup

- [x] **9.1** Refactor `app/page.tsx` to use new wizard components
- [x] **9.2** Update `app/layout.tsx` if needed
- [x] **9.3** Update `components/site-header.tsx` to match new design
- [x] **9.4** Remove unused old components
- [x] **9.5** Test full flow end-to-end
- [x] **9.6** Fix any linter errors
- [x] **9.7** Ensure all animations respect `prefers-reduced-motion`

---

## Design Specifications

### Color Palette
```css
--background: #0A0A0B
--foreground: #FAFAFA
--muted: #27272A
--muted-foreground: #71717A
--accent: #F5A524 (warm amber)
--border: rgba(255, 255, 255, 0.08)
--card: #18181B
```

### Animation Easings
```css
--ease-out-quart: cubic-bezier(.165, .84, .44, 1)
--ease-out-quint: cubic-bezier(.23, 1, .32, 1)
```

### Animation Durations
- Step transitions: 300ms
- Hover states: 200ms
- Success celebration: 400ms

---

## Dependencies to Add
- [x] `framer-motion` - for orchestrated animations

---

## Notes
- Desktop-only focus
- Helius API key stored in localStorage after first entry
- Jupiter Token List API for lightweight token metadata
- All advanced settings hidden in drawer for power users

