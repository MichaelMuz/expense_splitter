import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { RegisterResponse, RegisterRequest } from 'lib/route-types/auth-types.js';
import { setAuth } from '../utils/auth';

function RegisterPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleRegister() {
        console.log('Submitted', { name, email })
        setLoading(true)

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
            const userData = await result.json() as RegisterResponse
            setAuth(userData)
            navigate('/login')
        } catch (error) {
            setResponse("Error")
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
                <label> Name: </label>
                <input type="text" value={name} onChange={n => setName(n.target.value)} />
                <br></br>
                <label> Email: </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <br></br>
                <button onClick={handleRegister}> Submit </button>
            </div>
            <h2> {response} </h2>
        </>
    )
}

export default RegisterPage
