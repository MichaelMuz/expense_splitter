export type User = {
    id: number,
    name: string,
    email: string
}

export type Group = {
    id: number,
    name: string,
    inviteCode: string,
    createdAt: Date
}

export type Expense = {
    id: number,
    paidByUser: User,
    groupId: number,
    description: string,
    amount: number,
    fee: number,
    createdAt: Date,
}

export type ExpenseSplit = {
    // expenseId: number,
    user: User,
    amountOwed: number,
    paid: boolean,
}
