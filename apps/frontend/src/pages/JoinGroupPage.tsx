import { useNavigate } from 'react-router-dom'
import { getAuth } from '../utils/auth'
import type { JoinGroupRequest } from 'lib/route-types/group-types.js'
import { useState } from 'react'

function JoinGroupPage() {
    const [inviteCode, setinviteCode] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const auth = getAuth()
    async function joinGroup() {
        try {
            const result = await fetch('http://localhost:3000/api/groups/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/Json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    inviteCode
                } satisfies JoinGroupRequest)
            })

            if (!result.ok) {
                const errorData = await result.json()
                setError(errorData.error || 'Failed to fetch groups')
            }
            else {
                navigate('/dashboard')
            }


        } catch {
            setError("Networking Error. Try again")
        }
    }

    return (
        <>
            <div>
                <h2> Join Group </h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <label> Invite Code: </label>
                <input type="text" value={inviteCode} onChange={e => setinviteCode(e.target.value)} />
                <br></br>
                <button onClick={joinGroup}> Submit </button>
            </div>
        </>
    )
}

export default JoinGroupPage
