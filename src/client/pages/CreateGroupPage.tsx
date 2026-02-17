import { useNavigate } from 'react-router-dom';
import { useCreateGroup } from '../hooks/useGroups';
import { Layout } from '../components/layout/Layout';

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createGroupSchema, type CreateGroupInput } from '@/shared/schemas/group';


export default function CreateGroupPage() {
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const { register, handleSubmit, formState: { errors } } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema)
  })

  const onSubmit = (data: CreateGroupInput) => {
    createGroup.mutate(data, { onSuccess: group => navigate(`/groups/${group.id}`) })
  };

  return (
    <Layout>
      <h1>Create New Group</h1>
      {createGroup.isError && <p>{createGroup.error.message}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Group Name
          <input {...register("name")} />
      {errors.name && <p>{errors.name.message}</p>}
        </label>
        <button type="submit" disabled={createGroup.isPending}>
          {createGroup.isPending ? 'Creating...' : 'Create Group'}
        </button>
        <button type="button" onClick={() => navigate('/groups')}>Cancel</button>
      </form>
    </Layout>
  );
}
