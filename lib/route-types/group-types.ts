import type { User, Group } from 'lib/types.js';

export type CreateGroupRequest = {
    name: string,
};
export type CreateGroupResponse = {
    group: Group,

};

export type GetGroupsResponse = {
    groups: Group[],
};

export type JoinGroupRequest = {
    inviteCode: string
};
export type JoinGroupResponse = CreateGroupResponse;

export type GetGroupResponse = {
    group: Group,
    members: {
        user: User, role: string, joinedAt: Date
    }[],
};
