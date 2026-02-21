# Frontend Build Plan

A step-by-step guide to building the frontend from skeleton to polished app. Each phase produces visible progress. Keep `bun run dev` running and the browser open — Vite hot-reloads your changes instantly.

---

## Phase 1: Make It Work

Goal: every feature functions with bare HTML forms. No styling. Just data flowing correctly between your forms and your backend. This is where you learn React forms and how your data model works end-to-end.

### Step 1: Settlement form (warm-up)

**Why start here**: It's the simplest form — 3 fields, one mutation. Good warm-up before the big expense form.

**What to build** in `SettlementPage.tsx`:
- Two `<select>` dropdowns: "from" member, "to" member (populated from `group.members`)
- One `<input type="number">` for the dollar amount
- A submit button that calls `useCreateSettlement`

**What you'll learn**: controlled inputs, converting dollars to cents (`toCents` from `shared/utils/currency`), calling a mutation, navigating after success.

**Reference**: `CreateGroupPage.tsx` — same pattern (form + mutation + navigate on success).

**Schema to check**: `shared/schemas/settlement.ts` — `createSettlementSchema` expects `{ fromGroupMemberId, toGroupMemberId, amount }` where amount is in cents (positive integer).

**Done when**: you can record a settlement and it shows up in the database.

### Step 2: Expense form — basic version

**Why this order**: This is the core of the app but it's complex. Build it in layers.

**What to build** — create `components/expenses/ExpenseForm.tsx`:
- Text input for name
- Number input for base amount (dollars, you convert to cents)
- Checkboxes for each group member as payer (start with: check one, everyone uses EVEN split)
- Checkboxes for each group member as ower (same: EVEN split)
- Submit button

**The data shape** you need to send (from `shared/schemas/expense.ts`):
```ts
{
  name: "Dinner",
  baseAmount: 5000,        // $50.00 in cents
  taxAmount: null,
  taxType: null,
  tipAmount: null,
  tipType: null,
  payers: [
    { groupMemberId: "uuid", splitMethod: "EVEN", splitValue: null }
  ],
  owers: [
    { groupMemberId: "uuid", splitMethod: "EVEN", splitValue: null },
    { groupMemberId: "uuid", splitMethod: "EVEN", splitValue: null }
  ]
}
```

**Wire it into** `AddExpensePage.tsx` — replace the placeholder with your form. The page already has `useGroup` (for member list) and you'll add `useCreateExpense`.

**Done when**: you can create an expense with even split and it appears in the expense list.

### Step 3: Add tax and tip

**What to add** to your ExpenseForm:
- A checkbox "Include tax" — when checked, show a type toggle (% or $) and an amount input
- Same for tip
- Remember: percentage amounts are stored as basis points (10% = 1000, stored as integer)
- Fixed amounts are in cents

**The conversion math**:
- User types "10" for 10% tax → you send `taxAmount: 1000, taxType: "PERCENTAGE"`
- User types "5.00" for $5 fixed tax → you send `taxAmount: 500, taxType: "FIXED"`

**Reference**: `shared/utils/calculations.ts` — `calculateTotalExpenseAmount` shows how tax/tip are interpreted. Read this function, it's your source of truth.

**Done when**: you can create expenses with tax/tip and the total shown in the expense list is correct.

### Step 4: Add split method selection

**What to add**: For both payers and owers, let the user pick EVEN / FIXED / PERCENTAGE.
- EVEN: no value needed (`splitValue: null`)
- FIXED: dollar amount per person (in cents). Payer amounts must sum to total expense. Ower amounts must sum to base amount.
- PERCENTAGE: basis points per person (10000 = 100%). Must sum to 10000.

**Tip**: start with a simple approach — a radio group for the split method, then show number inputs next to each selected member when the method isn't EVEN.

**This is the hardest step**. Take your time. The zod schema (`shared/schemas/expense.ts`) has all the validation rules — read `expenseParticipants()` and `fixedSumsCorrectly()` to understand exactly what the backend expects.

**Done when**: you can create expenses with any split method and the backend accepts them.

### Step 5: Balances view

**What to build**: Replace the "coming soon" placeholder in `GroupDetailPage.tsx` balances tab.

**Use**: `useBalances(groupId)` — returns `{ balances, summary }`.
- `balances` is an array of `{ from, to, amount }` — who owes whom
- `summary` is an array of `{ member, balance }` — net balance per person

**Start simple**: just render the `balances` array as a list: "Alice owes Bob $25.00". Add a "Record Payment" button next to each that navigates to the settlement page with pre-filled params.

**Done when**: you can see who owes whom and click through to settle up.

### Step 6: Edit expense

**What to build**: When clicking an expense in the list, navigate to the edit page. `AddExpensePage.tsx` already handles both create and edit routes — you just need to:
- Pass `initialData` to your ExpenseForm when editing (the expense data from `useExpense`)
- Pre-populate all form fields from the existing expense

**This is where your "store only atomic inputs" design pays off** — the edit form shows exactly what the user originally entered because that's what's in the database.

**Reference**: the old `AddExpensePage.tsx` (check git history) had a nice generic `ExpenseFormView` pattern. You can reference it but write your own version.

**Done when**: you can edit any expense and the changes persist correctly.

---

## Phase 2: Add Validation

Goal: replace manual form state with react-hook-form + your existing zod schemas. Forms get per-field error messages for free. This is where you see the payoff of having shared schemas.

### Step 7: Install react-hook-form

```bash
bun add react-hook-form @hookform/resolvers
```

### Step 8: Convert a simple form first

**Pick**: `CreateGroupPage.tsx` — it has one field.

**The pattern**:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGroupSchema, type CreateGroupInput } from '@/shared/schemas/group';

const { register, handleSubmit, formState: { errors } } = useForm<CreateGroupInput>({
  resolver: zodResolver(createGroupSchema),
});
```

**What changes**:
- `register("name")` replaces your manual `value={name} onChange={...}` — react-hook-form manages the state
- `handleSubmit(onValid)` replaces your manual `e.preventDefault()` + submit logic
- `errors.name?.message` gives you the zod error message for that field
- No more `useState` for form fields

**What you'll learn**: how react-hook-form eliminates boilerplate. One form converted teaches you the pattern for all of them.

**Done when**: CreateGroupPage validates against the zod schema and shows field-level errors.

### Step 9: Convert remaining forms

Apply the same pattern to:
1. `LoginPage` / `SignupPage` (use `loginSchema` / `signupSchema`)
2. `JoinGroupPage` (simple)
3. Settlement form
4. Expense form (the complex one — `createExpenseSchema` has cross-field refinements, which react-hook-form handles via the resolver)

**For the expense form**: the zod refinements (percentages sum to 100%, fixed amounts sum correctly) will surface as form-level errors. You can display these at the bottom of the form or next to the relevant section.

**Done when**: every form validates client-side using the same schemas as the server.

---

## Phase 3: Make It Beautiful

Goal: go from unstyled HTML to a polished app using shadcn components and Tailwind. Work from the outside in — layout first, then pages, then details.

### Step 10: Layout and navigation

**Start here because** it wraps every page — one change improves everything.

**What to do**:
- Restyle `Header.tsx` with shadcn `Button` for nav actions
- Add padding/max-width to `Layout.tsx` so content doesn't stretch edge-to-edge
- Consider a simple sidebar or top nav — look at shadcn's navigation patterns

**shadcn components**: `Button` (for nav links and logout)

**Tailwind to learn first**: `max-w-*`, `mx-auto`, `px-*`, `py-*`, `flex`, `justify-between`, `items-center`, `gap-*`. These six handle 80% of layout.

### Step 11: Form pages

**What to do**: Style all your form pages consistently.

**shadcn components**:
- `Card` + `CardHeader` + `CardContent` — wrap each form in a card
- `Input` — replace bare `<input>` elements (note: shadcn Input doesn't have a `label` prop — you add `<label>` yourself or build a small wrapper)
- `Button` — replace bare `<button>` elements with variants (`default`, `outline`, `destructive`)

**Pattern**: wrap each form page in `<Card><CardHeader><CardTitle>Page Title</CardTitle></CardHeader><CardContent>...form...</CardContent></Card>`

**Do one page first** (LoginPage is the simplest), get it looking right, then copy the pattern to the others.

### Step 12: Data display pages

**What to do**: Style GroupsPage (group list), GroupDetailPage (tabs + content), expense list, balance list.

**shadcn components**:
- `Card` for each group in the list and each expense
- Consider adding shadcn `Tabs` component for the GroupDetailPage tabs (`npx shadcn@latest add tabs`)
- `Avatar` for member names in the balance/member views
- `Badge` component for tags like "owner", "virtual" (`npx shadcn@latest add badge`)

**Tailwind patterns**: `space-y-*` for vertical lists, `grid` for card grids, `divide-y` for bordered lists.

### Step 13: Loading and error states

**What to do**: Replace bare `<p>Loading...</p>` with proper feedback.

**Options**:
- shadcn `Skeleton` component for loading placeholders
- A simple shared `ErrorMessage` component (just a red card with the error text)
- Disable buttons and show spinner text during mutations (you already have `isPending` checks)

### Step 14: Polish

Ideas for when the core is done:
- Add virtual member button on the members tab in GroupDetailPage — lets group owners add offline participants after group creation (currently members can only be added at expense time)
- Empty states — friendly messages when there are no groups/expenses yet, with a call-to-action button
- Confirmation dialogs — replace `window.confirm` for delete actions with shadcn `AlertDialog` (`npx shadcn@latest add alert-dialog`)
- Toast notifications — shadcn has a `Sonner` integration for success/error toasts (`npx shadcn@latest add sonner`)
- Mobile responsiveness — Tailwind's `sm:`, `md:`, `lg:` prefixes for responsive breakpoints
- Dark mode — your shadcn CSS already has `.dark` variables defined, just need a toggle

---

## Tips

- **One thing at a time**. Finish a step, verify it works, commit, then move on. Small commits = easy to undo mistakes.
- **Read your zod schemas** before building a form. They are the source of truth for what the backend expects. The error messages are already written in the schema.
- **Copy patterns, don't invent**. When building a new form, look at one you already finished and follow the same structure.
- **shadcn docs are your friend**: https://ui.shadcn.com — each component page has usage examples you can copy directly.
- **Don't fight Tailwind**: if you find yourself writing 15 utility classes on one element, you probably need to restructure your HTML instead.
