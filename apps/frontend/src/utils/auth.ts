import type { LoginResponse } from "lib/route-types/auth-types"

export function setAuth(userData: LoginResponse) {
    localStorage.setItem('auth', JSON.stringify(userData))
}


export function getAuth(): LoginResponse {
    const data = localStorage.getItem('auth')
    if (!data) {
        throw Error
    }
    return JSON.parse(data) as LoginResponse
}

