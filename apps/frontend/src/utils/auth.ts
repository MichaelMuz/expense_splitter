import type { User } from "lib"

export function setAuth(userData: User) {
    localStorage.setItem('auth', JSON.stringify(userData))
}


export function getAuth(): User {
    const data = localStorage.getItem('auth')
    if (!data) {
        throw Error
    }
    return JSON.parse(data) as User
}

