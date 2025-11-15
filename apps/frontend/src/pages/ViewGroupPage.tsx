import { getAuth } from '../utils/auth'
import type { GetGroupResponse } from 'lib/route-types/group-types.js'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function ViewGroupPage() {
    const [group, setGroup] = useState<GetGroupResponse>()
    const [error, setError] = useState('')

    const auth = getAuth()
    const { id } = useParams()

    const groupId = Number(id)

    async function getGroupInfo() {
        if (isNaN(groupId)) {
            setError("Invalid group id")
            return
        }

        try {
            const result = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
            })

            if (!result.ok) {
                const errorData = await result.json()
                setError(errorData.error || "Failed to fetch group info")
                return
            }

            const data = await result.json() as GetGroupResponse
            setGroup(data)

        } catch {
            setError("Networking Error. Try again")
        }
    }

    useEffect(() => {
        getGroupInfo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    let content = <h2>Loading...</h2>

    if (group) {
        content = (
            <table>
                <thead>
                    <tr>
                        <th>User Id</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Member Since</th>
                    </tr>
                </thead>

                <tbody>
                    {group.members.map(member => (
                        <tr key={member.user.id}>
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
        <div>
            <h2>Group Info</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <label>Group Member Details:</label>
            <br />
            {content}
        </div>
    )
}

export default ViewGroupPage
