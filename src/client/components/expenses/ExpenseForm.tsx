import { $Enums } from '@prisma/client';
import type { CreateExpenseInput, Expense } from "@/shared/schemas/expense";
import { useState } from "react";
import type { Group } from "@/shared/schemas/group";
import { toCents, toDollars } from "@/shared/utils/currency";

export default function ExpenseForm({ initialData, members, isPending, onSubmit }: { initialData?: Expense; members: Group['members']; isPending: boolean; onSubmit: (data: CreateExpenseInput) => void }) {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [baseAmount, setBaseAmount] = useState(initialData?.baseAmount ? toDollars(initialData?.baseAmount).toString() : "");
    const [taxAmount, setTaxAmount] = useState(initialData?.taxAmount ? toDollars(initialData?.taxAmount).toString() : "");
    const [taxType, setTaxType] = useState(initialData?.taxType || null);
    const [tipAmount, setTipAmount] = useState(initialData?.tipAmount ? toDollars(initialData?.tipAmount).toString() : "");
    const [tipType, setTipType] = useState(initialData?.tipType || null);
    const [payerIds, setPayerIds] = useState(initialData?.payers.map(p => p.groupMemberId) || []);
    const [owerIds, setOwerIds] = useState(initialData?.owers.map(p => p.groupMemberId) || []);

    const handleSubmit = (e: React.FormEvent) => {
        const taxTypeAmount = taxType ? {
            taxType, taxAmount: toCents(parseFloat(taxAmount))
        } : {};
        const tipTypeAmount = tipType ? {
            tipType, tipAmount: toCents(parseFloat(tipAmount))
        } : {};

        e.preventDefault();
        onSubmit({
            name,
            description,
            baseAmount: toCents(parseFloat(baseAmount)),
            ...taxTypeAmount,
            ...tipTypeAmount,
            payers: payerIds.map(id => ({
                groupMemberId: id,
                splitMethod: 'EVEN',
            })),
            owers: owerIds.map(id => ({
                groupMemberId: id,
                splitMethod: 'EVEN',
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

            <p>Payers</p>
            {members.map(m =>
                <label key={m.id} >
                    <input
                        type="checkbox"
                        checked={payerIds.includes(m.id)}
                        onChange={e => setPayerIds(e.target.checked ? [...payerIds, m.id] : payerIds.filter(id => id !== m.id))}
                    />
                    {m.name}
                </label>
            )}

            <p>Owers</p>
            {members.map(m =>
                <label key={m.id} >
                    <input
                        type="checkbox"
                        checked={owerIds.includes(m.id)}
                        onChange={e => setOwerIds(e.target.checked ? [...owerIds, m.id] : owerIds.filter(id => id !== m.id))}
                    />
                    {m.name}
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
