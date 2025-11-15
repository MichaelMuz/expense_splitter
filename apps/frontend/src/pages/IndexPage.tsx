import { useNavigate } from 'react-router-dom'
import { isAuth } from '../utils/auth'
import { useEffect } from 'react'

function IndexPage() {
    const navigate = useNavigate()
    useEffect(() => {
        if (isAuth()) {
            navigate('/dashboard')
        } else {
            navigate('/landing')
        }
    }, [navigate])
    return <h2> Loading... </h2>
}
export default IndexPage
