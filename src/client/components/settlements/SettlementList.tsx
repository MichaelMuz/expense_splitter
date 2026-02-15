import { useSettlements, useDeleteSettlement } from '@/client/hooks/useSettlements';
import { formatCurrency } from '../../../shared/utils/currency';
import { Loading } from '../layout/Loading';


export function SettlementList({ groupId }: { groupId: string }) {
    const { data: settlements, isLoading, error } = useSettlements(groupId);
    const deleteSettlement = useDeleteSettlement(groupId);

    const handleDelete = async (settlementId: string) => {
        if (window.confirm('Delete this settlement?')) {
            await deleteSettlement.mutateAsync(settlementId);
        }
    };

    if (isLoading) return <Loading name='settlements' />
    if (error) return <p>Failed to load settlements.</p>;
    if (!settlements || settlements.length === 0) return <p>No settlements yet.</p>;

    return (
        <ul>
            {settlements.map((settlement) => (
                <li key={settlement.id}>
                    {settlement.from.name} to {settlement.to.name} — {formatCurrency(settlement.amount)}
                    {' '}
                    <button onClick={() => handleDelete(settlement.id)}>Delete</button>
                </li>
            ))}
        </ul>
    );
}
