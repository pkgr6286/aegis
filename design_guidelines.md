# Aegis Platform - Design System

## Design Philosophy

**Selected Approach:** Modern Minimalism with Hierarchy via Tone

The Aegis Platform design system is inspired by clean, modular, modern admin interfaces. It prioritizes information density while maintaining visual breathing space, using grayscale tonal shifts rather than hard color contrast to separate regions.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Modern Minimalism** | Clean UI with minimal borders, soft shadows, and generous spacing |
| **Hierarchy via Tone** | Use grayscale tonal shifts rather than hard color contrast to separate regions |
| **Functional Calm** | Prioritize information density while maintaining visual breathing space |
| **Consistency Everywhere** | Uniform typography, color logic, and component proportions |
| **Subtle Motion** | Microinteractions only where it helps comprehension — not decoration |

---

## Color System

### Primary Theme: Elegant Forest-Green & Neutral Gray Palette

#### Light Mode (Default)

| Token | Color | HSL | Usage |
|-------|-------|-----|-------|
| `--color-primary` | #1D463A | 158 43% 16% | Primary accent (buttons, highlights, active items) |
| `--color-primary-light` | #2B6F54 | 158 43% 38% | Hover or secondary accent |
| `--color-bg` | #F9FAFB | 210 20% 98% | App background |
| `--color-surface` | #FFFFFF | 0 0% 100% | Panels, cards, tables |
| `--color-border` | #E4E7EB | 214 15% 91% | Dividers, table outlines |
| `--color-text-main` | #1F2937 | 220 13% 17% | Headings and important text |
| `--color-text-secondary` | #6B7280 | 220 9% 46% | Secondary labels, descriptions |
| `--color-accent` | #00A884 | 166 100% 33% | Graphs, positive metrics, tags |
| `--color-error` | #EF4444 | 0 84% 60% | Error states |
| `--color-warning` | #F59E0B | 38 92% 54% | Warnings or pending items |
| `--color-success` | #10B981 | 142 76% 48% | Confirmations, success alerts |
| `--color-muted-bg` | #F3F4F6 | 220 14% 96% | Table rows, subtle backgrounds |

#### Dark Mode

- **Primary:** #2B6F54 (lighter green for contrast)
- **Background:** #1A1D21 (deep gray)
- **Surface:** #242830 (elevated gray)
- **Text:** #F9FAFB (light gray)
- **Borders:** Subtle tonal shifts from surface colors

#### Status Indicators

- **Active Study:** #10B981 (success green)
- **Pending:** #F59E0B (warning amber)
- **Completed:** #6B7280 (neutral gray)
- **Cancelled:** #EF4444 (error red)

---

## Typography System

### Font Stack

- **Primary:** 'Inter', 'Manrope', system-ui, sans-serif
- **Monospace:** 'JetBrains Mono', monospace (for IDs, timestamps, code)

### Type Scale

| Type | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| **Display / Title** | Inter / Manrope | 28-32px | 600-700 | Section titles, hero headers |
| **Heading** | Inter / Manrope | 20-24px | 600 | Module titles |
| **Subheading** | Inter / Manrope | 16-18px | 500 | Card headers, table titles |
| **Body** | Inter / Manrope | 14-16px | 400-500 | Primary content text |
| **Caption / Label** | Inter / Manrope | 12-13px | 400 | Metadata, small UI text |

### Typography Rules

- Avoid all caps
- Keep line-height loose (1.5-1.7)
- Use consistent spacing between title → subtitle → content

---

## Layout Foundation

### Overall Structure

```
┌────────────────────────────┬────────────────────────────┐
│ Sidebar                    │ Top Bar                   │
│ (Fixed navigation)          │ Search / Profile / Filter  │
│                            │                           │
│                            │ Main Panel                │
│                            │ - Cards, Tables, Charts    │
│                            │ - Forms, Modals, Lists     │
└────────────────────────────┴────────────────────────────┘
```

### Characteristics

- **Left Sidebar:** Clean background with subtle borders, compact typography
- **Top Bar:** Light background with search and user menu
- **Main Area:** White surfaces, grid layout for dashboard cards and tables
- **Cards:** Rounded corners (12px), soft shadows, structured padding (24px)

---

## Spacing & Layout Grid

| Token | Value | Description |
|-------|-------|-------------|
| `--space-xxs` | 4px | Micro gaps |
| `--space-xs` | 8px | Between label and input |
| `--space-sm` | 12px | Between form fields |
| `--space-md` | 16px | Standard internal padding |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major block gap |
| `--radius-sm` | 6px | Small buttons, tags |
| `--radius-md` | 12px | Cards, modals |
| `--radius-lg` | 16px | Hero banners or large containers |

---

## Core Components

### Sidebar Navigation
- Collapsible left nav with icons
- Active highlight bar
- Hover tooltip
- Clean background with subtle separation

### Top Bar
- Contains global search, filters, and user menu/avatar
- Light background
- Minimal visual weight

### Stat Card (Metric Card)
- Compact card with metric + label + icon
- Supports color-coded states (default, success, warning)
- 12px border radius
- Soft shadow

### Data Table
- Striped rows (optional)
- Hover highlight
- Sticky header
- Action buttons (Edit/View)
- Clean borders

### Filter Panel
- Compact dropdowns + search bar above data views
- Subtle background
- Aligned with table content

### Form Elements
- Consistent input styling
- Rounded corners (8px for inputs)
- Light borders
- Includes text, dropdown, datepicker, toggle
- Clear focus states

### Modal / Drawer
- Rounded 16px
- Dimmed backdrop
- Center or side-sliding
- Clean header with close button

### Notification / Toast
- Top-right stacked
- Subtle animation
- Light color scheme
- Auto-dismiss

### Chart Block
- Soft gray grid
- Brand-accent highlight bars or lines
- Minimal axes
- Clean data presentation

---

## Motion Guidelines

| Element | Motion Spec |
|---------|-------------|
| **Hover** | Soft scale (1.02x) or background tint |
| **Click** | Quick feedback (100-150ms) |
| **Modal open** | Fade-in + slight upward motion |
| **Dropdown** | Slide-down (ease-in-out, 120ms) |
| **Sidebar expand/collapse** | Smooth width transition |

---

## Iconography

| Property | Spec |
|----------|------|
| **Style** | Line-based (Lucide / Tabler / Phosphor) |
| **Stroke** | 1.75-2px |
| **Corners** | Rounded |
| **Size** | 20-24px sidebar, 16px inline |
| **Consistency** | Uniform padding and alignment grid |

---

## Theming

| Mode | Description |
|------|-------------|
| **Light (Default)** | Neutral background with white cards and dark text |
| **Dark Mode** | Inverted palette with deep gray surfaces and green accents |

---

## Component Mapping

| Component | Usage | Key Features |
|-----------|-------|--------------|
| **Sidebar** | Navigation with icons and active state | Forest-green accents for active items |
| **Header / Top Bar** | Search, actions, avatar | Minimal visual weight |
| **Stat Card** | Metrics display | 12px radius, soft shadows |
| **Table** | Data display with actions | Clean borders, hover states |
| **Chart** | Dashboard visualizations | Green accent colors |
| **Form** | User input | 8px input radius, clear focus rings |
| **Modal** | Overlays and dialogs | 16px radius, backdrop blur |
| **Toast** | Notifications | Subtle animations |

---

## Accessibility & Polish

- WCAG 2.1 AA contrast minimum (4.5:1 text, 3:1 UI)
- Focus visible on all interactive elements
- Semantic HTML with ARIA labels
- Skip navigation link for keyboard users
- Reduced motion respected via `prefers-reduced-motion`
- Error messages announced to screen readers
- All form fields properly labeled

---

## Key Principle

**Clean, professional design that stays out of the way.** Information hierarchy is conveyed through subtle tonal shifts rather than heavy borders or colors. Every interaction should feel smooth and intentional.

---

## Healthcare-Specific Considerations

### Multi-Tenant Awareness
- Clear visual indicators of tenant context without overwhelming users
- Tenant-specific color accents in header (configurable per tenant)

### Compliance Features
- Timestamp displays always in user's timezone with UTC in tooltip
- Permanent record indicators (locked icons) for audit-required data
- Export buttons for compliance reporting with format options (CSV, PDF)

### Audit Trail Display
- Timeline view with user avatars, timestamps, and action descriptions
- Expandable change diffs for data modifications

### Role-Based UI
- Disabled states for actions user lacks permission for (with tooltip explaining why)
- Progressive disclosure: advanced features hidden behind "Advanced" toggles for admin roles
