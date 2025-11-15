import { getAuth } from '../utils/auth'
import type { GetGroupResponse } from 'lib/route-types/group-types.js'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function DashboardPage() {
    const [group, setGroup] = useState<GetGroupResponse>()
    const [error, setError] = useState('')

    const auth = getAuth()

    const id = Number(useParams().id)
    async function getGroupInfo() {
        try {
            if (isNaN(id)) {
                setError("Invalid group number")
                return
            }

            const result = await fetch(`http://localhost:3000/api/groups/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                },
            })

            if (!result.ok) {
                const errorData = await result.json()
                setError(errorData.error || 'Failed to fetch groups')
                return
            }
            const group = await result.json() as GetGroupResponse
            setGroup(group)
        } catch {
            setError("Networking Error. Try again")
        }
    }

    useEffect(() => { getGroupInfo() }, [])

    let groupJsx = <h2> Loading... </h2>
    if (group !== undefined) {
        groupJsx = (
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Member Since</th>
                    </tr>
                </thead>

                <tbody>
                    {group.members.map(member => (
                        <tr
                            key={member.user.id}
                        >
                            <td>{member.user.id}</td>
                            <td>{member.user.name}</td>
                            <td>{member.user.email}</td>
                            <td>{member.role}</td>
                            <td>{new Date(member.joinedAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }
    return (
        <>
            <div>
                <h2> Group Info </h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <label> Group Member Details: </label>
                <br></br>
                {groupJsx}
            </div>
        </>
    )
}

export default DashboardPage
