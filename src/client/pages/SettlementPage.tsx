import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';
import { Loading } from '../components/layout/Loading';
import { useCreateSettlement } from '../hooks/useSettlements';
import { toCents, toDollars } from '@/shared/utils/currency';
import { createSettlementSchema, type CreateSettlementInput } from '@/shared/schemas/settlement';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Group } from '@/shared/schemas/group';


function SettlementPageCore({ group }: { group: Group }) {
  const navigate = useNavigate();
  const createSettlement = useCreateSettlement(group.id);

  const [searchParams] = useSearchParams();
  const initialAmount = searchParams.get("amount")
  const initialFromMemberId = searchParams.get("from") ?? undefined
  const initialToMemberId = searchParams.get("to") ?? undefined

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateSettlementInput>({
    resolver: zodResolver(createSettlementSchema),
    defaultValues: {
      fromGroupMemberId: group.members.find(m => m.id === initialFromMemberId)?.id ?? undefined,
      toGroupMemberId: group.members.find(m => m.id === initialToMemberId)?.id ?? undefined,
      amount: initialAmount ? toDollars(parseFloat(initialAmount)) : undefined
    }
  });

  const onSubmit = (data: CreateSettlementInput) => {
    createSettlement.mutate(data, { onSuccess: () => navigate(`/groups/${group.id}`) })
  }

  return (
    <Layout>
      <h1>Record Settlement in {group.name}</h1>
      <button onClick={() => navigate(`/groups/${group.id}`)}>Back</button>

      <p> {createSettlement.isError && createSettlement.error.message}</p>

      <form onSubmit={handleSubmit(onSubmit)}>

        <select {...register("fromGroupMemberId")}>
          <option value={undefined}> Choose a sender </option>
          {group.members.map(m =>
            <option key={m.id} value={m.id}> {m.name} </option>
          )}
        </select>
        {errors.fromGroupMemberId?.message}

        <input placeholder="0.00" {...register("amount", { setValueAs: v => toCents(parseFloat(v)) })} />
        {errors.amount?.message}

        <select {...register("toGroupMemberId")}>
          <option value={undefined}> Choose a receiver </option>
          {group.members.filter(m => m.id !== watch("fromGroupMemberId")).map(m =>
            <option key={m.id} value={m.id}> {m.name} </option>
          )}
        </select>
        {errors.toGroupMemberId?.message}

        <button type='submit' disabled={createSettlement.isPending}> Submit </button>
      </form >

    </Layout >
  );
}
function SettlementPageGuard({ groupId }: { groupId: string }) {
  const { data: group, isLoading } = useGroup(groupId);
  if (isLoading) return <Loading name='group' />
  if (!group) return <Layout><p>Group not found.</p></Layout>;
  return <SettlementPageCore group={group} />

}
export default function SettlementPage() {
  const { groupId } = useParams<{ groupId: string }>();

  if (!groupId) return <Navigate to="/groups" replace />;
  return <SettlementPageGuard groupId={groupId} />
}
