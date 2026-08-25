# Marketing App Design System

## 1. Atmosphere & Identity

Open Agency is a dark, practical workspace with layered navy surfaces, cyan interaction cues, and quiet depth. The signature is tonal layering with restrained cyan and mint accents rather than decorative effects.

## 2. Color

### Palette

| Role | Token | Usage |
|------|-------|-------|
| Base surface | `--surface` | Page background |
| Low surface | `--surface-container-low` | Sections and secondary shells |
| Lowest surface | `--surface-container-lowest` | Cards, dialog interiors, banner content |
| High surface | `--surface-container-high` | Elevated panels and controls |
| Primary text | `--on-surface` | Headings and primary labels |
| Secondary text | `--on-surface-variant` | Body copy and supporting labels |
| Primary accent | `--brand-primary` | Primary actions, focus, and links |
| Accent hover | `--brand-primary-light` | Hover and active emphasis |
| Success accent | `--brand-tertiary` | Positive status and confirmation |
| Outline | `--outline-variant` | Borders and separators |

Use the existing CSS variables from `@open-agency/ui/theme.css`; do not add raw colors in app components.

## 3. Typography

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Page title | `clamp(var(--font-size-4xl), 5.5vw, var(--font-size-7xl))` | 700 | Resource page titles |
| Section title | `clamp(var(--font-size-3xl), 3vw, var(--font-size-5xl))` | 600 | Major sections |
| Body | `var(--font-size-base)` | 400 | Explanatory copy |
| Body small | `var(--font-size-sm)` | 400 | Controls and supporting copy |
| Overline | `0.72rem` | 500 | Legal/category labels |

Headings use `var(--brand-font-heading)` and body copy uses `var(--brand-font-body)`. Mono is reserved for code and technical metadata.

## 4. Spacing & Layout

Spacing follows the existing 4px Tailwind base scale (`gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8`, `gap-10`, `gap-12`). Marketing shells use `max-w-[100rem]`; reading-width legal copy uses `max-w-[64rem]`. Responsive breakpoints are `sm` 640px, `md` 768px, `lg` 1024px, and `xl` 1280px.

## 5. Components

### MarketingPageFrame

- **Structure**: Full-height flex shell with header, main, and footer.
- **Variants**: Optional main class name.
- **Spacing**: Existing page rhythm and shell gutters.
- **States**: Static shell; child components own interactive states.
- **Accessibility**: Semantic landmarks.
- **Motion**: Header transitions remain local to the header.
- **Layout**: Document shell; page scroll owns vertical movement.

### CookieConsentProvider

- **Structure**: Client context around the app tree.
- **Variants**: Default undecided state, saved consent state.
- **Spacing**: No visual output.
- **States**: Hydrating, undecided, decided, preferences open.
- **Accessibility**: Exposes explicit controls for keyboard-accessible consumers.
- **Motion**: No state animation.
- **Layout**: Global state boundary.

### CookieBanner

- **Structure**: Fixed bottom surface with explanation and action cluster.
- **Variants**: Undecided only.
- **Spacing**: `gap-4` / `gap-5`, `p-5` / `sm:p-6`.
- **States**: Rest, hover, active, focus-visible.
- **Accessibility**: Uses a labelled region and real buttons; no trapping behavior.
- **Motion**: No decorative animation.
- **Layout**: Fixed global overlay above the marketing footer.

### CookiePreferences

- **Structure**: Fixed scrim plus modal dialog with category checkboxes and save action.
- **Variants**: Essential-only locked category, analytics and advertising toggles.
- **Spacing**: `gap-4` / `gap-6`, `p-6` / `sm:p-8`.
- **States**: Open, closed, checked, unchecked, focus-visible.
- **Accessibility**: `role="dialog"`, `aria-modal`, labelled controls, visible focus rings.
- **Motion**: None; respects reduced-motion by remaining static.
- **Layout**: Viewport overlay; modal content scrolls internally when needed.

### FeedbackProvider

- **Structure**: Client context around the app tree so the global trigger owns one modal opener.
- **Variants**: Closed and open feedback surface.
- **Spacing**: Existing 4px Tailwind scale; modal uses `gap-4` / `gap-6` and `p-6` / `sm:p-8`.
- **States**: Closed, open, submitting, success, and validation/API error.
- **Accessibility**: Restores focus on close, traps focus while open, closes on Escape or scrim click, and exposes dialog labels.
- **Motion**: No decorative animation; existing 200ms control transitions remain intact.
- **Layout**: Viewport overlay with internally scrolling dialog content.

### FeedbackButton

- **Structure**: Floating global trigger that consumes `FeedbackProvider`.
- **Variants**: Floating action; hidden on mobile until cookie consent is decided.
- **Spacing**: Floating trigger uses `bottom-4` / `right-4`.
- **States**: Rest, hover, active, and focus-visible.
- **Accessibility**: Real buttons with visible labels and shared focus rings; icons never carry the label alone.
- **Motion**: Existing color, shadow, and active-press transitions only.
- **Layout**: Fixed trigger avoids content reflow and remains reachable at mobile sizes after consent.

## 6. Motion & Interaction

Existing interactions use 200–300ms color and surface transitions. Consent controls use the shared button focus ring and active press state. No non-essential animation is introduced for this legal flow.

## 7. Depth & Surface

The app uses a mixed strategy: tonal surface gradients for hierarchy, subtle outline borders for containment, and cyan-tinted shadows for elevated marketing surfaces. Consent surfaces follow the same `--surface-container-*` variables and outline treatment.

## 8. Accessibility Constraints & Accepted Debt

Target WCAG 2.2 AA: body contrast at least 4.5:1, visible focus for every control, full keyboard access, semantic headings and landmarks, and no horizontal overflow at 375px. Essential consent remains enabled and third-party scripts are not rendered before a visitor grants their category. No new accessibility debt is accepted for this flow.
