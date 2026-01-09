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

Represents both real users (with accounts) and virtual people (offline participants).

```prisma
model User {
  id              String   @id @default(uuid())
  name            String
  email           String?  @unique // Optional for virtual users
  password        String?  // Optional for virtual users (hashed)
  isVirtual       Boolean  @default(false)
  claimedByUserId String?  // If virtual user was claimed by real user
  createdAt       DateTime @default(now())

  // Relations
  groupMemberships GroupMembership[]
  paidExpenses     ExpensePayer[]    // Expenses this user paid for
  owedExpenses     ExpenseOwer[]     // Expenses this user owes on
  settlementsFrom  Settlement[]      @relation("SettlementFrom")
  settlementsTo    Settlement[]      @relation("SettlementTo")

  @@map("users")
}
```

**Key Fields**:
- `email` / `password`: Nullable for virtual users
- `isVirtual`: Distinguishes real users from virtual people
- `claimedByUserId`: Links virtual person to real user who claimed them

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
  members     GroupMembership[]
  expenses    Expense[]
  settlements Settlement[]

  @@map("groups")
}
```

**Key Fields**:
- `inviteCode`: Unique shareable link for inviting people

---

### GroupMembership

Junction table tracking who belongs to which groups.

```prisma
model GroupMembership {
  userId   String
  groupId  String
  role     String   @default("member") // "owner" or "member"
  joinedAt DateTime @default(now())

  // Relations
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@id([userId, groupId])
  @@map("group_memberships")
}
```

---

### Expense

The core transaction record. Stores ONLY what the user entered, no calculations.

```prisma
model Expense {
  id          String   @id @default(uuid())
  groupId     String
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
  expenseId   String
  userId      String
  splitMethod SplitMethod
  splitValue  Float?  // For FIXED ($) or PERCENTAGE (0-100), null for EVEN

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([expenseId, userId])
  @@map("expense_payers")
}

enum SplitMethod {
  EVEN        // Divide equally among all payers/owers
  FIXED       // Fixed dollar amount
  PERCENTAGE  // Percentage share (0-100)
}
```

**Key Fields**:
- `splitMethod`: How this payer's contribution is calculated
- `splitValue`:
  - `null` for EVEN split
  - Dollar amount for FIXED (e.g., 50.00)
  - Percentage for PERCENTAGE (e.g., 60.0 = 60%)

**Example**: Multiple payers on $1000 expense
```javascript
// Me pays 60%, Sarah pays 40%
[
  { userId: "me", splitMethod: "PERCENTAGE", splitValue: 60.0 },
  { userId: "sarah", splitMethod: "PERCENTAGE", splitValue: 40.0 }
]

// When displaying/editing: show exactly this
// When calculating: Me paid $600, Sarah paid $400
```

---

### ExpenseOwer

Junction table: who owes on an expense and how their debt splits.

```prisma
model ExpenseOwer {
  expenseId   String
  userId      String
  splitMethod SplitMethod
  splitValue  Float?  // For FIXED ($) or PERCENTAGE (0-100), null for EVEN

  // Relations
  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([expenseId, userId])
  @@map("expense_owers")
}
```

**Key Fields**: Same as ExpensePayer - stores the split configuration, not the calculated amount.

**Example**: $100 base + $10 tax + $20 tip
```javascript
// Fixed amounts
[
  { userId: "alice", splitMethod: "FIXED", splitValue: 60.0 },
  { userId: "bob", splitMethod: "FIXED", splitValue: 40.0 }
]

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
  id         String   @id @default(uuid())
  groupId    String
  fromUserId String   // Who paid
  toUserId   String   // Who received
  amount     Float    // How much was paid
  paidAt     DateTime @default(now())
  recordedBy String   // User who recorded this payment

  // Relations
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  from  User  @relation("SettlementFrom", fields: [fromUserId], references: [id], onDelete: Cascade)
  to    User  @relation("SettlementTo", fields: [toUserId], references: [id], onDelete: Cascade)

  @@map("settlements")
}
```

**Key Fields**:
- `fromUserId` → `toUserId`: Direction of payment
- `amount`: How much was paid (concrete dollar amount)
- `recordedBy`: Audit trail of who recorded this

---

## Calculation Functions (Not Stored)

All of these are computed from the atomic data above:

### 1. Calculate Total Expense Amount

```typescript
function calculateTotalExpenseAmount(expense: Expense): number {
  const taxAmount = expense.taxType === 'PERCENTAGE'
    ? expense.baseAmount * (expense.taxAmount / 100)
    : expense.taxAmount ?? 0;

  const tipAmount = expense.tipType === 'PERCENTAGE'
    ? expense.baseAmount * (expense.tipAmount / 100)
    : expense.tipAmount ?? 0;

  return expense.baseAmount + taxAmount + tipAmount;
}
```

### 2. Calculate Payer Amounts

```typescript
function calculatePayerAmounts(expense: Expense): Map<string, number> {
  const payers = expense.payers;
  const results = new Map<string, number>();

  if (payers.every(p => p.splitMethod === 'EVEN')) {
    // Even split
    const totalPaid = calculateTotalExpenseAmount(expense);
    const perPayer = totalPaid / payers.length;
    payers.forEach(p => results.set(p.userId, perPayer));
  } else if (payers.every(p => p.splitMethod === 'FIXED')) {
    // Fixed amounts
    payers.forEach(p => results.set(p.userId, p.splitValue!));
  } else if (payers.every(p => p.splitMethod === 'PERCENTAGE')) {
    // Percentage split
    const totalPaid = calculateTotalExpenseAmount(expense);
    payers.forEach(p => {
      const amount = totalPaid * (p.splitValue! / 100);
      results.set(p.userId, amount);
    });
  }

  return results;
}
```

### 3. Calculate Ower Amounts (with proportional tax/tip)

```typescript
function calculateOwerAmounts(expense: Expense): Map<string, number> {
  const owers = expense.owers;
  const results = new Map<string, number>();

  // Step 1: Calculate base amounts
  const baseAmounts = new Map<string, number>();

  if (owers.every(o => o.splitMethod === 'EVEN')) {
    const perOwer = expense.baseAmount / owers.length;
    owers.forEach(o => baseAmounts.set(o.userId, perOwer));
  } else if (owers.every(o => o.splitMethod === 'FIXED')) {
    owers.forEach(o => baseAmounts.set(o.userId, o.splitValue!));
  } else if (owers.every(o => o.splitMethod === 'PERCENTAGE')) {
    owers.forEach(o => {
      const amount = expense.baseAmount * (o.splitValue! / 100);
      baseAmounts.set(o.userId, amount);
    });
  }

  // Step 2: Calculate total base for proportions
  const totalBase = Array.from(baseAmounts.values()).reduce((a, b) => a + b, 0);

  // Step 3: Calculate tax and tip amounts
  const taxAmount = expense.taxType === 'PERCENTAGE'
    ? expense.baseAmount * (expense.taxAmount! / 100)
    : expense.taxAmount ?? 0;

  const tipAmount = expense.tipType === 'PERCENTAGE'
    ? expense.baseAmount * (expense.tipAmount! / 100)
    : expense.tipAmount ?? 0;

  // Step 4: Distribute proportionally
  baseAmounts.forEach((base, userId) => {
    const proportion = base / totalBase;
    const tax = taxAmount * proportion;
    const tip = tipAmount * proportion;
    results.set(userId, base + tax + tip);
  });

  return results;
}
```

### 4. Calculate Net Balances

```typescript
function calculateNetBalances(groupId: string): Map<string, Map<string, number>> {
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

### 3. Virtual Users

- Virtual users: email and password are NULL, isVirtual = true
- Real users: email and password are NOT NULL, isVirtual = false
- When virtual user is claimed: claimedByUserId points to real user

### 4. Expense Components

- `baseAmount` is always required (> 0)
- `taxAmount` and `tipAmount` are optional (can be NULL or 0)
- If `taxAmount` exists, `taxType` must exist
- If `tipAmount` exists, `tipType` must exist

---

## Migration from Current Schema

Current schema has:
```prisma
model Expense {
  amount Float  // This is unclear - is it base or total?
  fee    Float  // This is unclear - tax? tip? processing fee?
}

model ExpenseSplit {
  amountOwed Float   // ❌ CALCULATED VALUE - should not be stored
  paid       Boolean // ❌ Confusing - settlements should be separate
}
```

New schema separates:
- **Input data**: baseAmount, taxAmount, taxType, tipAmount, tipType, splitMethod, splitValue
- **Calculated data**: Everything else (computed on-the-fly)
- **Settlements**: Separate model for tracking payments

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
    { userId: "me", splitMethod: "EVEN", splitValue: null }
  ],

  // ExpenseOwer table
  owers: [
    { userId: "me", splitMethod: "EVEN", splitValue: null },
    { userId: "alice", splitMethod: "EVEN", splitValue: null },
    { userId: "bob", splitMethod: "EVEN", splitValue: null },
    { userId: "charlie", splitMethod: "EVEN", splitValue: null }
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
