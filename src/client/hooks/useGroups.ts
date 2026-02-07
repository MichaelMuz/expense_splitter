/**
 * React Query hooks for group operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { CreateGroupInput } from '@/shared/schemas/group';
import {
  groupResponseSchema,
  groupsResponseSchema,
  createGroupResponseSchema,
  joinGroupResponseSchema,
  type Group,
} from '@/shared/schemas/group';

/**
 * Fetch all groups the user is a member of
 */
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get('/groups');
      const validated = groupsResponseSchema.parse(response.data);
      return validated.groups;
    },
    refetchOnMount: 'always',
  });
}

/**
 * Fetch a specific group by ID
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}`);
      const validated = groupResponseSchema.parse(response.data);
      return validated.group;
    },
    enabled: !!groupId,
    refetchOnMount: 'always',
  });
}

/**
 * Create a new group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupInput) => {
      const response = await api.post('/groups', data);
      const validated = createGroupResponseSchema.parse(response.data);
      return validated.group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/**
 * Join a group using invite code
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await api.post(`/groups/join/${inviteCode}`);
      const validated = joinGroupResponseSchema.parse(response.data);
      return validated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

/**
 * Delete a group (owner only)
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      await api.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
