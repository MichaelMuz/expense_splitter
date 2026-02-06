# Database Schema Design

## Core Principle: Store Only Atomic Input Data

**Never store calculated values.** The database should only contain the raw input data that users enter. All amounts owed, balances, and totals are computed on-the-fly from this atomic data.

### Why?

1. **Expense Editability**: When editing, users see exactly what they originally entered
2. **Data Integrity**: No risk of stale or incorrect cached calculations
3. **Single Source of Truth**: Calculations can be improved without data migration
4. **Debugging**: Easy to verify calculations match inputs

---

## Schema Models

### User

Represents the login account. One user can have multiple personas (GroupMembers) across different groups.

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // hashed
  createdAt DateTime @default(now())

  // Relations
  groupMembers GroupMember[] // All personas across groups

  @@map("users")
}
```

**Key Fields**:

- `email` / `password`: Login credentials (always required)
- One user can appear as different names in different groups via GroupMember

**Design Benefits**:

- Clean separation: User = login, GroupMember = persona
- No nullable credentials or boolean flags with weak invariants
- Multiple personas: "Mike" in one group, "Michael" in another

---

### GroupMember

Represents a person's identity/persona within a specific group. Can be a real user (linked to account) or a virtual person (no account).

```prisma
model GroupMember {
  id        String   @id @default(uuid())
  groupId   String
  userId    String?  // null = virtual person, not-null = real user
  name      String   // How they appear in THIS group
  role      String   @default("member") // "owner" or "member"
  joinedAt  DateTime @default(now())

  // Relations
  user             User?            @relation(fields: [userId], references: [id], onDelete: SetNull)
  group            Group            @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidExpenses     ExpensePayer[]
  owedExpenses     ExpenseOwer[]
  settlementsFrom  Settlement[]     @relation("SettlementFrom")
  settlementsTo    Settlement[]     @relation("SettlementTo")

  @@unique([groupId, userId]) // Can't join same group twice
  @@map("group_members")
}
```

**Key Fields**:

- `userId`: Nullable - presence determines if virtual or real
  - `null` = virtual person (offline participant)
  - `not-null` = real user (has account)
- `name`: Display name in this specific group
- `@@unique([groupId, userId])`: Prevents duplicate joins

**Virtual Person Flow**:

1. Create GroupMember with `userId = null`, `name = "John"`
2. When John joins via invite link, just set `userId = <their-account-id>`
3. No data migration needed!

**Design Benefits**:

- Enforced invariants: virtual people CAN'T have passwords (database-level)
- Simple claiming: just update userId field
- Multiple personas: same User appears with different names in different groups

---

### Group

Container for related expenses with invite code for sharing.

```prisma
model Group {
  id         String   @id @default(uuid())
  name       String
  inviteCode String   @unique @default(uuid())
  createdAt  DateTime @default(now())

  // Relations
  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]

  @@map("groups")
}
```

**Key Fields**:

- `inviteCode`: Unique shareable link for inviting people

---

### Expense

The core transaction record. Stores ONLY what the user entered, no calculations.

```prisma
model Expense {
  id          String   @id @default(uuid())
  groupId     String
  name        String
  description String

  // Base amount (pre-tax/tip) - REQUIRED
  baseAmount  Float

  // Tax - optional
  taxAmount   Float?
  taxType     TaxTipType? // FIXED or PERCENTAGE

  // Tip - optional
  tipAmount   Float?
  tipType     TaxTipType? // FIXED or PERCENTAGE

  createdAt   DateTime @default(now())

  // Relations
  group  Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payers ExpensePayer[] // Who paid and their split configuration
  owers  ExpenseOwer[]  // Who owes and their split configuration

  @@map("expenses")
}

enum TaxTipType {
  FIXED       // Dollar amount
  PERCENTAGE  // Percentage of base amount
}
```

**Key Fields**:

- `baseAmount`: Pre-tax/tip subtotal (always required)
- `taxAmount` / `taxType`: Optional tax as $ or %
- `tipAmount` / `tipType`: Optional tip as $ or %

**NOT stored**:

- Total expense amount (calculated: base + tax + tip)
- How much each payer actually paid (calculated from split config)
- How much each ower actually owes (calculated from split config + proportional tax/tip)

---

### ExpensePayer

Junction table: who paid for an expense and how their payment splits.

```prisma
model ExpensePayer {
  expenseId     String
  groupMemberId String
  splitMethod   SplitMethod
  splitValue    Float?  // For FIXED ($) or PERCENTAGE (0-100), null for EVEN

  // Relations
  expense     Expense     @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  groupMember GroupMember @relation(fields: [groupMemberId], references: [id], onDelete: Cascade)

  @@id([expenseId, groupMemberId])
  @@map("expense_payers")
}

enum SplitMethod {
  EVEN        // Divide equally among all payers/owers
  FIXED       // Fixed dollar amount
  PERCENTAGE  // Percentage share (0-100)
}
```

**Key Fields**:

- `groupMemberId`: References the GroupMember (persona) who paid
- `splitMethod`: How this payer's contribution is calculated
- `splitValue`:
  - `null` for EVEN split
  - Dollar amount for FIXED (e.g., 50.00)
  - Percentage for PERCENTAGE (e.g., 60.0 = 60%)

**Example**: Multiple payers on $1000 expense

```javascript
// Me pays 60%, Sarah pays 40%
[
  { groupMemberId: 'member-me', splitMethod: 'PERCENTAGE', splitValue: 60.0 },
  {
    groupMemberId: 'member-sarah',
    splitMethod: 'PERCENTAGE',
    splitValue: 40.0,
  },
];

// When displaying/editing: show exactly this
// When calculating: Me paid $600, Sarah paid $400
```

---

### ExpenseOwer

Junction table: who owes on an expense and how their debt splits.

```prisma
model ExpenseOwer {
  expenseId     String
  groupMemberId String
  splitMethod   SplitMethod
  splitValue    Float?  // For FIXED ($) or PERCENTAGE (0-100), null for EVEN

  // Relations
  expense     Expense     @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  groupMember GroupMember @relation(fields: [groupMemberId], references: [id], onDelete: Cascade)

  @@id([expenseId, groupMemberId])
  @@map("expense_owers")
}
```

**Key Fields**: Same as ExpensePayer - stores the split configuration, not the calculated amount.

**Example**: $100 base + $10 tax + $20 tip

```javascript
// Fixed amounts
[
  { groupMemberId: 'member-alice', splitMethod: 'FIXED', splitValue: 60.0 },
  { groupMemberId: 'member-bob', splitMethod: 'FIXED', splitValue: 40.0 },
];

// When displaying/editing: show "Alice: $60, Bob: $40"
// When calculating:
//   Alice owes: $60 + ($10 × 60/100) + ($20 × 60/100) = $78
//   Bob owes: $40 + ($10 × 40/100) + ($20 × 40/100) = $52
```

**NOT stored**:

- Base amount owed per person
- Tax owed per person
- Tip owed per person
- Total amount owed per person

---

### Settlement

Records when someone pays someone else to settle debts.

```prisma
model Settlement {
  id                String   @id @default(uuid())
  groupId           String
  fromGroupMemberId String   // Who paid
  toGroupMemberId   String   // Who received
  amount            Float    // How much was paid
  paidAt            DateTime @default(now())
  recordedBy        String   // GroupMemberId of who recorded this payment

  // Relations
  group       Group       @relation(fields: [groupId], references: [id], onDelete: Cascade)
  fromMember  GroupMember @relation("SettlementFrom", fields: [fromGroupMemberId], references: [id], onDelete: Cascade)
  toMember    GroupMember @relation("SettlementTo", fields: [toGroupMemberId], references: [id], onDelete: Cascade)

  @@map("settlements")
}
```

**Key Fields**:

- `fromGroupMemberId` → `toGroupMemberId`: Direction of payment (between personas)
- `amount`: How much was paid (concrete dollar amount)
- `recordedBy`: GroupMemberId of who recorded this (audit trail)

---

## Calculation Functions (Not Stored)

All of these are computed from the atomic data above:

### 1. Calculate Total Expense Amount

```typescript
function calculateTotalExpenseAmount(expense: Expense): number {
  const taxAmount =
    expense.taxType === 'PERCENTAGE'
      ? expense.baseAmount * (expense.taxAmount / 100)
      : (expense.taxAmount ?? 0);

  const tipAmount =
    expense.tipType === 'PERCENTAGE'
      ? expense.baseAmount * (expense.tipAmount / 100)
      : (expense.tipAmount ?? 0);

  return expense.baseAmount + taxAmount + tipAmount;
}
```

### 2. Calculate Payer Amounts

```typescript
function calculatePayerAmounts(expense: Expense): Map<string, number> {
  const payers = expense.payers;
  const results = new Map<string, number>(); // groupMemberId -> amount paid

  if (payers.every((p) => p.splitMethod === 'EVEN')) {
    // Even split
    const totalPaid = calculateTotalExpenseAmount(expense);
    const perPayer = totalPaid / payers.length;
    payers.forEach((p) => results.set(p.groupMemberId, perPayer));
  } else if (payers.every((p) => p.splitMethod === 'FIXED')) {
    // Fixed amounts
    payers.forEach((p) => results.set(p.groupMemberId, p.splitValue!));
  } else if (payers.every((p) => p.splitMethod === 'PERCENTAGE')) {
    // Percentage split
    const totalPaid = calculateTotalExpenseAmount(expense);
    payers.forEach((p) => {
      const amount = totalPaid * (p.splitValue! / 100);
      results.set(p.groupMemberId, amount);
    });
  }

  return results;
}
```

### 3. Calculate Ower Amounts (with proportional tax/tip)

```typescript
function calculateOwerAmounts(expense: Expense): Map<string, number> {
  const owers = expense.owers;
  const results = new Map<string, number>(); // groupMemberId -> amount owed

  // Step 1: Calculate base amounts
  const baseAmounts = new Map<string, number>();

  if (owers.every((o) => o.splitMethod === 'EVEN')) {
    const perOwer = expense.baseAmount / owers.length;
    owers.forEach((o) => baseAmounts.set(o.groupMemberId, perOwer));
  } else if (owers.every((o) => o.splitMethod === 'FIXED')) {
    owers.forEach((o) => baseAmounts.set(o.groupMemberId, o.splitValue!));
  } else if (owers.every((o) => o.splitMethod === 'PERCENTAGE')) {
    owers.forEach((o) => {
      const amount = expense.baseAmount * (o.splitValue! / 100);
      baseAmounts.set(o.groupMemberId, amount);
    });
  }

  // Step 2: Calculate total base for proportions
  const totalBase = Array.from(baseAmounts.values()).reduce((a, b) => a + b, 0);

  // Step 3: Calculate tax and tip amounts
  const taxAmount =
    expense.taxType === 'PERCENTAGE'
      ? expense.baseAmount * (expense.taxAmount! / 100)
      : (expense.taxAmount ?? 0);

  const tipAmount =
    expense.tipType === 'PERCENTAGE'
      ? expense.baseAmount * (expense.tipAmount! / 100)
      : (expense.tipAmount ?? 0);

  // Step 4: Distribute proportionally
  baseAmounts.forEach((base, groupMemberId) => {
    const proportion = base / totalBase;
    const tax = taxAmount * proportion;
    const tip = tipAmount * proportion;
    results.set(groupMemberId, base + tax + tip);
  });

  return results;
}
```

### 4. Calculate Net Balances

```typescript
function calculateNetBalances(
  groupId: string
): Map<string, Map<string, number>> {
  // 1. Get all expenses for group
  // 2. For each expense:
  //    - Calculate who paid what (from calculatePayerAmounts)
  //    - Calculate who owes what (from calculateOwerAmounts)
  //    - For each ower, distribute debt to payers proportionally
  // 3. Get all settlements for group
  // 4. Reduce settlements from debts
  // 5. Net off mutual debts (A owes B, B owes A)
  // 6. Return final balance graph
}
```

---

## Data Integrity Rules

### 1. Payer Split Values Must Sum Correctly

- **EVEN**: No validation needed
- **FIXED**: Sum of splitValues must equal total expense amount
- **PERCENTAGE**: Sum of splitValues must equal 100

### 2. Ower Split Values Must Sum Correctly

- **EVEN**: No validation needed
- **FIXED**: Sum of splitValues must equal baseAmount
- **PERCENTAGE**: Sum of splitValues must equal 100

### 3. GroupMembers (Virtual vs Real)

- **Virtual person**: GroupMember with `userId = NULL` (no account linked)
- **Real user**: GroupMember with `userId = <account-id>` (linked to User account)
- **Claiming**: When virtual person joins, just `UPDATE group_members SET userId = <new-account> WHERE id = <member-id>`
- **Duplicate prevention**: `@@unique([groupId, userId])` prevents same account joining group twice

### 4. Expense Components

- `baseAmount` is always required (> 0)
- `taxAmount` and `tipAmount` are optional (can be NULL or 0)
- If `taxAmount` exists, `taxType` must exist
- If `tipAmount` exists, `tipType` must exist

---

## Example: Full Expense Record

### User Input

```
Description: "Dinner at Mario's"
Base Amount: $100
Tax: 10% (percentage)
Tip: $20 (fixed)
Payers: Me (even split - but only 1 payer so 100%)
Owers: Me, Alice, Bob, Charlie (even split)
```

### Stored in Database

```javascript
{
  // Expense table
  id: "exp-123",
  groupId: "grp-456",
  description: "Dinner at Mario's",
  baseAmount: 100.0,
  taxAmount: 10.0,
  taxType: "PERCENTAGE",
  tipAmount: 20.0,
  tipType: "FIXED",

  // ExpensePayer table
  payers: [
    { groupMemberId: "member-me", splitMethod: "EVEN", splitValue: null }
  ],

  // ExpenseOwer table
  owers: [
    { groupMemberId: "member-me", splitMethod: "EVEN", splitValue: null },
    { groupMemberId: "member-alice", splitMethod: "EVEN", splitValue: null },
    { groupMemberId: "member-bob", splitMethod: "EVEN", splitValue: null },
    { groupMemberId: "member-charlie", splitMethod: "EVEN", splitValue: null }
  ]
}
```

### When Displaying (Calculated)

```javascript
// Total expense: $100 + ($100 × 0.10) + $20 = $130

// Me paid: $130 (only payer)
// Me owes: $130 / 4 = $32.50

// Each person owes:
// - Base: $100 / 4 = $25
// - Tax: $10 / 4 = $2.50
// - Tip: $20 / 4 = $5.00
// - Total per person: $32.50

// Net balances:
// - Alice owes Me: $32.50
// - Bob owes Me: $32.50
// - Charlie owes Me: $32.50
// - My net: +$97.50
```

### When Editing

Show exactly what was entered:

- Base: $100
- Tax: 10% (with toggle showing it's percentage)
- Tip: $20 (with toggle showing it's fixed)
- Split: Even (dropdown)

User can change any value and recalculation happens on save.

---

## Summary

This schema design ensures:

- ✅ Users see their exact input when editing
- ✅ No cached calculations that can become stale
- ✅ Single source of truth for all amounts
- ✅ Calculations can be improved without data migration
- ✅ Easy to debug and verify correctness
- ✅ Supports all required features (multiple payers, virtual users, flexible splits, settlements)

All dollar amounts are stored as floats. For production, consider storing as integers (cents) to avoid floating-point precision issues.
