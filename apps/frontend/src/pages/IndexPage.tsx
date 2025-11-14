import { useNavigate } from 'react-router-dom'

function IndexPage() {
    const navigate = useNavigate()
    return (
        <>
            <h2> Welcome </h2>
            <br></br>
            <button onClick={() => navigate('/register')}> Register </button>
            <br></br>
            <button onClick={() => navigate('/login')}> Login </button>
        </>
    )
}

export default IndexPage
