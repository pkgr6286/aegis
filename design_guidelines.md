# Aegis Platform - Design Guidelines

## Project Context
**Note:** This is currently a backend-only implementation with no UI. These guidelines are provided for future frontend development of this multi-tenant SaaS platform serving pharmaceutical companies and patient assistance programs.

## Design Approach: Enterprise SaaS System

**Selected Approach:** Design System-Based (Healthcare Enterprise Focus)  
**Primary Reference:** Linear + Stripe + Healthcare.gov aesthetic  
**Rationale:** Enterprise healthcare SaaS requires trust, clarity, and HIPAA-compliant professionalism over creative flourishes.

---

## Core Design Principles

1. **Clinical Clarity:** Information hierarchy optimized for healthcare compliance officers and program administrators
2. **Trust-First:** Conservative, professional aesthetic reflecting pharmaceutical industry standards
3. **Multi-Tenant Awareness:** Clear visual indicators of tenant context without overwhelming users
4. **Accessibility Compliance:** WCAG 2.1 AA minimum for healthcare regulatory requirements

---

## Color Palette

### Light Mode
- **Primary Brand:** 210 85% 45% (Professional Blue - trust, medical)
- **Secondary Accent:** 210 75% 35% (Darker Blue - actions)
- **Success States:** 142 71% 45% (Medical Green)
- **Warning/Alert:** 38 92% 50% (Attention Orange)
- **Error States:** 0 84% 60% (Clear Red)
- **Neutral Base:** 220 15% 97% (Cool Gray backgrounds)
- **Text Primary:** 220 20% 20% (High contrast)
- **Text Secondary:** 220 10% 45%

### Dark Mode
- **Primary Brand:** 210 75% 55%
- **Background:** 220 15% 12%
- **Surface:** 220 12% 18%
- **Text Primary:** 220 15% 95%

---

## Typography

**Primary Font:** Inter (via Google Fonts CDN)  
**Monospace Font:** JetBrains Mono (for data/IDs)

### Hierarchy
- **H1:** 2.25rem (36px), font-semibold - Page titles
- **H2:** 1.875rem (30px), font-semibold - Section headers
- **H3:** 1.5rem (24px), font-medium - Card titles
- **Body Large:** 1.125rem (18px), font-normal - Primary content
- **Body:** 1rem (16px), font-normal - Standard text
- **Small:** 0.875rem (14px), font-normal - Metadata, captions
- **Micro:** 0.75rem (12px), font-medium - Labels, tags

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16  
**Container Max-Width:** max-w-7xl  
**Grid System:** 12-column responsive grid

### Dashboard Layout
- **Sidebar:** Fixed 16rem width (collapsed: 4rem)
- **Main Content:** Fluid with max-w-7xl container
- **Top Navigation:** 4rem height, sticky
- **Content Padding:** p-6 on mobile, p-8 on desktop

---

## Component Library

### Navigation
- **Tenant Switcher:** Prominent dropdown in top-left (logo + tenant name)
- **Primary Nav:** Vertical sidebar with icon + label pattern
- **Breadcrumbs:** Always visible for deep navigation hierarchies
- **User Menu:** Top-right avatar dropdown with role badge

### Data Display
- **Tables:** Stripe-style with alternating row backgrounds, sticky headers
- **Cards:** Subtle shadow (shadow-sm), rounded-lg, border
- **Status Badges:** Pill-shaped with color-coded backgrounds (not just borders)
- **Metrics Panels:** Large numerals with trend indicators and sparklines

### Forms
- **Input Fields:** Consistent height (h-10), clear focus states with ring-2
- **Validation:** Inline error messages below fields, success checkmarks
- **Multi-Step Forms:** Progress indicator with completed/current/upcoming states
- **Tenant Context:** Always visible indicator when creating tenant-scoped data

### Data Entry
- **Search:** Cmd+K global search with keyboard shortcuts
- **Filters:** Collapsible filter panel, applied filters shown as removable chips
- **Bulk Actions:** Checkbox selection with action bar appearing at top

### Overlays
- **Modals:** Centered, max-w-2xl, with backdrop blur
- **Slide-overs:** Right-aligned for detail views (w-96 to w-1/2)
- **Toasts:** Top-right stacking notifications with auto-dismiss
- **Confirmation Dialogs:** Destructive actions require explicit confirmation

---

## Animations

**Philosophy:** Minimal, functional motion only  
**Duration:** 150-200ms for micro-interactions  
**Easing:** ease-in-out for natural feel

### Use Cases
- Dropdown menus: slide-in with fade
- Toast notifications: slide-in from top-right
- Loading states: subtle pulse on skeletons
- **Avoid:** Page transitions, decorative animations, parallax

---

## Enterprise-Specific Patterns

### Audit Trail Display
- Timeline view with user avatars, timestamps, and action descriptions
- Expandable change diffs for data modifications

### Tenant Isolation Visual Cues
- Subtle tenant color accent in header (configurable per tenant)
- Tenant logo watermark in background of main content area (very low opacity)

### Role-Based UI
- Disabled states for actions user lacks permission for (with tooltip explaining why)
- Progressive disclosure: advanced features hidden behind "Advanced" toggles for admin roles

### Compliance Features
- Timestamp displays always in user's timezone with UTC in tooltip
- Permanent record indicators (locked icons) for audit-required data
- Export buttons for compliance reporting with format options (CSV, PDF)

---

## Icon System

**Library:** Heroicons (outline for navigation, solid for actions)  
**Size:** w-5 h-5 standard, w-4 h-4 for inline text icons

---

## Accessibility

- All form inputs have associated labels (never placeholder-only)
- Color is never the only indicator of state
- Keyboard navigation fully supported with visible focus indicators
- Skip navigation links for screen readers
- ARIA labels on all icon-only buttons