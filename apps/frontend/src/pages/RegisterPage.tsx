import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { RegisterRequest } from 'lib/route-types/auth-types.js';

function RegisterPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleRegister() {
        console.log('Submitted', { name, email })
        setLoading(true)
        setError('')

        try {
            const result = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/Json'
                },
                body: JSON.stringify({
                    name,
                    email
                } satisfies RegisterRequest)
            })
            if (!result.ok) {
                const errorData = await result.json()
                setError(errorData.error || 'Registration failed')
                return
            }
            navigate('/login')
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
                <h2> Register </h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <label> Name: </label>
                <input type="text" value={name} onChange={n => setName(n.target.value)} />
                <br></br>
                <label> Email: </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <br></br>
                <button onClick={handleRegister}> Submit </button>
            </div>
        </>
    )
}

export default RegisterPage
