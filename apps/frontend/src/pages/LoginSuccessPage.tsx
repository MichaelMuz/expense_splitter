import { useLocation } from 'react-router-dom'

function LoginSuccessPage() {
    const location = useLocation()
    const userData = location.state?.userData
    // const userData = JSON.parse(localStorage.getItem('auth'))

    return (
        <>
            <h2> Success </h2>
            <pre> {JSON.stringify(userData, null, 2)} </pre>
        </>
    )
}

export default LoginSuccessPage
