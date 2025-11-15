import { useNavigate } from 'react-router-dom'
import { getAuth } from '../utils/auth'
import type { GetGroupsResponse } from 'lib/route-types/group-types.js'
import { useEffect, useState } from 'react'

function DashboardPage() {
    const [groups, setGroups] = useState<GetGroupsResponse>()
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const auth = getAuth()
    async function getGroups() {
        try {
            const result = await fetch('http://localhost:3000/api/groups', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                },
            })

            if (result.ok) {
                const groups = await result.json() as GetGroupsResponse
                setGroups(groups)
            }
            else {
                const errorData = await result.json()
                setError(errorData.error || 'Failed to fetch groups')
            }
        } catch {
            setError("Networking Error. Try again")
        }
    }
    useEffect(() => { getGroups() }, [])

    let groupsJsx = <h2> Loading... </h2>
    if (groups !== undefined) {
        groupsJsx = (
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Invite Code</th>
                        <th>Created</th>
                    </tr>
                </thead>

                <tbody>
                    {groups.groups.map(group => (
                        <tr
                            key={group.id}
                            onClick={() => navigate(`/view_group/${group.id}`)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                            <td>{group.id}</td>
                            <td>{group.name}</td>
                            <td>{group.inviteCode}</td>
                            <td>{new Date(group.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }

    return (
        <>
            <h2> Dashboard </h2>
            <button onClick={() => { navigate('/create_group') }}> Create Group </button>
            <h2> Groups </h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <br></br>
            {groupsJsx}
        </>
    )
}

export default DashboardPage
