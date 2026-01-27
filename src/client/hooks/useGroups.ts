/**
 * React Query hooks for group operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { CreateGroupInput } from '@/shared/schemas/group';

interface GroupMember {
  id: string;
  name: string;
  role: string;
  userId: string | null;
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  members: GroupMember[];
  _count?: {
    expenses: number;
  };
}

interface GroupsResponse {
  groups: Group[];
}

interface GroupResponse {
  group: Group;
}

interface CreateGroupResponse {
  group: Group;
}

interface JoinGroupResponse {
  group: {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
  };
  member: GroupMember;
}

/**
 * Fetch all groups the user is a member of
 */
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get<GroupsResponse>('/groups');
      return response.data.groups;
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
      const response = await api.get<GroupResponse>(`/groups/${groupId}`);
      return response.data.group;
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
      const response = await api.post<CreateGroupResponse>('/groups', data);
      return response.data.group;
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
      const response = await api.post<JoinGroupResponse>(`/groups/join/${inviteCode}`);
      return response.data;
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
