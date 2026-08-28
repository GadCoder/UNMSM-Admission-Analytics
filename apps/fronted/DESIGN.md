# Frontend Design System — Admission Explorer

> Visual source of truth for `apps/fronted`. The interface uses the Stitch reference as design direction, not as a component or layout template.

## Direction

**Premium academic analytics:** a calm, legible experience focused on comparing admission processes. The UI must prioritize scanability and context over decoration.

## Tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--color-background` | `#faf8f7` | Warm application background |
| `--color-surface` | `#ffffff` | Cards, header, and elevated surfaces |
| `--color-text` | `#2d2223` | Primary text and figures |
| `--color-muted` | `#6e5e5f` | Metadata, descriptions, and labels |
| `--color-border` | `#e8dfe0` | Dividers and subtle borders |
| `--color-primary` | `#8f5658` | Primary action, active state, and accent |
| `--color-primary-dark` | `#6f4043` | Hover state and brand contrast |
| `--color-primary-soft` | `#f4eded` | Supporting and comparison backgrounds |
| `--color-primary-pale` | `#eadcdd` | Subtle states and ordinal numbers |
| `--color-success` | `#2e8b57` | Positive change and admission |
| `--color-warning` | `#c58a2b` | Moderate alerts and waitlist states |
| `--color-danger` | `#c54b4b` | Errors, rejection, or negative change |

Do not introduce arbitrary colors for decoration. Charts should primarily use the primary color and its soft tones, reserving semantic colors for actual meaning.

### Typography

- Family: `Lexend`, with a system sans-serif fallback.
- Headings: weights 700–800, negative tracking, and a restrained scale.
- Body copy: 14–16px when intended for reading.
- Data and labels: 10–13px, always with sufficient contrast.
- Context labels: uppercase, weight 700–800, and tracking between `.08em` and `.14em`.

### Spacing and shape

- Base scale of 4px/8px (`--space-*`).
- Cards: 16px radius (`--radius-lg`) or 20px for primary containers.
- Controls: 12px radius (`--radius-md`).
- Elevation: soft, restrained shadows; never harsh shadows.
- Use 1px borders instead of heavy outlines.

## Shell and navigation

Top navigation is the current UX choice:

- Expose only destinations that exist and have real behavior.
- Keep `Resumen` and `Resultados` visible.
- Do not add a sidebar for future modules or inactive links.
- Re-evaluate a sidebar only when there are enough functional areas to justify it.
- Keep the header compact and stable so it does not compete with the data.

## Dashboard

Recommended order:

1. Page context and active process.
2. Primary filters in one flexible row.
3. At-a-glance KPIs.
4. Visual comparisons.
5. Rankings or breakdowns.
6. Detailed table for exploration.

Filters should feel like product controls — short label plus value — rather than large administrative forms. Multi-select controls must remain accessible and must not rely on color alone.

## Components

### KPI

Structure: muted label, large value, and a semantic change indicator when a real comparable value exists. Do not invent trends to fill space.

### Charts

- One purpose per chart.
- Minimal gridlines.
- Exact values accessible through text or a summary.
- Do not rely only on colored bars to communicate information.
- Keep legends and axes light, but sufficient for interpretation.

### Tables

- Muted uppercase header.
- Comfortable rows and thin dividers.
- Subtle hover state.
- Horizontal scrolling on mobile.
- Use semantic headers and an accessible caption.

## UX guardrails

- Do not create phantom navigation.
- Do not duplicate the same data without a clear purpose.
- Do not use cards as a substitute for hierarchy.
- Do not add fictional metrics, testimonials, or ornamental content.
- Loading, error, and empty states must preserve the same visual hierarchy.
- Maintain appropriate touch targets and visible focus states.
- Verify desktop, tablet, and mobile layouts before closing an iteration.

## Implementation

Tokens live in `apps/fronted/src/shared/styles/tokens.css`. Global styles are in `apps/fronted/src/shared/styles/globals.css`; shell styles are in `apps/fronted/src/app/App.module.css`; dashboard-specific styles are in `apps/fronted/src/features/analytics/pages/DashboardPage.module.css`.
