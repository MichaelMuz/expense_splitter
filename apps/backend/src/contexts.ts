import type { Context } from "koa";
import type { User } from "./entities/User.js";
import type { GroupMembership } from "./entities/Group.js";


// fat interface declares everything possible as optional
declare module 'koa' {
    interface DefaultState {
        user?: User | { id: number };
        groupMembership?: GroupMembership;
    }
}

// concrete interfaces at each step of middleware process

export interface JWTContext extends Context {
    state: {
        user: { id: number };
    }
}

export interface AuthContext extends Context {
    state: {
        user: User;
        groupMembership?: GroupMembership;
    }
}

export interface GroupContext extends Context {
    state: {
        user: User;
        groupMembership: GroupMembership;
    }
}
