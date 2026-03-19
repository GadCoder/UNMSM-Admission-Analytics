# System Design: Admission Explorer

This document outlines the design system and architectural principles used to create the Admission Explorer platform. The goal was to build a "premium academic analytics" experience that balances data density with a calm, professional aesthetic.

---

## 1. Visual Language & Foundation

### Color Palette

The palette is built around a warm, scholarly primary hue with a range of supporting neutrals to ensure depth and focus.

- **Primary Brand:** `#8f5658` (Used for key CTAs, active states, and primary accents)
- **Primary Dark/Light:** `#6f4043` / `#b97b7d`
- **Background:** `#faf8f7` (A warm off-white to reduce eye strain compared to pure white)
- **Surface/Cards:** `#ffffff` (Pure white for elevated elements)
- **Text Hierarchy:**
  - **Primary:** `#2d2223` (High contrast for readability)
  - **Secondary:** `#6e5e5f` (For metadata and captions)
- **Semantic Colors:**
  - **Success:** `#2e8b57` (Admitted status, positive trends)
  - **Warning:** `#c58a2b` (Waitlist status)
  - **Danger:** `#c54b4b` (Rejected status, negative trends)

### Typography

- **Font Family:** Lexend (Modern, highly legible, and academic feel)
- **Hierarchy:** Large, bold titles for clear sectioning; comfortable body text (14px-16px) for data tables.

### Layout & Spacing

- **Grid:** 12-column responsive grid.
- **Spacing System:** Multiples of 4px/8px to ensure mathematical consistency.
- **Border Radius:** `12px` (Soft, modern feel for cards and buttons).
- **Shadows:** Soft, diffused shadows (`0 4px 20px rgba(0,0,0,0.05)`) to create depth without clutter.

---

## 2. Core UI Components

### Navigation Shell

- **Top Bar:** Persistent access to search, global process selection, and profile.
- **Sidebar:** Grouped logically by function (Dashboard, Explore, Compare, etc.) with tinted active states.
- **Breadcrumbs:** Persistent hierarchical context (e.g., Home / Area / Faculty).

### Metric (KPI) Cards

Standardized containers for high-level stats.

- **Structure:** Label (Muted) + Value (Large/Bold) + Trend Indicator (Badge).

### Analytics Containers

- **Charts:** Clean, minimalist line and bar charts with thin grid lines and restrained color use.
- **Tables:** Professional data grids with sticky headers, sortable columns, and comfortable row heights for readability.

### Filtering System

- **Global Filter Bar:** Standardized across pages for Process, Year, and Faculty selection.
- **Local Filters:** Inline search and view toggles within specific sections.

---

## 3. UX Principles

- **Scanability:** Strong visual hierarchy ensures users find key metrics first, with the ability to drill down into tables.
- **Breadcrumb-First Navigation:** Always providing context in the hierarchical exploration of Area → Faculty → Major.
- **Consistency:** Reusing component patterns across the Dashboard, Trends, and Detail pages to reduce cognitive load.
- **Actionable Insights:** Using "Contextual Insight" cards to interpret data for the user rather than just showing raw numbers.

---

## 4. Page Architecture

1.  **Dashboard:** Macro-level summary and entry point.
2.  **Explorer:** Hierarchical drill-down interface.
3.  **Detail Views (Faculty/Major):** Data-rich profiles for specific entities.
4.  **Comparison Engine:** Side-by-side matrix for decision-making.
5.  **Historical Trends:** Long-term time-series analysis.
6.  **Raw Results:** High-performance data table for granular research.
