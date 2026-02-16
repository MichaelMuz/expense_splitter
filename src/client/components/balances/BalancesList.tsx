import type { Group } from "@/shared/schemas/group";
import { useExpenses } from "@/client/hooks/useExpenses";
import { useSettlements } from "@/client/hooks/useSettlements";
import { Loading } from "../layout/Loading";
import { calculateNetBalances } from "@/shared/utils/calculations";
import { formatCurrency } from "@/shared/utils/currency";
import { Link } from "react-router-dom";
import { addQueryParams } from "@/client/lib/utils";


export function BalancesList({ groupId, members }: { groupId: string; members: Group['members'] }) {
    const expenses = useExpenses(groupId);
    const settlements = useSettlements(groupId);

    const isLoading = expenses.isLoading || settlements.isLoading
    const errorMsg = [expenses, settlements].map(e => e.isError ? e.error.message : undefined).filter(e => !!e).at(0)

    if (isLoading || !expenses.data || !settlements.data) return <Loading name='balances' />;
    if (errorMsg) return <p>Failed to load balances</p>;

    const netBalances = calculateNetBalances(expenses.data, settlements.data);
    const memberIdToName = new Map(members.map(m => [m.id, m.name]))

    return (
        <ul>
            {Array.from(netBalances).map(([owedId, owerMap]) =>
                Array.from(owerMap).map(([owerId, amount]) =>
                    <li key={`${owedId}-${owerId}`}>
                        {memberIdToName.get(owedId) || "ERROR"} is owed {formatCurrency(amount)} by {memberIdToName.get(owerId) || "ERROR"}
                        <Link to={addQueryParams(`/groups/${groupId}/settlements/new`, { from: owerId, to: owedId, amount })}>
                            Settle Up
                        </Link>
                    </li>
                )
            )}
        </ul>
    )

}
