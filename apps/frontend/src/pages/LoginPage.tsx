import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [response, setResponse] = useState('')
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
                })
            })
            const userData = await result.json()
            localStorage.setItem('auth', userData)
            navigate('/success')
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
                <h2> Login </h2>
                <label> Email: </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <br></br>
                <button onClick={handleLogin}> Submit </button>
            </div>
            <h2> {response} </h2>
        </>
    )
}

export default LoginPage
