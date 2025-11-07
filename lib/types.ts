export type SplitIntent =
    | { userId: number; type: "fixed"; value: number }
    | { userId: number; type: "percentage"; value: number }
    | { userId: number; type: "even_split" };

export type CreateExpenseRequest = {
    description: string;
    baseAmount: number;
    fee: number;
    splits: SplitIntent[];
};
