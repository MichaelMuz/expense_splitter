# UI Guide

Quick reference for the Expense Splitter design system.

## Design System

**Colors** (defined in `tailwind.config.js`):
- `primary-*` - Sky blue brand color
- `success-*` - Green (owed TO you)
- `danger-*` - Red (you OWE)
- `warning-*` - Orange (pending)
- `neutral-*` - Warm gray (text, borders, backgrounds)

**Typography**:
- Inter font for body text (default)
- **Always use `font-mono` for currency/numbers** (JetBrains Mono)

## Components

All in `src/client/components/ui/`:

- **Button** - variants: `primary`, `secondary`, `danger`, `ghost`, `outline` | props: `leftIcon`, `rightIcon`, `isLoading`, `fullWidth`
- **Input** - props: `label`, `error`, `helperText`, `leftIcon`, `rightIcon`
- **Card** - variants: `default`, `bordered`, `elevated`, `interactive` | props: `hover`, `padding`, `onClick`
- **Avatar** - auto-generates color from name | sizes: `xs` to `xl`
- **Badge** - variants: `success`, `danger`, `warning`, `info`, `neutral`
- **Modal** - has escape key support, backdrop blur
- **EmptyState** - for empty data views
- **Skeleton** / **SkeletonCard** - loading states

## Icons

Use **Lucide React**: `import { Plus, Edit2, Trash2 } from 'lucide-react'`

Browse: https://lucide.dev/icons/

## Animations

Import from `src/client/utils/animations.ts`:
- `fadeInUp`, `slideUp`, `scaleIn` - entrance animations
- `hoverLift`, `hoverGlow`, `tapScale` - interactions
- `staggerChildren`, `listItem` - list animations

Use with Framer Motion:
```tsx
<motion.div variants={fadeInUp} initial="initial" animate="animate">
```

## Utilities

`src/client/utils/colors.ts`:
- `stringToColor(name)` - consistent color from string
- `getInitials(name)` - extract initials for avatars
- `stringToGradient(name)` - generate gradient

## Key Rules

- Use design system colors, not arbitrary values (`primary-500` not `#0ea5e9`)
- Always `font-mono` for currency
- Check existing components for patterns before creating new ones
