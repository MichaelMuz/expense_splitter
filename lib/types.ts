export type User = {
    id: number,
    name: string,
    email: string
}
export type SplitIntent =
    | { userId: number; type: "fixed"; value: number }
    | { userId: number; type: "percentage"; value: number }
    | { userId: number; type: "even_split" };

export type ExpenseRequest = {
    description: string;
    amount: number;
    fee: number;
    splits: SplitIntent[];
};

export type ExpenseResponse = {
    id: number;
    description: string;
    amount: number;
    fee: number;
    createdAt: Date;
    paidByUser: {
        id: number;
        name: string;
        email: string;
    };
    splits: {
        userId: number;
        amountOwed: number;
        paid: boolean;
        user: {
            id: number;
            name: string;
            email: string;
        };
    }[];
};
