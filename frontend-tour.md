# Frontend Tour Progress

## Pages - ALL REVIEWED

1. LoginPage - uses Card, Input, Button
2. SignupPage - uses Card, Input, Button, Tooltip
3. HomePage - uses Button
4. GroupsPage - uses Card, Button
5. CreateGroupPage - uses Card, Input, Button
6. JoinGroupPage - uses Card, Input, Button
7. GroupDetailPage - container with tabs, delegates to child components
8. AddExpensePage - split into CreateExpense/EditExpense with shared ExpenseFormView
9. SettlementPage - wrapper around SettlementForm

## Layout - REVIEWED (keeping as-is)

- Header.tsx - nav bar
- Layout.tsx - page shell, wraps pages with Header
- ProtectedRoute.tsx - redirects to login if not authenticated

## UI Primitives - REPLACED WITH SHADCN

shadcn components installed: button, card, input, avatar, skeleton, tooltip
Old hand-written ui/ deleted. Pages still need import updates.

## Components - NEED TO REWRITE MYSELF

These are essential to the app but need to be gutted and rewritten.
The AI tried to be a designer and failed. Core logic is needed, styling is not.

### groups/
- GroupCard.tsx - displays a group in the groups list. Needed, but rewrite.
- InviteLink.tsx - copy invite link. Simple, might be fine. Review.
- MemberList.tsx - show/manage group members. Needed, already partially reviewed.
- VirtualPersonClaim.tsx - unclear what this does. Investigate before deciding.

### expenses/
- ExpenseForm.tsx / ExpenseFormView - the form for creating/editing expenses. Essential. Gut the styling, keep the logic.
- ExpenseList.tsx - lists expenses in a group. Essential. Rewrite.
- ExpenseCard.tsx - displays a single expense. Over-designed. Rewrite simply.
- OwerSelector.tsx - form sub-component. Review if needed or over-engineered.
- PayerSelector.tsx - form sub-component. Review if needed or over-engineered.
- SplitMethodPicker.tsx - form sub-component. Review if needed or over-engineered.

### balances/
- SettlementForm.tsx - form to record a payment. Essential. Review and simplify.
- BalanceSummary.tsx - shows who owes whom as numbers. Probably needed, but simplify.
- BalanceGraph.tsx - fancy animated chart. DELETE. I need this like a fish needs an umbrella.

## Key Patterns Established

1. No manual loading/error state - use React Query's mutation.isPending, mutation.error
2. Derived state - compute during render, don't store in useState
3. mutate with onSuccess over mutateAsync with try/catch
4. Shared Zod schemas as single source of truth
5. <Navigate> for condition-based redirects, navigate() for event handlers
6. Guard clauses for required URL params
7. Rules of Hooks - never call hooks conditionally
8. enabled in useQuery to prevent queries from running
9. initialData: null in auth query for cleaner types

## Libs In Progress

- shadcn/ui installed, imports not yet updated in consuming components
- React Hook Form + zod resolver planned for forms
