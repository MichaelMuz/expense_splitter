import { useExpenses } from "@/client/hooks/useExpenses";
import { useSettlements } from "@/client/hooks/useSettlements";
import { Loading } from "../layout/Loading";
import { calculateNetBalances } from "@/shared/utils/calculations";


export function BalancesList({ groupId }: { groupId: string }) {
    const expenses = useExpenses(groupId);
    const settlements = useSettlements(groupId);

    const isLoading = expenses.isLoading || settlements.isLoading
    const errorMsg = [expenses, settlements].map(e => e.isError ? e.error.message : undefined)

    if (isLoading) return <Loading name='balances' />;
    if (errorMsg) return <p>Failed to load balances</p>;

    calculateNetBalances(expenses.data, settlements.data);

}
