import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useJoinGroup, usePreviewGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { joinInviteSchema, type GroupMember, type JoinInviteInput } from '@/shared/schemas/group';
import { Loading } from '../components/layout/Loading';

function JoinGroupPageCore({ inviteCode, unclaimedMembers }: { inviteCode: string; unclaimedMembers: GroupMember[] }) {
  const navigate = useNavigate();
  const joinGroup = useJoinGroup();

  const canClaim = unclaimedMembers.length > 0

  const { register, handleSubmit, watch, formState: { errors } } = useForm<JoinInviteInput>({
    resolver: zodResolver(joinInviteSchema),
    defaultValues: { type: canClaim ? "claim" : "new" }
  })
  const type = watch("type")

  const onSubmit = (data: JoinInviteInput) => {
    joinGroup.mutate({ inviteCode, joinInput: data }, { onSuccess: result => navigate(`/groups/${result.group.id}`) })
  };

  return (
    <Layout>
      <h1>Join a Group</h1>
      {joinGroup.isError && <p>{joinGroup.error.message}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>

        {canClaim &&
          <div>
            <label>Claim existing member <input type="radio" value="claim" {...register("type")} /> </label>
            <label>Join as new <input type="radio" value="new" {...register("type")} /> </label>
            {errors.type?.message}
          </div>}

        <div>
          {type === "new" &&
            <label>Member Name
              <input type="text" {...register("memberName")} />
              {"memberName" in errors && errors.memberName?.message}
            </label>}
          {type === "claim" &&
            <select {...register("memberId")}>
              {unclaimedMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>}
        </div>
        <div>
          <button type="submit" disabled={joinGroup.isPending}>
            {joinGroup.isPending ? 'Joining...' : 'Join Group'}
          </button>
          <button type="button" onClick={() => navigate('/groups')}>Cancel</button>
        </div>

      </form>
    </Layout >
  );

}

function JoinGroupPageGate({ inviteCode }: { inviteCode: string }) {
  const previewGroup = usePreviewGroup(inviteCode);

  if (previewGroup.error) return <p>{previewGroup.error.message}</p>;
  if (previewGroup.isLoading) return <Loading name="group to join" />;
  if (!previewGroup.data) return <p>Invalid Invite Code</p>;

  const unclaimedMembers = previewGroup.data.members.filter(m => !m.userId);
  return <JoinGroupPageCore inviteCode={inviteCode} unclaimedMembers={unclaimedMembers} />;
}

export default function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  if (!inviteCode) return <Navigate to="/groups" replace />;
  return <JoinGroupPageGate inviteCode={inviteCode} />;
}
