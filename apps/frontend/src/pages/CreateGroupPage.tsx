import { useNavigate } from 'react-router-dom'
import { getAuth } from '../utils/auth'
import type { CreateGroupRequest} from 'lib/route-types/group-types.js'
import { useState } from 'react'

function CreateGroupPage() {
    const [groupName, setGroupName] = useState('')
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const auth = getAuth()
    async function createGroup() {
        try {
            const result = await fetch('http://localhost:3000/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/Json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    name: groupName
                } satisfies CreateGroupRequest)
            })

            if (!result.ok) {
                const errorData = await result.json()
                setError(errorData.error || 'Failed to fetch groups')
            }
            else{
                navigate('/dashboard')
            }


        } catch {
            setError("Networking Error. Try again")
        }
    }

    return (
        <>
            <div>
                <h2> Create Group </h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <label> Group Name: </label>
                <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} />
                <br></br>
                <button onClick={createGroup}> Submit </button>
            </div>
        </>
    )
}

export default CreateGroupPage
