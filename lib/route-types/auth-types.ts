import type { User } from 'lib/types.js';

export type RegisterRequest = {
    name: string,
    email: string
};
export type RegisterResponse = User;

export type LoginRequest = {
    email: string
};
export type LoginResponse = {
    token: string,
    user: User
};
