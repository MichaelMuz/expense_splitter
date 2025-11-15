import { getAuth } from '../utils/auth'

function LoginSuccessPage() {
    const userData = getAuth()

    return (
        <>
            <h2> Success </h2>
            <pre> {JSON.stringify(userData, null, 2)} </pre>
        </>
    )
}

export default LoginSuccessPage
