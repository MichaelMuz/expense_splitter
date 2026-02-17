import { $Enums, SplitMethod, TaxTipType } from '@prisma/client';
import type { CreateExpenseInput, Expense } from "@/shared/schemas/expense";
import { useState } from "react";
import type { Group } from "@/shared/schemas/group";
import { toCents, toDollars } from "@/shared/utils/currency";
import { assertUnreachable } from '@/shared/utils/type-helpers';

function toBackend(type: TaxTipType, value: string): number {
    switch (type) {
        case "FIXED": return toCents(parseFloat(value));
        case "PERCENTAGE": return parseFloat(value) * 100;
        default: assertUnreachable(type);
    }
}
function toDisplay(type: TaxTipType, value: number): string {
    switch (type) {
        case "FIXED": return toDollars(value).toString();
        case "PERCENTAGE": return (value / 100).toString();
        default: assertUnreachable(type);
    }
}
const splitValuetoBackend = (splitMethod: SplitMethod, value: string): { splitMethod: SplitMethod, splitValue: number | null } => (
    {
        splitMethod, splitValue: splitMethod === "EVEN" ? null : toBackend(splitMethod, value)
    }
);
function splitValuetoDisplay(type: SplitMethod, value: number | undefined | null): string {
    if (value == null || type == "EVEN") {
        return ""
    } else {
        return toDisplay(type, value)
    }
}


export default function ExpenseForm({ initialData, members, isPending, onSubmit }: { initialData?: Expense; members: Group['members']; isPending: boolean; onSubmit: (data: CreateExpenseInput) => void }) {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");

    const [payerSplitType, setPayerSplitType] = useState(initialData?.payers[0]?.splitMethod || $Enums.SplitMethod.EVEN);
    const [payerIds, setPayerIds] = useState(initialData?.payers.map(p => p.groupMemberId) || []);
    const [payerIdToAmount, setPayerIdToAmount] = useState(
        Object.fromEntries(initialData?.payers.map(p => [p.groupMemberId, splitValuetoDisplay(payerSplitType, p.splitValue)]) ?? [])
    );

    const [owerSplitType, setOwerSplitType] = useState(initialData?.owers[0]?.splitMethod || $Enums.SplitMethod.EVEN);
    const [owerIds, setOwerIds] = useState(initialData?.owers.map(p => p.groupMemberId) || []);
    const [owerIdToAmount, setOwerIdToAmount] = useState(
        Object.fromEntries(initialData?.owers.map(o => [o.groupMemberId, splitValuetoDisplay(owerSplitType, o.splitValue)]) ?? [])
    );

    const [baseAmount, setBaseAmount] = useState(initialData?.baseAmount ? toDisplay("FIXED", initialData?.baseAmount) : "");

    const [taxType, setTaxType] = useState(initialData?.taxType || null);
    const [taxAmount, setTaxAmount] = useState(taxType && initialData?.taxAmount ? toDisplay(taxType, initialData?.taxAmount) : "");

    const [tipType, setTipType] = useState(initialData?.tipType || null);
    const [tipAmount, setTipAmount] = useState(tipType && initialData?.tipAmount ? toDisplay(tipType, initialData?.tipAmount) : "");


    const handleSubmit = (e: React.FormEvent) => {
        const taxTypeAmount = taxType ? {
            taxType, taxAmount: toBackend(taxType, taxAmount)
        } : {};
        const tipTypeAmount = tipType ? {
            tipType, tipAmount: toBackend(tipType, tipAmount)
        } : {};


        e.preventDefault();
        onSubmit({
            name,
            description,
            baseAmount: toBackend("FIXED", baseAmount),
            ...taxTypeAmount,
            ...tipTypeAmount,
            payers: payerIds.map(id => ({
                groupMemberId: id,
                ...splitValuetoBackend(payerSplitType, payerIdToAmount[id] || "0")
            })),
            owers: owerIds.map(id => ({
                groupMemberId: id,
                ...splitValuetoBackend(owerSplitType, owerIdToAmount[id] || "0")
            })),
        })
    }


    return (

        <form onSubmit={handleSubmit}>

            <label >Expense Name
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </label>

            <label >Expense Description
                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>

            <label >Expense Amount
                <input
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    required
                />
            </label>

            <p>Payment Split</p>
            {Object.values($Enums.SplitMethod).map(s =>
                <label key={s}>
                    <input
                        type="radio"
                        checked={payerSplitType == s}
                        onChange={() => setPayerSplitType(s)}
                    />
                    {s}
                </label>)}

            <p>Payers</p>
            {members.map(m =>
                <label key={m.id} >
                    <input
                        type="checkbox"
                        checked={payerIds.includes(m.id)}
                        onChange={e => setPayerIds(e.target.checked ? [...payerIds, m.id] : payerIds.filter(id => id !== m.id))}
                    />
                    {m.name}

                    {payerSplitType != "EVEN" && payerIds.includes(m.id) && <input
                        value={payerIdToAmount[m.id] || ""}
                        onChange={e => setPayerIdToAmount({ ...payerIdToAmount, [m.id]: e.target.value })}
                        required
                    />}
                </label>
            )}

            <p>Owing Split</p>
            {Object.values($Enums.SplitMethod).map(s =>
                <label key={s}>
                    <input
                        type="radio"
                        checked={owerSplitType == s}
                        onChange={() => setOwerSplitType(s)}
                    />
                    {s}
                </label>)}

            <p>Owers</p>
            {members.map(m =>
                <label key={m.id} >
                    <input
                        type="checkbox"
                        checked={owerIds.includes(m.id)}
                        onChange={e => setOwerIds(e.target.checked ? [...owerIds, m.id] : owerIds.filter(id => id !== m.id))}
                    />
                    {m.name}

                    {owerSplitType != "EVEN" && owerIds.includes(m.id) && <input
                        value={owerIdToAmount[m.id] || ""}
                        onChange={e => setOwerIdToAmount({ ...owerIdToAmount, [m.id]: e.target.value })}
                        required
                    />}

                </label>
            )}

            <p>Tax</p>
            {[...Object.values($Enums.TaxTipType), null].map(t =>
                <label key={t}>
                    <input
                        type="radio"
                        checked={taxType == t}
                        onChange={() => setTaxType(t)}
                    />
                    {t || "None"}
                </label>)}
            {taxType &&
                <label >Tax Amount
                    <input
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(e.target.value)}
                        required
                    />
                </label>}

            <p>Tip</p>
            {[...Object.values($Enums.TaxTipType), null].map(t =>
                <label key={t}>
                    <input
                        type="radio"
                        checked={tipType == t}
                        onChange={() => setTipType(t)}
                    />
                    {t || "None"}
                </label>)}
            {tipType &&
                <label >Tip Amount
                    <input
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        required
                    />
                </label>}

            <button type='submit' disabled={isPending}>Submit</button>
        </form>
    );
}
