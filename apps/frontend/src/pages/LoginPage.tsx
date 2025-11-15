import type { LoginRequest, LoginResponse } from 'lib/route-types/auth-types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../utils/auth'

function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        console.log('Submitted', { email })
        setLoading(true)

        try {
            const result = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/Json'
                },
                body: JSON.stringify({
                    email
                } satisfies LoginRequest)
            })
            if (!result.ok) {
                const errorData = await result.json()
                setError(errorData.error || 'Registration failed')
                return
            }
            const userData = await result.json() as LoginResponse
            setAuth(userData)
            navigate('/dashboard')
        } catch (error) {
            setError("Networking Error. Try again")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (<h2> Loading... </h2>)
    }
    return (
        <>
            <div>
                <h2> Login </h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <label> Email: </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <br></br>
                <button onClick={handleLogin}> Submit </button>
            </div>
        </>
    )
}

export default LoginPage
