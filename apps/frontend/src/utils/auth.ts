import type { LoginResponse } from "lib/route-types/auth-types"

const AUTH = 'auth';

export function setAuth(userData: LoginResponse) {
    localStorage.setItem(AUTH, JSON.stringify(userData))
}

export function getAuth(): LoginResponse {
    const data = localStorage.getItem(AUTH)
    if (!data) {
        throw Error
    }
    return JSON.parse(data) as LoginResponse
}

export function isAuth(): boolean {
    const data = localStorage.getItem(AUTH)
    return Boolean(data)
}
