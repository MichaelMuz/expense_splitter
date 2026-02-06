# Expense Splitter - Application Design & Workflow

## Overview

A Splitwise-like expense splitting app that handles flexible cost sharing for groups, with support for proportional tax/tip distribution, multiple payers, virtual users, and net settlement calculation.

---

## Core Concepts

### Groups

- **Purpose**: Container for related expenses (e.g., "Dinner with friends", "Roommate expenses", "Vegas trip")
- **Lifecycle**: Can be short-running (one event) or long-running (ongoing shared expenses)
- **Members**: Mix of real users (with accounts) and virtual people (offline participants)
- **Invite System**: Share invite link for others to join

### Expenses

- **Scope**: Individual transactions within a group
- **Participants**: Can involve a subset of group members
- **Payers**: One or more people who paid the bill
- **Owers**: People who owe money for this expense
- **Components**:
  - Base amount (pre-tax/tip subtotal) - REQUIRED
  - Tax (optional, $ or %)
  - Tip (optional, $ or %)

### People

- **Real Users**: Have accounts, can log in, manage their expenses
- **Virtual People**: Added manually, no account, represent offline participants
- **Identity Claiming**: When joining via link, can claim a virtual person identity

### Settlements

- **Net Balances**: Calculate who owes whom after offsetting mutual debts
- **Payment Tracking**: Users report when they've paid someone
- **Status**: Track settlement progress for each group

---

## User Workflows

### Workflow 1: Starting After Dinner (New User, New Group)

**Scenario**: Just finished dinner with 3 friends. Need to split the bill.

1. **Open app** (not logged in)
   - Option A: Quick guest mode (create group without account)
   - Option B: Sign up / Log in

2. **Create new group**
   - Enter group name: "Dinner at Italian Place"
   - System generates unique invite link
   - User becomes group owner

3. **Add participants**
   - Add self (auto-added if logged in)
   - Add friends:
     - Option A: Add as virtual people ("Alice", "Bob", "Charlie")
     - Option B: Share invite link, they join with accounts

4. **Add the dinner expense**
   - **Description**: "Dinner at Mario's"
   - **Amount**: $100 (pre-tax subtotal)
   - **Tax**: $10 (or 10%)
   - **Tip**: $20 (or 20%)
   - **Who paid**: Me
   - **Who participated**: Me, Alice, Bob, Charlie
   - **Split method**: Even split
   - **Calculation**:
     - Base per person: $100 / 4 = $25
     - Tax per person: $10 × 0.25 = $2.50
     - Tip per person: $20 × 0.25 = $5.00
     - **Each person owes**: $32.50

5. **View balances**
   - Alice owes Me: $32.50
   - Bob owes Me: $32.50
   - Charlie owes Me: $32.50
   - **My net**: +$97.50 (owed to me)

6. **Share invite link**
   - Friends can join and see what they owe
   - Can claim virtual identities or create new ones

### Workflow 2: Day Trip with Multiple Expenses

**Scenario**: Day trip with friends. Multiple people paid for different things.

**Group**: "Beach Day - June 2026"
**Members**: Me, Sarah, Mike, Jenny

**Expense 1: Parking**

- Amount: $20
- Who paid: Sarah
- Participants: Everyone (even split)
- Each owes: $5.00
- Balances: Me owes Sarah $5, Mike owes Sarah $5, Jenny owes Sarah $5

**Expense 2: Lunch**

- Amount: $80 (pre-tax)
- Tax: $8
- Tip: $16
- Who paid: Me
- Participants: Me, Sarah, Mike (Jenny didn't eat)
- Split method: Even split
- Calculation:
  - Base per person: $80 / 3 = $26.67
  - Tax per person: $8 / 3 = $2.67
  - Tip per person: $16 / 3 = $5.33
  - Each owes: $34.67
- Balances: Sarah owes Me $34.67, Mike owes Me $34.67

**Expense 3: Gas**

- Amount: $60
- Who paid: Mike
- Participants: Everyone (even split)
- Each owes: $15.00
- Balances: Me owes Mike $15, Sarah owes Mike $15, Jenny owes Mike $15

**Net Balances** (after all expenses):

Breaking down each person's position:

- **Me**:
  - Owed from Sarah: $34.67 (lunch)
  - Owed from Mike: $34.67 (lunch)
  - Owe to Sarah: $5 (parking)
  - Owe to Mike: $15 (gas)
  - **Net**: +$49.34 (net receiver)

- **Sarah**:
  - Owes to Me: $34.67 (lunch)
  - Owed from Me: $5 (parking)
  - Owes to Mike: $15 (gas)
  - **Net with Me**: Owes me $29.67
  - **Net with Mike**: Owes Mike $15

- **Mike**:
  - Owes to Me: $34.67 (lunch)
  - Owed from Me: $15 (gas)
  - Owed from Sarah: $15 (gas)
  - Owed from Jenny: $15 (gas)
  - **Net with Me**: Owes me $19.67
  - **Net overall**: +$10.33 (net receiver)

- **Jenny**:
  - Owes to Sarah: $5 (parking)
  - Owes to Mike: $15 (gas)
  - **Net**: -$20 (net payer)

**Simplified Net Settlement**:

- Sarah pays Me: $29.67
- Mike pays Me: $19.67
- Jenny pays Sarah: $5
- Jenny pays Mike: $15

### Workflow 3: Uneven Split with Fixed Amounts

**Scenario**: Dinner where people ordered different amounts.

**Group**: "Fancy Dinner"
**Members**: Me, Alex, Taylor

**Expense: Restaurant Bill**

- Amount: $150 (pre-tax)
- Tax: $15
- Tip: $30
- Who paid: Me
- Participants: All
- Split method: Fixed amounts
  - Me: $50 (ordered appetizer + entree)
  - Alex: $60 (ordered entree + dessert + drink)
  - Taylor: $40 (just entree)

**Calculation**:

- Me base: $50
- Alex base: $60
- Taylor base: $40
- Total base: $150 ✓

Tax/Tip distribution (proportional to base amounts):

- **Me**: $50 + ($15 × 50/150) + ($30 × 50/150) = $50 + $5 + $10 = $65
- **Alex**: $60 + ($15 × 60/150) + ($30 × 60/150) = $60 + $6 + $12 = $78
- **Taylor**: $40 + ($15 × 40/150) + ($30 × 40/150) = $40 + $4 + $8 = $52

**Balances**:

- Alex owes Me: $78
- Taylor owes Me: $52
- My net: +$130

### Workflow 4: Percentage Split

**Scenario**: Business lunch, split by agreed percentages.

**Expense: Client Lunch**

- Amount: $200
- Tax: $20
- Tip: $40
- Who paid: Me
- Participants: Me (60%), Partner (40%)
- Split method: Percentage

**Calculation**:

- **Me**: $200 × 0.6 + $20 × 0.6 + $40 × 0.6 = $120 + $12 + $24 = $156
- **Partner**: $200 × 0.4 + $20 × 0.4 + $40 × 0.4 = $80 + $8 + $16 = $104

**Balances**:

- Partner owes Me: $104
- My net: +$104

### Workflow 5: Multiple Payers

**Scenario**: Two people split paying a large bill.

**Expense: Group Vacation Rental**

- Amount: $1000
- Who paid:
  - Me: $600 (60%)
  - Sarah: $400 (40%)
- Participants: Me, Sarah, Mike, Jenny (even split)
- Split method: Even split

**Calculation**:
Total owed per person: $1000 / 4 = $250

**Settlement**:

- Me paid $600, owes $250 → Net: +$350 (owed to me)
- Sarah paid $400, owes $250 → Net: +$150 (owed to her)
- Mike paid $0, owes $250 → Net: -$250 (owes)
- Jenny paid $0, owes $250 → Net: -$250 (owes)

**Balances**:

- Mike owes: $250 total (split between Me and Sarah proportionally)
  - Mike owes Me: $250 × 0.6 = $150
  - Mike owes Sarah: $250 × 0.4 = $100
- Jenny owes: $250 total
  - Jenny owes Me: $250 × 0.6 = $150
  - Jenny owes Sarah: $250 × 0.4 = $100

### Workflow 6: Virtual People & Identity Claiming

**Scenario**: Adding friends who may or may not join the app.

1. **Create group**: "Birthday Party"
2. **Add expenses** with virtual people
   - Add "John (virtual)" - owes $25
   - Add "Emma (virtual)" - owes $30
   - Add "Lisa (virtual)" - owes $20

3. **Share invite link** via text

4. **John opens link**:
   - Sees: "Who are you?"
   - Options:
     - "I'm John" (claims John's $25 debt)
     - "I'm someone else" (types new name)
   - Creates account or continues as virtual
   - Can now see all expenses where he participated

5. **Emma never joins**:
   - Stays as virtual person
   - I track the $30 debt offline
   - Can manually mark as paid when she pays me cash

### Workflow 7: Settling Up

**Current balances** in "Roommate Expenses" group:

- Mike owes Me: $150
- I owe Sarah: $80
- Mike owes Sarah: $50

**Settlement actions**:

1. **Mike pays me $150 cash**
   - I record: "Received $150 from Mike"
   - Mike's balance with me → $0

2. **I Venmo Sarah $80**
   - I record: "Paid Sarah $80"
   - My balance with Sarah → $0

3. **Mike still owes Sarah $50**
   - Shows in both Mike's and Sarah's views
   - Either can mark as paid when settled

---

## Key Features

### 1. Flexible Split Methods

- **Even**: Divide equally among participants
- **Fixed**: Specify exact $ amount per person
- **Percentage**: Specify % share per person
- Works for both payers and owers

### 2. Proportional Tax/Tip

- Tax and tip distributed based on base amount share
- Can enter as $ or %
- Optional fields (include in base amount if prefer)

### 3. Multi-Payer Support

- One expense can have multiple payers
- Each payer's contribution can be fixed/percentage/even
- Settlement automatically calculated

### 4. Virtual People

- Add offline participants without accounts
- Can claim identity when joining via link
- Debts tracked same as real users

### 5. Net Settlement

- Automatic calculation of net balances
- Offset mutual debts (A owes B, B owes A)
- Shows who is net payer vs net receiver
- Simplifies settlement flow

### 6. Flexible Participation

- Each expense can include subset of group
- Payer doesn't have to participate (paid but didn't eat)
- Participant doesn't have to pay (ate but someone else paid)

### 7. Payment Tracking

- Record when payments made
- Both parties can mark as paid
- Track settlement progress per group

---

## Core Design Principles

### 1. Expense Editability

**Critical Requirement**: When a user goes to edit an expense, it must appear EXACTLY as they originally entered it.

This means:

- If they entered "Even split" → show "Even split" (not the calculated amounts)
- If they entered "$100 base + 15% tax" → show "$100 base + 15% tax" (not "$115 total")
- If they entered "Alice: 60%, Bob: 40%" → show percentages (not "$60 and $40")

### 2. Store Only Atomic Input Data

**Never store calculated values in the database.**

Store:

- The raw inputs user entered (base amount, tax %, tip $, split method)
- The split configuration (even/fixed/percentage + values)

Do NOT store:

- How much each person owes (calculate from inputs)
- Total expense amount (calculate: base + tax + tip)
- Net balances (calculate from all expenses + settlements)
- Proportional tax/tip per person (calculate on-the-fly)

**Why?**

- Ensures edit experience matches original input
- No risk of stale/incorrect cached calculations
- Single source of truth for all calculations
- Calculations can be improved/fixed without data migration

All amounts owed, balances, and totals are computed functions of the atomic input data.

---

## Data Model Considerations (Initial - See Issues Below)

> **⚠️ WARNING**: The models below were an initial design but have a critical flaw - they store calculated values like `amountPaid`, `baseAmountOwed`, `taxOwed`, `tipOwed`, and `totalOwed`. This violates the atomic data principle above. See DATABASE_SCHEMA.md for the corrected design that only stores input data.

### Expense Model

```
Expense:
  - id
  - groupId
  - description
  - baseAmount (pre-tax/tip)
  - taxAmount (optional)
  - taxType (FIXED | PERCENTAGE)
  - tipAmount (optional)
  - tipType (FIXED | PERCENTAGE)
  - createdAt
  - payers[] → ExpensePayer[]
  - owers[] → ExpenseOwer[]
```

### ExpensePayer (junction table)

```
ExpensePayer:
  - expenseId
  - userId (real or virtual)
  - amountPaid (calculated from split method)
  - splitMethod (EVEN | FIXED | PERCENTAGE)
  - splitValue (for fixed $ or %)
```

### ExpenseOwer (junction table)

```
ExpenseOwer:
  - expenseId
  - userId (real or virtual)
  - baseAmountOwed
  - taxOwed
  - tipOwed
  - totalOwed (calculated)
  - splitMethod (EVEN | FIXED | PERCENTAGE)
  - splitValue (for fixed $ or %)
```

### Settlement Model

```
Settlement:
  - id
  - groupId
  - fromUserId
  - toUserId
  - amount
  - paidAt
  - recordedBy (userId)
```

### Person Types

```
User:
  - id
  - email
  - password
  - name
  - isVirtual (boolean)
  - claimedByUserId (if virtual person was claimed)
```

---

## Calculation Logic

### Tax/Tip Distribution Algorithm

```
For expense with baseAmount, tax, tip:

1. Calculate each person's base share (via even/fixed/percentage)
2. Sum all base shares → totalBase
3. For each person:
   - baseProportion = personBase / totalBase
   - personTax = tax × baseProportion
   - personTip = tip × baseProportion
   - personTotal = personBase + personTax + personTip
```

### Net Settlement Algorithm

```
For each group:

1. Collect all debts: (fromUser, toUser, amount)
2. Build debt graph
3. For each user pair (A, B):
   - debtAtoB = sum of A→B debts
   - debtBtoA = sum of B→A debts
   - netDebt = debtAtoB - debtBtoA
   - If netDebt > 0: A owes B netDebt
   - If netDebt < 0: B owes A |netDebt|
   - If netDebt = 0: settled
4. Apply payments to reduce net debts
5. Calculate final balances
```

---

## UI/UX Considerations

### Critical User Flows

1. **Quick expense entry** - Should be fast (<30 seconds)
2. **Balance visibility** - Always show what I owe / am owed
3. **Invite simplicity** - Just share a link
4. **Settlement clarity** - Clear payment instructions

### Mobile-First Design

- Most usage will be on mobile (right after dinner)
- Large touch targets for amount entry
- Quick select for even split (most common)
- Easy access to invite link sharing

### Progressive Disclosure

- Start simple (even split, single payer)
- Show advanced options (fixed amounts, multiple payers) when needed
- Don't overwhelm with all features upfront

---

## Technical Implementation Notes

### Tax/Tip Input

- Toggle between $ and % input
- Convert % to $ amount for storage
- Show both in UI for clarity

### Virtual Person Claiming

- Match by name (case-insensitive)
- Show all unclaimed virtual people when joining
- Merge debt history when claimed

### Real-Time Updates

- When someone joins group → notify existing members
- When expense added → update all member balances
- When payment recorded → update both parties

### Rounding

- Store amounts as cents (integers) to avoid floating point errors
- Round proportional distributions to nearest cent
- Ensure total distributed = original amount

---

## Summary

This expense splitter handles real-world scenarios with:

- **Flexible splitting**: Even/Fixed/Percentage for any expense
- **Fair tax/tip**: Proportional distribution based on consumption
- **Multiple payers**: Split the bill between multiple people
- **Virtual users**: Include friends without accounts
- **Net settlement**: Simplified debt tracking
- **Subset participation**: Not everyone in group needs to be in every expense

The key innovation is the proportional tax/tip distribution, which ensures fairness while remaining flexible for different split methods.
